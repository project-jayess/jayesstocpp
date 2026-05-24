import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { createManagedTempDir } from "../support/temp-dir.js";

function documentedBuiltinSpecifiers() {
  const matrixSource = fs.readFileSync(path.resolve("docs/standard-library-matrix.md"), "utf8");
  return [...new Set(
    matrixSource
      .split(/\r?\n/)
      .filter((line) => /^\| `jayess:/.test(line))
      .map((line) => line.match(/`(jayess:[^`]+)`/)[1])
  )].sort();
}

test("transpileFile recognizes every documented built-in Jayess module", (t) => {
  const workspaceDir = createManagedTempDir(t, "builtin-module-audit-workspace");
  const targetDir = createManagedTempDir(t, "builtin-module-audit-output");
  const entryPath = path.join(workspaceDir, "main.js");
  const specifiers = documentedBuiltinSpecifiers();
  const source = `${specifiers.map((specifier) => `import "${specifier}";`).join("\n")}\n\nexport const ready = true;\n`;
  fs.writeFileSync(entryPath, source, "utf8");

  transpileFile(entryPath, targetDir);

  const plan = JSON.parse(fs.readFileSync(path.join(targetDir, "jayess_dependency_plan.json"), "utf8"));
  const entry = plan.modules.find((module) => module.sourceFilename === path.resolve(entryPath));
  assert.ok(entry);
  assert.deepEqual(
    entry.dependencies
      .filter((dependency) => dependency.kind === "builtin-module")
      .map((dependency) => dependency.source)
      .sort(),
    specifiers
  );
});
