import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { createManagedTempDir } from "../support/temp-dir.js";

function generatedStdlibCppPath(targetDir, subpath) {
  const pathParts = subpath.split("/");
  const stem = `stdlib_jayess_${pathParts.join("_")}_index_js`;
  return path.join(targetDir, "generated-stdlib", "jayess", ...pathParts, `${stem}.cpp`);
}

test("transpileFile emits http signed-session helper dependencies", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-http-session-output");
  const fixture = path.resolve("test/fixtures/modules/http-session-main.js");
  const result = transpileFile(fixture, targetDir);

  const httpPath = generatedStdlibCppPath(targetDir, "http");
  const sessionPath = path.join(targetDir, "generated-stdlib", "jayess", "http", "stdlib_jayess_http_session_js.cpp");
  assert.ok(result.files.includes(httpPath));
  assert.ok(result.files.includes(sessionPath));
  assert.ok(result.files.includes(generatedStdlibCppPath(targetDir, "cookie")));
  assert.ok(result.files.includes(generatedStdlibCppPath(targetDir, "crypto")));
  assert.ok(result.files.includes(generatedStdlibCppPath(targetDir, "encoding")));

  const httpSource = fs.readFileSync(httpPath, "utf8");
  const sessionSource = fs.readFileSync(sessionPath, "utf8");
  assert.match(httpSource, /signSession/);
  assert.match(httpSource, /verifySession/);
  assert.match(sessionSource, /sessionSignature/);
  assert.match(sessionSource, /hmacSha256/);
  assert.match(sessionSource, /hexEncode/);
  assert.match(sessionSource, /getSignedCookie/);
  assert.match(sessionSource, /setSignedCookie/);
});
