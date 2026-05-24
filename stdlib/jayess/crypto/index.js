import {
  jayessCryptoRandomBytes,
  jayessCryptoSha1,
  jayessCryptoSha256,
  jayessCryptoSha512
} from "./crypto-primitives.hpp";
import {
  concat,
  fromArray,
  get,
  isBytes,
  length,
  slice
} from "jayess:bytes";
import {
  certificateFromPemBlock,
  parsePemBlocks,
  privateKeyFromPemBlock
} from "./pem.js";

function fail(message) {
  throw message;
}

function requireBytes(bytes, name) {
  if (!isBytes(bytes)) {
    fail("Jayess crypto " + name + " expects bytes input");
  }
}

export function sha256(bytes) {
  return jayessCryptoSha256(bytes);
}

export function sha512(bytes) {
  return jayessCryptoSha512(bytes);
}

export function sha1(bytes) {
  return jayessCryptoSha1(bytes);
}

export function randomBytes(count) {
  return jayessCryptoRandomBytes(count);
}

function digestByAlgorithm(algorithm, bytes) {
  if (algorithm === "sha256") {
    return sha256(bytes);
  }
  if (algorithm === "sha512") {
    return sha512(bytes);
  }
  if (algorithm === "sha1") {
    return sha1(bytes);
  }
  fail("Jayess crypto unsupported hash algorithm (supported: sha256, sha512, sha1 [legacy-only])");
}

function algorithmBlockSize(algorithm) {
  if (algorithm === "sha512") {
    return 128;
  }
  return 64;
}

function normalizeHmacKey(algorithm, key) {
  var normalized = key;
  var blockSize = algorithmBlockSize(algorithm);
  if (length(normalized) > blockSize) {
    normalized = digestByAlgorithm(algorithm, normalized);
  }

  var values = [];
  for (var index = 0; index < blockSize; index = index + 1) {
    if (index < length(normalized)) {
      values.push(get(normalized, index));
    } else {
      values.push(0);
    }
  }
  return fromArray(values);
}

function xorByte(left, right) {
  var result = 0;
  var factor = 1;
  var leftValue = left;
  var rightValue = right;
  for (var index = 0; index < 8; index = index + 1) {
    var leftBit = leftValue % 2;
    var rightBit = rightValue % 2;
    if (leftBit != rightBit) {
      result = result + factor;
    }
    leftValue = (leftValue - leftBit) / 2;
    rightValue = (rightValue - rightBit) / 2;
    factor = factor * 2;
  }
  return result;
}

function xorBlock(bytes, value) {
  var values = [];
  for (var index = 0; index < length(bytes); index = index + 1) {
    values.push(xorByte(get(bytes, index), value));
  }
  return fromArray(values);
}

function hmac(algorithm, key, bytes) {
  requireBytes(key, "hmac key");
  requireBytes(bytes, "hmac payload");
  var normalized = normalizeHmacKey(algorithm, key);
  var inner = concat(xorBlock(normalized, 54), bytes);
  var outer = concat(xorBlock(normalized, 92), digestByAlgorithm(algorithm, inner));
  return digestByAlgorithm(algorithm, outer);
}

export function hmacSha256(key, bytes) {
  return hmac("sha256", key, bytes);
}

export function hmacSha512(key, bytes) {
  return hmac("sha512", key, bytes);
}

export function hmacSha1(key, bytes) {
  return hmac("sha1", key, bytes);
}

function requireHkdfLength(lengthValue) {
  if (lengthValue !== lengthValue || lengthValue < 0) {
    fail("Jayess crypto hkdfSha256 expects a non-negative integer length");
  }
  if (lengthValue % 1 != 0) {
    fail("Jayess crypto hkdfSha256 expects a non-negative integer length");
  }
  if (lengthValue > 8160) {
    fail("Jayess crypto hkdfSha256 length exceeds the SHA-256 HKDF limit");
  }
}

function byteValue(value) {
  return fromArray([value]);
}

export function hkdfSha256(key, salt, info, lengthValue) {
  requireBytes(key, "hkdfSha256 key");
  requireBytes(salt, "hkdfSha256 salt");
  requireBytes(info, "hkdfSha256 info");
  requireHkdfLength(lengthValue);

  var normalizedSalt = salt;
  if (length(normalizedSalt) === 0) {
    normalizedSalt = fromArray([
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0
    ]);
  }

  var prk = hmacSha256(normalizedSalt, key);
  var output = fromArray([]);
  var previous = fromArray([]);
  var counter = 1;
  while (length(output) < lengthValue) {
    previous = hmacSha256(prk, concat(concat(previous, info), byteValue(counter)));
    output = concat(output, previous);
    counter = counter + 1;
  }
  return slice(output, 0, lengthValue);
}

export function certificateFromPem(text) {
  var blocks = parsePemBlocks(text);
  if (blocks.length !== 1) {
    fail("Jayess crypto certificateFromPem expects exactly one CERTIFICATE block");
  }
  return certificateFromPemBlock(blocks[0]);
}

export function privateKeyFromPem(text) {
  var blocks = parsePemBlocks(text);
  if (blocks.length !== 1) {
    fail("Jayess crypto privateKeyFromPem expects exactly one PRIVATE KEY block");
  }
  return privateKeyFromPemBlock(blocks[0]);
}

export function trustAnchorsFromPem(text) {
  var blocks = parsePemBlocks(text);
  var anchors = [];
  for (var index = 0; index < blocks.length; index = index + 1) {
    anchors.push(certificateFromPemBlock(blocks[index]));
  }
  return anchors;
}

export function createHash(algorithm) {
  return {
    algorithm: algorithm,
    bytes: fromArray([])
  };
}

export function updateHash(handle, bytes) {
  requireBytes(bytes, "hash update");
  handle.bytes = concat(handle.bytes, bytes);
  return handle;
}

export function digestHash(handle) {
  return digestByAlgorithm(handle.algorithm, handle.bytes);
}
