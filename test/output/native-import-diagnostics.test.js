import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { JayessError } from "../../src/diagnostics.js";
import { createManagedTempDir } from "../support/temp-dir.js";

test("transpileFile reports missing native artifacts with kind-specific packaging diagnostics", (t) => {
  for (const [filename, source, kind, expected] of [
    ["missing-header.js", 'import { value } from "./missing.hpp";\nexport function run() { return value; }\n', "native-header", /expected an existing native header file/],
    ["missing-source.js", 'import "./missing.cpp";\nexport function run() { return null; }\n', "native-source", /expected an existing native source file/],
    ["missing-shared.js", 'import { value } from "./missing.hpp";\nimport "./missing.dll";\nexport function run() { return value; }\n', "shared-library", /expected an existing shared library artifact/],
    ["missing-static.js", 'import { value } from "./missing.hpp";\nimport "./missing.lib";\nexport function run() { return value; }\n', "static-library", /expected an existing static library artifact/]
  ]) {
    const root = createManagedTempDir(t, `native-diagnostic-${kind}`);
    const entry = path.join(root, filename);
    if (kind === "shared-library" || kind === "static-library") {
      fs.writeFileSync(path.join(root, "missing.hpp"), "#pragma once\n", "utf8");
    }
    fs.writeFileSync(entry, source, "utf8");

    assert.throws(
      () => transpileFile(entry, path.join(root, "out"), { runtimeFragments: "all" }),
      (error) =>
        error instanceof JayessError
        && new RegExp(`Cannot copy ${kind} import`).test(error.diagnostics[0].message)
        && expected.test(error.diagnostics[0].message)
        && error.diagnostics[0].relatedPath != null
    );
  }
});
