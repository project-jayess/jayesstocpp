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

test("transpileFile resolves built-in Jayess http module into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-http-output");
  const fixture = path.resolve("test/fixtures/modules/http-main.js");
  const result = transpileFile(fixture, targetDir);

  const modulePath = generatedStdlibCppPath(targetDir, "http");
  assert.ok(result.files.some((file) => file.endsWith("http_main_js.cpp")));
  assert.ok(result.files.includes(modulePath));
  assert.ok(fs.existsSync(path.join(targetDir, "native", "http-primitives.hpp")));

  const primitiveSource = fs.readFileSync(path.join(targetDir, "native", "http-primitives.hpp"), "utf8");
  const runtimeHeader = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.hpp"), "utf8");
  const runtimeSource = fs.readFileSync(path.join(targetDir, "runtime", "jayess_runtime.cpp"), "utf8");
  const moduleSource = fs.readFileSync(modulePath, "utf8");
  const dependencyPlan = fs.readFileSync(path.join(targetDir, "jayess_dependency_plan.json"), "utf8");

  assert.match(primitiveSource, /jayessHttpRequest/);
  assert.match(primitiveSource, /jayessHttpResponseText/);
  assert.match(primitiveSource, /jayessHttpResponseBytes/);
  assert.match(primitiveSource, /jayessHttpRequestMethod/);
  assert.match(primitiveSource, /jayessHttpRequestPath/);
  assert.match(primitiveSource, /jayessHttpRequestHeaders/);
  assert.match(primitiveSource, /jayessHttpRequestBody/);
  assert.match(primitiveSource, /jayessHttpCreateServer/);
  assert.match(primitiveSource, /jayessHttpSetStatus/);
  assert.match(primitiveSource, /jayessHttpSetHeader/);
  assert.match(primitiveSource, /jayessHttpWrite/);
  assert.match(primitiveSource, /jayessHttpEnd/);
  assert.match(runtimeHeader, /struct http_response_state/);
  assert.match(runtimeHeader, /value http_request_async\(const value& options\);/);
  assert.match(runtimeHeader, /value http_response_text\(const value& response\);/);
  assert.match(runtimeHeader, /value http_request_method\(const value& request\);/);
  assert.match(runtimeSource, /value http_create_server\(const value& handler, const value& optionsValue\)/);
  assert.match(runtimeSource, /value http_response_bytes\(const value& response\)/);
  assert.match(runtimeSource, /value http_request_body\(const value& request\)/);
  assert.match(runtimeSource, /value http_end_response\(const value& responseValue, const value& body\)/);
  assert.match(runtimeSource, /if \(is_async\(produced\)\)/);
  assert.match(runtimeSource, /await_sync\(produced\)/);
  assert.match(moduleSource, /requestWithCancellation/);
  assert.match(moduleSource, /requestWithTimeout/);
  assert.match(moduleSource, /requestWithTimeoutAndCancellation/);
  assert.match(moduleSource, /bodyText/);
  assert.match(moduleSource, /bodyBytes/);
  assert.match(moduleSource, /collectBody/);
  assert.match(moduleSource, /sendText/);
  assert.match(moduleSource, /sendTextStream/);
  assert.match(moduleSource, /sendBytesStream/);
  assert.match(moduleSource, /sendJson/);
  assert.match(moduleSource, /sendFile/);
  assert.match(dependencyPlan, /"source": "jayess:stream"/);
  assert.match(dependencyPlan, /"source": "jayess:http"/);
  assert.match(dependencyPlan, /"source": "jayess:querystring"/);
  assert.match(dependencyPlan, /"source": "jayess:mime"/);
  assert.match(dependencyPlan, /"source": "jayess:fs"/);
});
