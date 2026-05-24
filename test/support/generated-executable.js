import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { toModuleNamespace, toModuleStem } from "../../src/cpp/module-names.js";
import { compileAndRunCppExecutable } from "./compiler.js";
import { createManagedTempDir } from "./temp-dir.js";

export function generatedEntryForFixture(fixturePath) {
  const resolvedFixture = path.resolve(fixturePath);
  const stem = toModuleStem(resolvedFixture, path.dirname(resolvedFixture));
  return {
    header: `${stem}.hpp`,
    namespace: toModuleNamespace(stem)
  };
}

export function transpileAndRunFixture(t, fixturePath, tempName, mainSource) {
  const targetDir = createManagedTempDir(t, tempName);
  const result = transpileFile(path.resolve(fixturePath), targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));

  return compileAndRunCppExecutable(cppFiles, targetDir, mainSource(targetDir, generatedEntryForFixture(fixturePath)));
}
