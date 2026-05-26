import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { createManagedTempDir } from "../support/temp-dir.js";

test("transpileFile emits crypto hmac, hkdf, pem, and streaming hash helpers", (t) => {
  const targetDir = createManagedTempDir(t, "builtin-crypto-depth-output");
  const fixture = path.resolve("test/fixtures/modules/crypto-main.js");
  const result = transpileFile(fixture, targetDir);
  const cryptoCpp = path.join(targetDir, "generated-stdlib", "jayess", "crypto", "stdlib_jayess_crypto_index_js.cpp");
  const fingerprintCpp = path.join(
    targetDir,
    "generated-stdlib",
    "jayess",
    "crypto",
    "stdlib_jayess_crypto_certificate_fingerprint_js.cpp"
  );

  assert.ok(result.files.includes(cryptoCpp));
  assert.ok(result.files.includes(fingerprintCpp));
  const source = fs.readFileSync(cryptoCpp, "utf8");
  assert.match(source, /hmacSha256/);
  assert.match(source, /hmacSha512/);
  assert.match(source, /hmacSha1/);
  assert.match(source, /hkdfSha256/);
  assert.match(source, /createHash/);
  assert.match(source, /digestHash/);
  assert.match(source, /sha512/);
  assert.match(source, /sha1 \[legacy-only\]/);
  assert.match(source, /certificateFromPem/);
  assert.match(source, /privateKeyFromPem/);
  assert.match(source, /trustAnchorsFromPem/);
  assert.match(source, /certificateMetadata/);
  assert.match(source, /certificateFingerprint/);
  assert.match(source, /certificateVerificationMetadata/);
  assert.match(source, /certificateSubject/);
  assert.match(source, /certificateIssuer/);
  assert.match(source, /certificateSerialNumber/);
  assert.match(source, /certificateValidityStart/);
  assert.match(source, /certificateValidityEnd/);
  assert.match(source, /privateKeyMetadata/);
  assert.match(source, /privateKeyKind/);
  assert.match(source, /privateKeyEncodedLength/);
  assert.match(source, /validateTrustAnchors/);
});
