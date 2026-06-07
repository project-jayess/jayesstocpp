import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { compileAndRunCppExecutable, findAvailableCompiler } from "../support/compiler.js";
import { generatedEntryForFixture } from "../support/generated-executable.js";
import { createManagedTempDir } from "../support/temp-dir.js";
import { transpileFile } from "../../src/api/transpile-file.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function mainSource({ header, namespace }) {
  return `#include <iostream>
#include <variant>
#include "${header}"

int main() {
  ${namespace}::jayess_module_init();
  auto result = ${namespace}::inspect(std::vector<jayess::value>{});
  std::cout << (std::get<bool>(result) ? "ok" : "fail") << "\\n";
  return 0;
}
`;
}

runtimeTest("primitive property reads return null instead of crashing", (t) => {
  const fixturePath = path.resolve("test/fixtures/runtime/primitive-property-main.js");
  const targetDir = createManagedTempDir(t, "runtime-primitive-property");
  const result = transpileFile(fixturePath, targetDir);
  const output = compileAndRunCppExecutable(
    result.files.filter((file) => file.endsWith(".cpp")),
    targetDir,
    mainSource(generatedEntryForFixture(fixturePath)),
    "primitive-property-runtime"
  );

  assert.equal(output.trim(), "ok");
});
