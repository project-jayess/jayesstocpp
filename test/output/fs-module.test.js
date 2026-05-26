import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { createManagedTempDir } from "../support/temp-dir.js";

test("transpileFile emits recursive filesystem primitive declarations", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-fs-recursive-output");
  const fixture = path.resolve("test/fixtures/modules/fs-recursive-main.js");
  const result = transpileFile(fixture, targetDir);
  const fsModulePath = result.files.find((file) => file.includes("stdlib_jayess_fs_index_js.cpp"));

  assert.ok(fsModulePath);
  assert.ok(fs.existsSync(path.join(targetDir, "native", "fs-primitives.hpp")));

  const primitiveSource = fs.readFileSync(path.join(targetDir, "native", "fs-primitives.hpp"), "utf8");
  const runtimeHeader = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const runtimeSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");

  assert.match(primitiveSource, /jayessFsWalk/);
  assert.match(primitiveSource, /jayessFsCopyRecursive/);
  assert.match(primitiveSource, /jayessFsRemoveRecursive/);
  assert.match(runtimeHeader, /fs_walk_directory\(const std::string& pathText, const value& optionsValue\)/);
  assert.match(runtimeSource, /fs_validate_recursive_options/);
  assert.match(runtimeSource, /copyRecursive target cannot be inside source tree/);
});
