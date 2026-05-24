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

test("transpileFile emits http lifecycle helpers and route-param support", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-http-lifecycle-output");
  const fixture = path.resolve("test/fixtures/modules/http-lifecycle-main.js");
  const result = transpileFile(fixture, targetDir);

  const httpPath = generatedStdlibCppPath(targetDir, "http");
  assert.ok(result.files.includes(httpPath));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "http-primitives.hpp")));

  const runtimeHeader = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const runtimeSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");
  const primitiveSource = fs.readFileSync(path.join(targetDir, "native", "http-primitives.hpp"), "utf8");
  const moduleSource = fs.readFileSync(httpPath, "utf8");

  assert.match(runtimeHeader, /value http_close_server\(const value& server\);/);
  assert.match(runtimeSource, /void http_accept_loop\(http_server_ptr server, value handler\)/);
  assert.match(runtimeSource, /throw_closed_handle\("http", "server"\)/);
  assert.match(primitiveSource, /jayessHttpCloseServer/);
  assert.match(moduleSource, /matchRoutePath/);
  assert.match(moduleSource, /params/);
  assert.match(moduleSource, /compose/);
});
