import { length } from "jayess:bytes";
import { hexEncode } from "jayess:encoding";
import {
  certificateFingerprint,
  certificateFromPem,
  certificateIssuer,
  certificateMetadata,
  certificateSerialNumber,
  certificateSubject,
  certificateVerificationMetadata,
  certificateValidityEnd,
  certificateValidityStart,
  privateKeyEncodedLength,
  privateKeyFromPem,
  privateKeyKind,
  privateKeyMetadata,
  trustAnchorsFromPem,
  validateTrustAnchors
} from "jayess:crypto";

var CERTIFICATE_ONE = "-----BEGIN CERTIFICATE-----\nYWJj\n-----END CERTIFICATE-----";
var CERTIFICATE_TWO = "-----BEGIN CERTIFICATE-----\nZGVm\n-----END CERTIFICATE-----";
var METADATA_CERTIFICATE = "-----BEGIN CERTIFICATE-----\nMFAwSQIBKjAAMA8xDTALBgNVBAMMBElzc0EwHhcNMjQwMTAxMDAwMDAwWhcNMjUwMTAxMDAwMDAwWjAPMQ0wCwYDVQQDDARTdWJCMAADAQA=\n-----END CERTIFICATE-----";
var PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\na2V5\n-----END PRIVATE KEY-----";
var RSA_PRIVATE_KEY = "-----BEGIN RSA PRIVATE KEY-----\ncnNh\n-----END RSA PRIVATE KEY-----";
var DSA_PRIVATE_KEY = "-----BEGIN DSA PRIVATE KEY-----\nZHNh\n-----END DSA PRIVATE KEY-----";

export function run() {
  var certificate = certificateFromPem(CERTIFICATE_ONE);
  var certificateVerification = certificateVerificationMetadata(certificate, "sha256");
  var metadataCertificate = certificateFromPem(METADATA_CERTIFICATE);
  var metadata = certificateMetadata(metadataCertificate);
  var privateKey = privateKeyFromPem(PRIVATE_KEY);
  var rsaPrivateKey = privateKeyFromPem(RSA_PRIVATE_KEY);
  var privateMetadata = privateKeyMetadata(privateKey);
  var anchors = trustAnchorsFromPem(CERTIFICATE_ONE + "\n\n" + CERTIFICATE_TWO);
  validateTrustAnchors(anchors);
  return [
    certificate.kind,
    certificate.label,
    hexEncode(certificate.der),
    privateKey.kind,
    privateKey.label,
    hexEncode(privateKey.der),
    anchors.length,
    anchors[0].kind,
    hexEncode(anchors[1].der),
    length(anchors[0].der),
    metadata.subject.CN,
    metadata.issuer.CN,
    metadata.serialNumber,
    metadata.validityStart,
    metadata.validityEnd,
    certificateSubject(metadataCertificate).CN,
    certificateIssuer(metadataCertificate).CN,
    certificateSerialNumber(metadataCertificate),
    certificateValidityStart(metadataCertificate),
    certificateValidityEnd(metadataCertificate),
    privateMetadata.kind,
    privateMetadata.encodedLength,
    privateKeyKind(rsaPrivateKey),
    privateKeyEncodedLength(rsaPrivateKey),
    certificateFingerprint(certificate, "sha256"),
    certificateVerification.algorithm,
    certificateVerification.fingerprint,
    certificateVerification.kind
  ];
}

export function invalidCertificateLabel() {
  return certificateFromPem(PRIVATE_KEY);
}

export function invalidPrivateKeyLabel() {
  return privateKeyFromPem(CERTIFICATE_ONE);
}

export function invalidPemInput() {
  return certificateFromPem("not pem");
}

export function invalidTrustAnchors() {
  return validateTrustAnchors([privateKeyFromPem(PRIVATE_KEY)]);
}

export function invalidPrivateKeyMetadata() {
  return privateKeyMetadata(certificateFromPem(CERTIFICATE_ONE));
}

export function unsupportedPrivateKeyAlgorithm() {
  return privateKeyFromPem(DSA_PRIVATE_KEY);
}

export function invalidCertificateFingerprint() {
  return certificateFingerprint(privateKeyFromPem(PRIVATE_KEY), "sha256");
}

export function unsupportedCertificateFingerprintAlgorithm() {
  return certificateFingerprint(certificateFromPem(CERTIFICATE_ONE), "md5");
}
