import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { createManagedTempDir } from "../support/temp-dir.js";

test("transpileFile emits stream pipe, copy, and chunk generator helpers", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-stream-depth-output");
  const fixture = path.resolve("test/fixtures/modules/stream-main.js");
  const result = transpileFile(fixture, targetDir);
  const streamCpp = path.join(targetDir, "generated-stdlib", "jayess", "stream", "stdlib_jayess_stream_index_js.cpp");

  assert.ok(result.files.includes(streamCpp));
  const source = fs.readFileSync(streamCpp, "utf8");
  assert.match(source, /pipe/);
  assert.match(source, /pipeAll/);
  assert.match(source, /copy/);
  assert.match(source, /chunks/);
  assert.match(source, /readText/);
  assert.match(source, /readAllBytes/);
  assert.match(source, /readAllText/);
  assert.match(source, /toBytes/);
  assert.match(source, /toText/);
  assert.match(source, /collectBytes/);
  assert.match(source, /collectText/);
  assert.match(source, /readLines/);
  assert.match(source, /writeText/);
  assert.match(source, /writeLine/);
  assert.match(source, /pipeText/);
  assert.match(source, /pipeWithCancellation/);
  assert.match(source, /tee/);
});
