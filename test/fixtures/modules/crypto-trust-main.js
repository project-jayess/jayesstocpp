import {
  certificateChainMetadata,
  certificateFingerprint,
  certificateFromPem,
  certificateValidityAt,
  findTrustAnchorByFingerprint,
  trustAnchorsFromPem
} from "jayess:crypto";

var CERTIFICATE_ONE = "-----BEGIN CERTIFICATE-----\nYWJj\n-----END CERTIFICATE-----";
var CERTIFICATE_TWO = "-----BEGIN CERTIFICATE-----\nZGVm\n-----END CERTIFICATE-----";
var METADATA_CERTIFICATE = "-----BEGIN CERTIFICATE-----\nMFAwSQIBKjAAMA8xDTALBgNVBAMMBElzc0EwHhcNMjQwMTAxMDAwMDAwWhcNMjUwMTAxMDAwMDAwWjAPMQ0wCwYDVQQDDARTdWJCMAADAQA=\n-----END CERTIFICATE-----";

export function inspectCertificateTrust() {
  var anchors = trustAnchorsFromPem(CERTIFICATE_ONE + "\n\n" + CERTIFICATE_TWO);
  var fingerprint = certificateFingerprint(anchors[1], "sha256");
  var found = findTrustAnchorByFingerprint(anchors, fingerprint, "sha256");
  var missing = findTrustAnchorByFingerprint(anchors, "missing", "sha256");
  var metadataCertificate = certificateFromPem(METADATA_CERTIFICATE);
  var current = certificateValidityAt(metadataCertificate, "2024-06-01T00:00:00Z");
  var expired = certificateValidityAt(metadataCertificate, "2026-01-01T00:00:00Z");
  var chain = certificateChainMetadata([metadataCertificate, anchors[0]], "sha256");
  return [
    found.label,
    missing === null,
    current.valid,
    current.reason,
    expired.valid,
    expired.reason,
    chain.kind,
    chain.verified,
    chain.verification,
    chain.certificates.length,
    chain.certificates[0].subject.CN,
    chain.certificates[0].algorithm
  ];
}

export function invalidCertificateValidityTimestamp() {
  return certificateValidityAt(certificateFromPem(METADATA_CERTIFICATE), "");
}
