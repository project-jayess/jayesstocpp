import { base64Decode } from "jayess:encoding";
import { endsWith, replaceAll, slice, split, startsWith, trim } from "jayess:string";

function fail(message) {
  throw message;
}

function normalizePemText(text) {
  return replaceAll(replaceAll(text, "\r\n", "\n"), "\r", "\n");
}

function pemBeginLabel(line) {
  var normalized = trim(line);
  if (!startsWith(normalized, "-----BEGIN ") || !endsWith(normalized, "-----")) {
    return null;
  }
  return trim(slice(normalized, 11, normalized.length - 5));
}

function pemEndLine(label) {
  return "-----END " + label + "-----";
}

function makePemText(label, body) {
  return "-----BEGIN " + label + "-----\n" + body + "\n" + pemEndLine(label);
}

function makePemBlock(label, body) {
  if (body.length === 0) {
    fail("Jayess crypto PEM block body must not be empty");
  }
  return {
    label: label,
    pem: makePemText(label, body),
    der: base64Decode(body)
  };
}

export function parsePemBlocks(text) {
  var lines = split(normalizePemText(text), "\n");
  var blocks = [];
  var index = 0;

  while (index < lines.length) {
    var line = trim(lines[index]);
    if (line.length === 0) {
      index = index + 1;
      continue;
    }

    var label = pemBeginLabel(line);
    if (label === null) {
      fail("Jayess crypto PEM input expects BEGIN/END blocks");
    }

    index = index + 1;
    var body = "";
    var endLine = pemEndLine(label);
    var closed = false;
    while (index < lines.length) {
      var current = trim(lines[index]);
      if (current.length === 0) {
        index = index + 1;
        continue;
      }
      if (current === endLine) {
        closed = true;
        index = index + 1;
        break;
      }
      if (pemBeginLabel(current) !== null) {
        fail("Jayess crypto PEM block is missing a matching END marker");
      }
      body = body + current;
      index = index + 1;
    }

    if (!closed) {
      fail("Jayess crypto PEM block is missing a matching END marker");
    }

    blocks.push(makePemBlock(label, body));
  }

  if (blocks.length === 0) {
    fail("Jayess crypto PEM input expects at least one PEM block");
  }
  return blocks;
}

export function certificateFromPemBlock(block) {
  if (block.label !== "CERTIFICATE") {
    fail("Jayess crypto certificateFromPem expects a CERTIFICATE block");
  }
  return {
    kind: "certificate",
    source: "pem",
    label: block.label,
    pem: block.pem,
    der: block.der
  };
}

export function privateKeyFromPemBlock(block) {
  if (!endsWith(block.label, "PRIVATE KEY")) {
    fail("Jayess crypto privateKeyFromPem expects a PRIVATE KEY block");
  }
  return {
    kind: "privateKey",
    source: "pem",
    label: block.label,
    pem: block.pem,
    der: block.der
  };
}
