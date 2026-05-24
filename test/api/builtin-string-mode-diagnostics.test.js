import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpile } from "../../src/api/transpile.js";
import { JayessError } from "../../src/diagnostics.js";

function documentedBuiltinSpecifiers() {
  const matrixSource = fs.readFileSync(path.resolve("docs/standard-library-matrix.md"), "utf8");
  return [...new Set(
    matrixSource
      .split(/\r?\n/)
      .filter((line) => /^\| `jayess:/.test(line))
      .map((line) => line.match(/`(jayess:[^`]+)`/)[1])
  )].sort();
}

test("transpile string mode rejects every documented built-in module with explicit resolver guidance", () => {
  for (const specifier of documentedBuiltinSpecifiers()) {
    assert.throws(
      () => transpile(`import "${specifier}";\nexport const ready = true;\n`, { moduleName: "builtin_string_mode_case" }),
      (error) =>
        error instanceof JayessError
        && error.diagnostics.length === 1
        && error.diagnostics[0].relatedPath === specifier
        && new RegExp(`Built-in Jayess module imports such as '${specifier.replace("/", "\\/")}'`).test(error.diagnostics[0].message)
        && /use transpileFile\(\) when the closed module graph needs repository stdlib modules/.test(error.diagnostics[0].message)
        && /transpile\(\) string mode does not resolve them by default/.test(error.diagnostics[0].message)
    );
  }
});
