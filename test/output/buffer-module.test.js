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

test("transpileFile resolves built-in Jayess buffer module into generated output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-buffer-output");
  const fixture = path.resolve("test/fixtures/modules/buffer-main.js");
  const result = transpileFile(fixture, targetDir);

  const bufferPath = generatedStdlibCppPath(targetDir, "buffer");
  const bytesPath = generatedStdlibCppPath(targetDir, "bytes");
  assert.ok(result.files.some((file) => file.endsWith("buffer_main_js.cpp")));
  assert.ok(result.files.includes(bufferPath));
  assert.ok(result.files.includes(bytesPath));

  const bufferSource = fs.readFileSync(bufferPath, "utf8");
  assert.match(bufferSource, /jayess:buffer expected a buffer handle/);
  assert.match(bufferSource, /jayess::value concat/);
});
