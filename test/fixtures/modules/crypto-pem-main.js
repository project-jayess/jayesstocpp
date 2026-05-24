import { length } from "jayess:bytes";
import { hexEncode } from "jayess:encoding";
import { certificateFromPem, privateKeyFromPem, trustAnchorsFromPem } from "jayess:crypto";

var CERTIFICATE_ONE = "-----BEGIN CERTIFICATE-----\nYWJj\n-----END CERTIFICATE-----";
var CERTIFICATE_TWO = "-----BEGIN CERTIFICATE-----\nZGVm\n-----END CERTIFICATE-----";
var PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\na2V5\n-----END PRIVATE KEY-----";

export function run() {
  var certificate = certificateFromPem(CERTIFICATE_ONE);
  var privateKey = privateKeyFromPem(PRIVATE_KEY);
  var anchors = trustAnchorsFromPem(CERTIFICATE_ONE + "\n\n" + CERTIFICATE_TWO);
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
    length(anchors[0].der)
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
