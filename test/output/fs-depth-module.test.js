import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { createManagedTempDir } from "../support/temp-dir.js";

test("transpileFile emits filesystem walk and recursive copy/remove helpers", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-fs-depth-output");
  const fixture = path.resolve("test/fixtures/modules/fs-main.js");
  const result = transpileFile(fixture, targetDir);
  const fsCpp = path.join(targetDir, "generated-stdlib", "jayess", "fs", "stdlib_jayess_fs_index_js.cpp");

  assert.ok(result.files.includes(fsCpp));
  const source = fs.readFileSync(fsCpp, "utf8");
  assert.match(source, /jayessFsCopyRecursive/);
  assert.match(source, /jayessFsRemoveRecursive/);
  assert.match(source, /jayessFsWalk/);
  assert.match(source, /tempDirectorySync/);
  assert.match(source, /readJsonSync/);
  assert.match(source, /writeJsonSync/);
});
