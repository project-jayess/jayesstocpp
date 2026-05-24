import {
  compare,
  concat,
  endsWith,
  equals,
  fill,
  fromArray,
  fromUtf8,
  get,
  isBytes,
  length,
  set,
  secureEquals,
  slice,
  startsWith,
  toArray,
  toUtf8
} from "jayess:bytes";

export function run() {
  var left = fromUtf8("Jay");
  var right = fromUtf8("ess");
  var combined = concat(left, right);
  var middle = slice(combined, 1, 4);
  var raw = fromArray([65, 66, 67]);
  set(raw, 1, 97);
  var beforeFill = get(raw, 1);
  fill(raw, 90);
  return [
    toUtf8(combined),
    toUtf8(middle),
    length(combined),
    equals(combined, fromUtf8("Jayess")),
    isBytes(combined),
    toArray(raw).length,
    beforeFill,
    get(raw, 0),
    compare(fromUtf8("a"), fromUtf8("b")),
    secureEquals(fromUtf8("token"), fromUtf8("token")),
    secureEquals(fromUtf8("token"), fromUtf8("taken")),
    secureEquals(fromUtf8("short"), fromUtf8("shorter")),
    startsWith(combined, left),
    endsWith(combined, right)
  ];
}
