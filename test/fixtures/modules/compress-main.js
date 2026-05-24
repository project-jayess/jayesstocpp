import { deflate, gzip, gunzip, inflate } from "jayess:compress";
import { equals, fromUtf8, toUtf8 } from "jayess:bytes";

export function roundTrip() {
  var source = fromUtf8("hello compress");
  var inflated = inflate(deflate(source));
  var ungzipped = gunzip(gzip(source));
  return equals(source, inflated) && equals(source, ungzipped) && toUtf8(ungzipped) === "hello compress";
}

export function badInflate() {
  return inflate(fromUtf8("bad"));
}

export function badGunzip() {
  return gunzip(fromUtf8("bad"));
}
