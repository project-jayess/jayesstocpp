import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { createManagedTempDir } from "../support/temp-dir.js";

test("transpileFile emits ascii and utf16 encoding helpers", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-encoding-depth-output");
  const fixture = path.resolve("test/fixtures/modules/encoding-main.js");
  const result = transpileFile(fixture, targetDir);
  const encodingCpp = path.join(targetDir, "generated-stdlib", "jayess", "encoding", "stdlib_jayess_encoding_index_js.cpp");

  assert.ok(result.files.includes(encodingCpp));
  const source = fs.readFileSync(encodingCpp, "utf8");
  assert.match(source, /jayessEncodingAsciiEncode/);
  assert.match(source, /jayessEncodingAsciiDecode/);
  assert.match(source, /jayessEncodingUtf16Encode/);
  assert.match(source, /jayessEncodingUtf16Decode/);
});
