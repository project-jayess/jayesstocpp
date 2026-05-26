import { isBytes } from "jayess:bytes";
import { certificateFingerprint, certificateVerificationMetadata } from "./certificate-fingerprint.js";
import { certificateMetadata, validateTrustAnchors } from "./pem-metadata.js";

function fail(message) {
  throw message;
}

function requireCertificate(certificate) {
  if (certificate === null || certificate.kind !== "certificate" || !isBytes(certificate.der)) {
    fail("Jayess crypto certificate trust helper expects a certificate");
  }
}

function requireTimestamp(value) {
  if (value === null || value === "") {
    fail("Jayess crypto certificate validity timestamp must be a non-empty ISO string");
  }
  return value;
}

function resolvedAlgorithm(algorithm) {
  if (algorithm === null || algorithm === "") {
    return "sha256";
  }
  return algorithm;
}

export function findTrustAnchorByFingerprint(anchors, fingerprint, algorithm) {
  var checked = validateTrustAnchors(anchors);
  var resolved = resolvedAlgorithm(algorithm);
  for (var index = 0; index < checked.length; index = index + 1) {
    var anchor = checked[index];
    if (certificateFingerprint(anchor, resolved) === fingerprint) {
      return anchor;
    }
  }
  return null;
}

export function certificateValidityAt(certificate, timestamp) {
  requireCertificate(certificate);
  var checkedAt = requireTimestamp(timestamp);
  var metadata = certificateMetadata(certificate);
  if (metadata.validityStart === null || metadata.validityEnd === null) {
    return {
      valid: false,
      reason: "missing-validity",
      checkedAt: checkedAt,
      validityStart: metadata.validityStart,
      validityEnd: metadata.validityEnd
    };
  }
  if (checkedAt < metadata.validityStart) {
    return {
      valid: false,
      reason: "not-yet-valid",
      checkedAt: checkedAt,
      validityStart: metadata.validityStart,
      validityEnd: metadata.validityEnd
    };
  }
  if (checkedAt > metadata.validityEnd) {
    return {
      valid: false,
      reason: "expired",
      checkedAt: checkedAt,
      validityStart: metadata.validityStart,
      validityEnd: metadata.validityEnd
    };
  }
  return {
    valid: true,
    reason: "valid",
    checkedAt: checkedAt,
    validityStart: metadata.validityStart,
    validityEnd: metadata.validityEnd
  };
}

export function certificateChainMetadata(certificates, algorithm) {
  if (certificates === null) {
    fail("Jayess crypto certificate chain metadata expects an array of certificates");
  }
  var resolved = resolvedAlgorithm(algorithm);
  var entries = [];
  for (var index = 0; index < certificates.length; index = index + 1) {
    var certificate = certificates[index];
    requireCertificate(certificate);
    var metadata = certificateVerificationMetadata(certificate, resolved);
    entries.push({
      index: index,
      kind: metadata.kind,
      label: metadata.label,
      algorithm: metadata.algorithm,
      fingerprint: metadata.fingerprint,
      subject: metadata.subject,
      issuer: metadata.issuer,
      serialNumber: metadata.serialNumber,
      validityStart: metadata.validityStart,
      validityEnd: metadata.validityEnd
    });
  }
  return {
    kind: "certificate-chain-metadata",
    algorithm: resolved,
    verified: false,
    verification: "metadata-only",
    certificates: entries
  };
}
