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

test("transpileFile emits http serveStatic helper dependencies", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-http-static-output");
  const fixture = path.resolve("test/fixtures/modules/http-static-main.js");
  const result = transpileFile(fixture, targetDir);

  const httpPath = generatedStdlibCppPath(targetDir, "http");
  assert.ok(result.files.includes(httpPath));
  assert.ok(result.files.includes(generatedStdlibCppPath(targetDir, "fs")));
  assert.ok(result.files.includes(generatedStdlibCppPath(targetDir, "path")));
  assert.ok(result.files.includes(generatedStdlibCppPath(targetDir, "mime")));

  const moduleSource = fs.readFileSync(httpPath, "utf8");
  assert.match(moduleSource, /serveStatic/);
  assert.match(moduleSource, /serveFiles/);
  assert.match(moduleSource, /staticCacheControl/);
  assert.match(moduleSource, /encodedUnsafeStaticPath/);
  assert.match(moduleSource, /staticContentType/);
  assert.match(moduleSource, /deleteThenSendFile/);
  assert.match(moduleSource, /Cache-Control/);
  assert.match(moduleSource, /safeStaticPath/);
  assert.match(moduleSource, /jayess:http serveStatic root must be non-empty/);
  assert.match(moduleSource, /file read failed/);
  assert.match(moduleSource, /unsafe path/);
});
