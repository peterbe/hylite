import { execa } from "execa";

import { expect, test } from "bun:test";

async function run(...args: string[]) {
  return await execa("bun", ["run", "src/index.ts", ...args]);
}

test("--help", async () => {
  const { stdout } = await run("--help");
  expect(stdout).toMatch(/Usage: /);
  expect(stdout).toMatch(/Highlights source code to HTML/);
});

test("--version", async () => {
  const { stdout } = await run("--version");
  expect(stdout).toMatch(/\d+\.\d+\.\d+/);
});

test("this file with stdin", async () => {
  const { stdout } = await execa("bun", ["run", "src/index.ts"], {
    inputFile: import.meta.path,
  });
  expect(stdout).toMatch(
    '<span class="hljs-string">&quot;this file with stdin&quot;</span>',
  );
});

test("this file by name", async () => {
  const { stdout } = await run(import.meta.path);
  expect(stdout).toMatch(
    '<span class="hljs-string">&quot;this file by name&quot;</span>',
  );
});

test("code input directly as a string", async () => {
  const { stdout } = await run("alert('hello world')", "-l", "js");
  expect(stdout).toMatch('<span class="hljs-title function_">alert</span>');
});

test("wrap the output in a simple HTML file", async () => {
  const { stdout } = await run("alert('hello world')", "-l", "js", "-w");
  expect(stdout).toMatch("<!doctype html>");
  expect(stdout).toMatch('<style type="text/css">');
  expect(stdout).toMatch('<code class="hljs">');
  expect(stdout).toMatch('<span class="hljs-title function_">alert</span>');
});
