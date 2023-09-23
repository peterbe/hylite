#!/usr/bin/env bun

import { readdir } from "fs/promises";
import { extname } from "path";
import { existsSync } from "fs";
import hljs from "highlight.js";

import { Command } from "commander";

const program = new Command();
program
  .description("Highlights source code to HTML")
  .option("-l, --language <language>", "name of language")
  .option("-c, --css [language]", "print out the CSS")
  .option("-w, --wrapped", "put the output in a full HTML page")
  .option("--html-wrap", "put the output in a full HTML page")
  .option("-p, --preview-server", "Start a server to preview the output")
  .option("-o, --output-file <path>", "To file instead of stdout")
  .option("--list-css", "List possible names for CSS files and exit")
  .option("--version", "Prints the current version")
  .argument("[string]", "string to highlight");

program.parse(process.argv);
const options = program.opts();
const args = program.args;

// console.log("options", options);
// console.log("args", args);
let code = "";

if (args[0]) {
  if (existsSync(args[0])) {
    if (!options.language) {
      const ext = extname(args[0]);
      if (ext) {
        options.language = ext.slice(1);
      }
    }
    code = await Bun.file(args[0]).text();
  } else {
    code = args[0];
  }
} else if (options.listCss || options.version || options.css) {
  // pass
} else {
  for await (const line of console) {
    code += line + "\n";
  }
}

const HTML_TEMPLATE = `<!doctype html>
<html>
<head>
<style type="text/css">
__CSS__
</style>
</head>
<body>
<pre>
__CODE__
</pre>
</body>
</html>`;

await main(code, {
  wrapped: options.wrapped,
  htmlWrap: options.htmlWrap,
  language: options.language,
  css: options.css,
  previewServer: options.previewServer,
  outputFile: options.outputFile,
  listCss: options.listCss,
  version: options.version,
});

async function main(
  code: string,
  {
    wrapped = false,
    htmlWrap = false,
    language = "",
    css = null,
    previewServer = false,
    outputFile = "",
    listCss = false,
    version = false,
  }: {
    wrapped?: boolean;
    htmlWrap?: boolean;
    language?: string;
    css?: null | string | boolean;
    previewServer?: boolean;
    outputFile?: string;
    listCss?: boolean;
    version?: boolean;
  } = {},
) {
  if (version) {
    const packageJson = require("../package.json");
    process.stdout.write(`${packageJson.version}\n`);
    return;
  }
  if (listCss) {
    const cssNames = await getCSSNames();
    process.stdout.write(cssNames.join("\n") + "\n");
    return;
  }

  if (css === true || previewServer) {
    css = "default";
  }

  let cssContent = "";

  if (css && !code && !previewServer) {
    const cssFile = Bun.file(`node_modules/highlight.js/styles/${css}.css`);
    cssContent = await cssFile.text();
    process.stdout.write(cssContent);
    return;
  }
  if (!code) {
    throw new Error("No code to highlight");
  }

  const output = language
    ? hljs.highlight(code, { language }).value
    : hljs.highlightAuto(code).value;

  if (previewServer) {
    const codeOutput = `<code class="hljs">${output}</code>`;
    startServer(codeOutput, css || "");
  } else if (htmlWrap) {
    const cssName = typeof css === "string" ? css : "default";

    const cssContent = await getCSS(cssName);
    const codeOutput = `<code class="hljs">${output}</code>`;
    const headStyle = getHeadStyle(cssName);

    const html = HTML_TEMPLATE.replace("</head>", `${headStyle}</head>`)
      .replace("__CODE__", codeOutput)
      .replace("__CSS__", cssContent);
    if (outputFile) {
      await Bun.write(outputFile, html);
    } else {
      process.stdout.write(html);
    }
  } else if (outputFile) {
    await Bun.write(outputFile, output);
  } else {
    if (wrapped) {
      process.stdout.write(`<pre><code class="hljs">${output}</code></pre>`);
    } else {
      process.stdout.write(output);
    }
  }
}

async function getCSS(name = "default") {
  const cssFile = Bun.file(`node_modules/highlight.js/styles/${name}.css`);
  return await cssFile.text();
}

async function getCSSNames() {
  const cssFiles = (await readdir("node_modules/highlight.js/styles"))
    .filter((f) => f.endsWith(".css"))
    .sort((a, b) => a.localeCompare(b));
  return cssFiles.map((f) => f.slice(0, -4));
}

function getHeadStyle(cssName: string) {
  const darkMode = /\bdark\b/.test(cssName);

  let mainCSS = `body {
    margin: 0;
    padding: 0;
    font-family: monospace;
    background-color: ${darkMode ? "#222" : "#fff"};
    color: ${darkMode ? "#fff" : "#222"};
}`;
  return `<style type="text/css">${mainCSS}</style>`;
}

function startServer(code: string, cssName = "", port = 3000) {
  Bun.serve({
    port,
    async fetch(req) {
      const cssNames = await getCSSNames();
      const url = new URL(req.url);
      if (url.pathname === "/") {
        let choicesHtml = '<ul class="choices">';
        for (const name of cssNames) {
          choicesHtml += `<li><a href="?css=${name}">${name}</a></li>`;
        }
        choicesHtml += "</ul>\n<hr>\n";
        const choicesStyle =
          "<style>ul.choices li { display:inline; margin-right: 5px }</style>\n";
        const loadedCssName = url.searchParams.get("css") || cssName;

        let css = "";
        try {
          css = await getCSS(loadedCssName);
        } catch (error) {
          if (
            error instanceof Error &&
            "code" in error &&
            error.code === "ENOENT"
          ) {
            return new Response("css file not found", { status: 400 });
          }
        }

        const headStyle = getHeadStyle(loadedCssName);
        return new Response(
          HTML_TEMPLATE.replace("</head>", `${headStyle}${choicesStyle}</head>`)
            .replace("<body>", `<body>${choicesHtml}`)
            .replace("__CODE__", code)
            .replace("__CSS__", css),
          {
            headers: new Headers({
              "Content-Type": "text/html; charset=utf-8",
            }),
          },
        );
      }
      return new Response("not found", { status: 404 });
    },
  });
  console.log(`Now open http://localhost:${port}`);
}
