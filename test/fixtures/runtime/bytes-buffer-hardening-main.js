import {
  fromArray,
  get,
  isBytes,
  length as bytesLength,
  set,
  slice,
  toArray
} from "jayess:bytes";
import { concat, create, fromBytes, read, toBytes, write } from "jayess:buffer";

export function inspect() {
  var bytes = fromArray([1, 2, 3]);
  var alias = bytes;
  set(bytes, 1, 9);

  var sliceCopy = slice(bytes, 0, 2);
  set(bytes, 0, 7);

  var buffer = fromBytes(bytes);
  var readCopy = read(buffer, 0, 2);
  write(buffer, 0, fromArray([5, 6]));
  var combined = concat([buffer, create(1)]);

  return [
    get(alias, 1),
    get(sliceCopy, 0),
    get(toBytes(buffer), 0),
    get(readCopy, 0),
    bytesLength(slice(fromArray([10, 20, 30]), 0, 99)),
    bytesLength(slice(fromArray([10, 20, 30]), 2, 1)),
    isBytes(combined),
    bytesLength(combined),
    toArray(toBytes(buffer))[1]
  ];
}

export function invalidByteNumber() {
  return fromArray([256]);
}

export function invalidGetIndex() {
  return get(fromArray([1]), 1);
}

export function invalidSliceArity() {
  return slice(fromArray([1]), 0, 1, 2);
}

export function invalidBufferInput() {
  return fromBytes("abc");
}

export function invalidBufferWriteRange() {
  return write(create(2), 1, fromArray([1, 2]));
}
