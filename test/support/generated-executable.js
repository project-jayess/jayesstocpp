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

export function runtimeHostSkipMessage({ moduleName, adapter, capability, host = process.platform }) {
  const adapterLabel = adapter == null ? "host" : adapter;
  const capabilityLabel = capability == null ? "runtime probe" : capability;
  return `${moduleName} ${adapterLabel} ${capabilityLabel} is unavailable on this host (${host})`;
}

export function skipIfRuntimeUnavailableOutput(t, output, marker, details) {
  if (output.trim() !== marker) {
    return false;
  }
  t.skip(runtimeHostSkipMessage(details));
  return true;
}
