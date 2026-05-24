import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { createManagedTempDir } from "../support/temp-dir.js";

test("transpileFile emits crypto hmac and streaming hash helpers", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-crypto-depth-output");
  const fixture = path.resolve("test/fixtures/modules/crypto-main.js");
  const result = transpileFile(fixture, targetDir);
  const cryptoCpp = path.join(targetDir, "generated-stdlib", "jayess", "crypto", "stdlib_jayess_crypto_index_js.cpp");

  assert.ok(result.files.includes(cryptoCpp));
  const source = fs.readFileSync(cryptoCpp, "utf8");
  assert.match(source, /hmacSha256/);
  assert.match(source, /hmacSha1/);
  assert.match(source, /createHash/);
  assert.match(source, /digestHash/);
});
