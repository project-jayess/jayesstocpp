import { fromArray, toArray } from "jayess:bytes";
import {
  concat,
  create,
  fromBytes,
  length,
  read,
  toBytes,
  write
} from "jayess:buffer";

export function run() {
  var first = create(4);
  write(first, 1, fromArray([65, 66]));
  var second = fromBytes(fromArray([67, 68]));
  var combined = concat([first, second]);
  var window = read(combined, 1, 4);

  return [
    length(first),
    length(combined),
    toArray(read(first, 0, 4)).length,
    toArray(window).length,
    toArray(toBytes(second)).length
  ];
}
