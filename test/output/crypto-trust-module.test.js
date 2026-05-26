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

test("transpileFile emits crypto certificate trust helper output", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-crypto-trust-output");
  const fixture = path.resolve("test/fixtures/modules/crypto-trust-main.js");
  const result = transpileFile(fixture, targetDir);

  const cryptoPath = generatedStdlibCppPath(targetDir, "crypto");
  const trustPath = path.join(targetDir, "generated-stdlib", "jayess", "crypto", "stdlib_jayess_crypto_certificate_trust_js.cpp");
  assert.ok(result.files.includes(cryptoPath));
  assert.ok(result.files.includes(trustPath));

  const cryptoSource = fs.readFileSync(cryptoPath, "utf8");
  const trustSource = fs.readFileSync(trustPath, "utf8");
  assert.match(cryptoSource, /findTrustAnchorByFingerprint/);
  assert.match(cryptoSource, /certificateValidityAt/);
  assert.match(cryptoSource, /certificateChainMetadata/);
  assert.match(trustSource, /metadata-only/);
  assert.match(trustSource, /missing-validity/);
  assert.match(trustSource, /certificateFingerprint/);
});
