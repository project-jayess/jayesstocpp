import { get, set } from "jayess:bytes";
import { randomBytes } from "jayess:crypto";
import { hexEncode } from "jayess:encoding";

function lowerNibble(value) {
  return value % 16;
}

function lowerSixBits(value) {
  return value % 64;
}

export function v4() {
  var bytes = randomBytes(16);
  set(bytes, 6, get(bytes, 6) - lowerNibble(get(bytes, 6)) + 64);
  set(bytes, 8, get(bytes, 8) - lowerSixBits(get(bytes, 8)) + 128);

  var text = hexEncode(bytes);
  return text.slice(0, 8)
    + "-"
    + text.slice(8, 12)
    + "-"
    + text.slice(12, 16)
    + "-"
    + text.slice(16, 20)
    + "-"
    + text.slice(20);
}

export function isUuid(text) {
  return text.length === 36
    && text.slice(8, 9) === "-"
    && text.slice(13, 14) === "-"
    && text.slice(18, 19) === "-"
    && text.slice(23, 24) === "-";
}
