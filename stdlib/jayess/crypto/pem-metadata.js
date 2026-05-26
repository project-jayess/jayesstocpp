import { get, length, slice, toUtf8 } from "jayess:bytes";
import { hexEncode } from "jayess:encoding";

function fail(message) {
  throw message;
}

function derLength(bytes, offset) {
  if (offset >= length(bytes)) {
    fail("Jayess crypto PEM DER is malformed");
  }
  var first = get(bytes, offset);
  if (first < 128) {
    return {
      length: first,
      next: offset + 1
    };
  }
  var count = first - 128;
  if (count <= 0 || count > 4 || offset + count >= length(bytes)) {
    fail("Jayess crypto PEM DER length is malformed");
  }
  var value = 0;
  for (var index = 0; index < count; index = index + 1) {
    value = value * 256 + get(bytes, offset + 1 + index);
  }
  return {
    length: value,
    next: offset + 1 + count
  };
}

function derNode(bytes, offset) {
  if (offset >= length(bytes)) {
    fail("Jayess crypto PEM DER is malformed");
  }
  var parsedLength = derLength(bytes, offset + 1);
  var start = parsedLength.next;
  var end = start + parsedLength.length;
  if (end > length(bytes)) {
    fail("Jayess crypto PEM DER length exceeds input");
  }
  return {
    tag: get(bytes, offset),
    start: start,
    end: end,
    next: end
  };
}

function derChildren(bytes, node) {
  var children = [];
  var offset = node.start;
  while (offset < node.end) {
    var child = derNode(bytes, offset);
    children.push(child);
    offset = child.next;
  }
  if (offset !== node.end) {
    fail("Jayess crypto PEM DER sequence is malformed");
  }
  return children;
}

function oidName(bytes, node) {
  if (node.end - node.start === 3 && get(bytes, node.start) === 85 && get(bytes, node.start + 1) === 4) {
    var id = get(bytes, node.start + 2);
    if (id === 3) {
      return "CN";
    }
    if (id === 6) {
      return "C";
    }
    if (id === 7) {
      return "L";
    }
    if (id === 8) {
      return "ST";
    }
    if (id === 10) {
      return "O";
    }
    if (id === 11) {
      return "OU";
    }
  }
  return "OID:" + hexEncode(slice(bytes, node.start, node.end));
}

function textValue(bytes, node) {
  if (node.tag === 12 || node.tag === 19 || node.tag === 22) {
    return toUtf8(slice(bytes, node.start, node.end));
  }
  return hexEncode(slice(bytes, node.start, node.end));
}

function parseName(bytes, node) {
  if (node.tag !== 48) {
    return null;
  }
  var parts = {};
  var sets = derChildren(bytes, node);
  for (var setIndex = 0; setIndex < sets.length; setIndex = setIndex + 1) {
    var setNode = sets[setIndex];
    if (setNode.tag !== 49) {
      continue;
    }
    var setChildren = derChildren(bytes, setNode);
    if (setChildren.length === 0) {
      continue;
    }
    var pairChildren = derChildren(bytes, setChildren[0]);
    if (pairChildren.length < 2 || pairChildren[0].tag !== 6) {
      continue;
    }
    parts[oidName(bytes, pairChildren[0])] = textValue(bytes, pairChildren[1]);
  }
  return parts;
}

function parseTime(bytes, node) {
  var text = toUtf8(slice(bytes, node.start, node.end));
  if (node.tag === 23 && text.length >= 13) {
    var prefix = text[0] < "5" ? "20" : "19";
    return prefix + text.slice(0, 2) + "-" + text.slice(2, 4) + "-" + text.slice(4, 6) + "T" + text.slice(6, 8) + ":" + text.slice(8, 10) + ":" + text.slice(10, 12) + "Z";
  }
  if (node.tag === 24 && text.length >= 15) {
    return text.slice(0, 4) + "-" + text.slice(4, 6) + "-" + text.slice(6, 8) + "T" + text.slice(8, 10) + ":" + text.slice(10, 12) + ":" + text.slice(12, 14) + "Z";
  }
  return text;
}

function emptyCertificateMetadata() {
  return {
    subject: null,
    issuer: null,
    serialNumber: null,
    validityStart: null,
    validityEnd: null
  };
}

export function certificateMetadata(certificate) {
  if (certificate.kind !== "certificate") {
    fail("Jayess crypto certificate metadata expects a certificate");
  }
  try {
    var root = derNode(certificate.der, 0);
    if (root.tag !== 48 || root.next !== length(certificate.der)) {
      return emptyCertificateMetadata();
    }
    var certificateChildren = derChildren(certificate.der, root);
    if (certificateChildren.length < 1 || certificateChildren[0].tag !== 48) {
      return emptyCertificateMetadata();
    }
    var tbs = derChildren(certificate.der, certificateChildren[0]);
    var index = 0;
    if (tbs.length > 0 && tbs[0].tag === 160) {
      index = 1;
    }
    if (tbs.length < index + 5) {
      return emptyCertificateMetadata();
    }
    var serial = tbs[index];
    var issuer = tbs[index + 2];
    var validity = tbs[index + 3];
    var subject = tbs[index + 4];
    var times = derChildren(certificate.der, validity);
    return {
      subject: parseName(certificate.der, subject),
      issuer: parseName(certificate.der, issuer),
      serialNumber: serial.tag === 2 ? hexEncode(slice(certificate.der, serial.start, serial.end)) : null,
      validityStart: times.length > 0 ? parseTime(certificate.der, times[0]) : null,
      validityEnd: times.length > 1 ? parseTime(certificate.der, times[1]) : null
    };
  } catch (error) {
    return emptyCertificateMetadata();
  }
}

export function privateKeyMetadata(privateKey) {
  if (privateKey.kind !== "privateKey") {
    fail("Jayess crypto private key metadata expects a private key");
  }
  var keyKind = "pkcs8";
  if (privateKey.label === "RSA PRIVATE KEY") {
    keyKind = "rsa";
  } else if (privateKey.label === "EC PRIVATE KEY") {
    keyKind = "ec";
  }
  return {
    kind: keyKind,
    encodedLength: length(privateKey.der)
  };
}

export function validateTrustAnchors(anchors) {
  if (anchors === null) {
    fail("Jayess crypto trust anchors must be an array of certificates");
  }
  for (var index = 0; index < anchors.length; index = index + 1) {
    var anchor = anchors[index];
    if (anchor === null || anchor.kind !== "certificate") {
      fail("Jayess crypto trust anchors must contain only certificates");
    }
  }
  return anchors;
}
