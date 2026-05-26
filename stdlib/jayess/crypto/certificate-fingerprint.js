import {
  jayessCryptoSha1,
  jayessCryptoSha256,
  jayessCryptoSha512
} from "./crypto-primitives.hpp";
import { isBytes } from "jayess:bytes";
import { hexEncode } from "jayess:encoding";
import { certificateMetadata } from "./pem-metadata.js";

function fail(message) {
  throw message;
}

function requireCertificate(certificate) {
  if (certificate === null || certificate.kind !== "certificate" || !isBytes(certificate.der)) {
    fail("Jayess crypto certificate fingerprint expects a certificate");
  }
}

function digestCertificate(certificate, algorithm) {
  if (algorithm === "sha256") {
    return jayessCryptoSha256(certificate.der);
  }
  if (algorithm === "sha512") {
    return jayessCryptoSha512(certificate.der);
  }
  if (algorithm === "sha1") {
    return jayessCryptoSha1(certificate.der);
  }
  fail("Jayess crypto certificate fingerprint unsupported algorithm (supported: sha256, sha512, sha1 [legacy-only])");
}

export function certificateFingerprint(certificate, algorithm) {
  requireCertificate(certificate);
  return hexEncode(digestCertificate(certificate, algorithm));
}

export function certificateVerificationMetadata(certificate, algorithm) {
  requireCertificate(certificate);
  var metadata = certificateMetadata(certificate);
  return {
    kind: certificate.kind,
    source: certificate.source,
    label: certificate.label,
    algorithm: algorithm,
    fingerprint: certificateFingerprint(certificate, algorithm),
    subject: metadata.subject,
    issuer: metadata.issuer,
    serialNumber: metadata.serialNumber,
    validityStart: metadata.validityStart,
    validityEnd: metadata.validityEnd
  };
}
