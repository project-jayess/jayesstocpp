import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { compileAndRunCppExecutable, findAvailableCompiler } from "../support/compiler.js";
import { generatedEntryForFixture } from "../support/generated-executable.js";
import { createManagedTempDir } from "../support/temp-dir.js";
import { transpileFile } from "../../src/api/transpile-file.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function mainSource({ header, namespace }, imagePath) {
  return `#include <iostream>
#include <string>
#include "${header}"

int main() {
  ${namespace}::jayess_module_init();
  ${namespace}::renderScene(std::vector<jayess::value>{std::string(${JSON.stringify(imagePath)})});
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("canvas HTML layout renders through generated C++ without JS string methods", (t) => {
  const fixturePath = path.resolve("test/fixtures/modules/canvas-html-main.js");
  const targetDir = createManagedTempDir(t, "runtime-canvas-html-layout");
  const imagePath = path.join(targetDir, "canvas-html.ppm");
  const result = transpileFile(fixturePath, targetDir);
  const output = compileAndRunCppExecutable(
    result.files.filter((file) => file.endsWith(".cpp")),
    targetDir,
    mainSource(generatedEntryForFixture(fixturePath), imagePath),
    "canvas-html-layout-runtime"
  );

  assert.equal(output.trim(), "ok");
  assert.equal(fs.existsSync(imagePath), true);
  assert.notEqual(fs.statSync(imagePath).size, 0);
});
