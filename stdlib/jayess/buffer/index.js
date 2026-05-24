import {
  concat as concatBytes,
  fromArray,
  get as getByte,
  isBytes,
  length as byteLength,
  set as setByte,
  slice
} from "jayess:bytes";

function fail(message) {
  throw message;
}

function requireBuffer(value) {
  if (!isBytes(value)) {
    fail("jayess:buffer expected a buffer handle");
  }
}

function requireBytes(value) {
  if (!isBytes(value)) {
    fail("jayess:buffer expected a jayess:bytes value");
  }
}

function requireRange(buffer, offset, size) {
  if (offset < 0 || size < 0 || offset + size > byteLength(buffer)) {
    fail("jayess:buffer range is outside buffer bounds");
  }
}

function makeZeroBytes(size) {
  if (size < 0) {
    fail("jayess:buffer size must be non-negative");
  }

  var values = [];
  for (var index = 0; index < size; index = index + 1) {
    values.push(0);
  }
  return fromArray(values);
}

export function create(size) {
  return fromBytes(makeZeroBytes(size));
}

export function fromBytes(bytes) {
  requireBytes(bytes);
  return bytes;
}

export function toBytes(buffer) {
  requireBuffer(buffer);
  return buffer;
}

export function length(buffer) {
  requireBuffer(buffer);
  return byteLength(buffer);
}

export function read(buffer, offset, size) {
  requireBuffer(buffer);
  requireRange(buffer, offset, size);
  return slice(buffer, offset, offset + size);
}

export function write(buffer, offset, bytes) {
  requireBuffer(buffer);
  requireBytes(bytes);
  requireRange(buffer, offset, byteLength(bytes));

  for (var index = 0; index < byteLength(bytes); index = index + 1) {
    setByte(buffer, offset + index, getByte(bytes, index));
  }
  return buffer;
}

export function concat(buffers) {
  var bytes = fromArray([]);
  for (var index = 0; index < buffers.length; index = index + 1) {
    bytes = concatBytes(bytes, toBytes(buffers[index]));
  }
  return fromBytes(bytes);
}
