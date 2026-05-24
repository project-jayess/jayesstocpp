import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { createManagedTempDir } from "../support/temp-dir.js";

test("transpileFile emits path parse, format, separator, and delimiter helpers", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-path-expanded-output");
  const fixture = path.resolve("test/fixtures/modules/path-main.js");
  const result = transpileFile(fixture, targetDir);
  const pathCpp = path.join(targetDir, "generated-stdlib", "jayess", "path", "stdlib_jayess_path_index_js.cpp");

  assert.ok(result.files.includes(pathCpp));
  const source = fs.readFileSync(pathCpp, "utf8");
  assert.match(source, /jayessPathParse/);
  assert.match(source, /jayessPathFormat/);
  assert.match(source, /jayessPathSeparator/);
  assert.match(source, /jayessPathDelimiter/);
});
