await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  target: "node",
});

await retroFix();

async function retroFix() {
  // Got this from
  // https://github.com/oven-sh/bun/issues/5707#issuecomment-1730511178
  const IMPORT_META_REQUIRE_POLYFILL = `import { createRequire as createImportMetaRequire } from "module"; import.meta.require ||= (id) => createImportMetaRequire(import.meta.url)(id);`;
  const DIST_FILE = "./dist/index.js";
  const outputFile = Bun.file(DIST_FILE);
  const output = await outputFile.text();
  const newLines: string[] = [];
  for (const line of output.split("\n")) {
    newLines.push(line);
    if (line.startsWith("#!")) {
      newLines.push(IMPORT_META_REQUIRE_POLYFILL);
    }
  }
  const newOutput = newLines.join("\n");
  await Bun.write(DIST_FILE, newOutput);
}
