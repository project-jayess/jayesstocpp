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

test("transpileFile emits http request helper module", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-http-request-helpers-output");
  const fixture = path.resolve("test/fixtures/modules/http-request-helpers-main.js");
  const result = transpileFile(fixture, targetDir);

  const httpPath = generatedStdlibCppPath(targetDir, "http");
  const requestPath = path.join(targetDir, "generated-stdlib", "jayess", "http", "stdlib_jayess_http_request_js.cpp");
  assert.ok(result.files.includes(httpPath));
  assert.ok(result.files.includes(requestPath));

  const httpSource = fs.readFileSync(httpPath, "utf8");
  const requestSource = fs.readFileSync(requestPath, "utf8");
  assert.match(httpSource, /queryParam/);
  assert.match(requestSource, /jayessHttpRequestPath/);
  assert.match(requestSource, /parseQuery/);
  assert.match(requestSource, /pathname/);
});
