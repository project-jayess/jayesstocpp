import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { createManagedTempDir } from "../support/temp-dir.js";

function readGeneratedFiles(result) {
  return result.files
    .map((file) => [path.basename(file), fs.readFileSync(file, "utf8")])
    .sort(([left], [right]) => left.localeCompare(right));
}

function readRelativeTree(rootDir) {
  const files = [];

  function visit(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
        continue;
      }
      files.push([
        path.relative(rootDir, fullPath).replace(/\\/g, "/"),
        fs.readFileSync(fullPath, "utf8")
      ]);
    }
  }

  visit(rootDir);
  return files.sort(([left], [right]) => left.localeCompare(right));
}

test("transpileFile output is deterministic across repeated runs", (t) => {
  const fixture = path.resolve("test/fixtures/modules/namespace-main.js");
  const firstDir = createManagedTempDir(t, "determinism-one");
  const secondDir = createManagedTempDir(t, "determinism-two");

  const first = transpileFile(fixture, firstDir, { projectKind: "shared-library", libraryName: "demo" });
  const second = transpileFile(fixture, secondDir, { projectKind: "shared-library", libraryName: "demo" });

  assert.deepEqual(readGeneratedFiles(first), readGeneratedFiles(second));
});

test("transpileFile package/scoped-package output layout is deterministic across repeated runs", (t) => {
  const fixture = path.resolve("test/fixtures/package-project/src/main.js");
  const firstDir = createManagedTempDir(t, "package-determinism-one");
  const secondDir = createManagedTempDir(t, "package-determinism-two");

  const first = transpileFile(fixture, firstDir);
  const second = transpileFile(fixture, secondDir);

  assert.deepEqual(readGeneratedFiles(first), readGeneratedFiles(second));
});

test("transpileFile native-artifact output tree is deterministic across repeated runs", (t) => {
  const fixture = path.resolve("test/fixtures/modules/library-user.js");
  const firstDir = createManagedTempDir(t, "native-determinism-one");
  const secondDir = createManagedTempDir(t, "native-determinism-two");

  transpileFile(fixture, firstDir);
  transpileFile(fixture, secondDir);

  assert.deepEqual(readRelativeTree(firstDir), readRelativeTree(secondDir));
});
