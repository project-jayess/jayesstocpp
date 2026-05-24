import {
  jayessCryptoRandomBytes,
  jayessCryptoSha1,
  jayessCryptoSha256
} from "./crypto-primitives.hpp";
import {
  concat,
  fromArray,
  get,
  isBytes,
  length
} from "jayess:bytes";

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
  if (algorithm === "sha1") {
    return sha1(bytes);
  }
  fail("Jayess crypto unsupported hash algorithm");
}

function normalizeHmacKey(algorithm, key) {
  var normalized = key;
  if (length(normalized) > 64) {
    normalized = digestByAlgorithm(algorithm, normalized);
  }

  var values = [];
  for (var index = 0; index < 64; index = index + 1) {
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

export function hmacSha1(key, bytes) {
  return hmac("sha1", key, bytes);
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
