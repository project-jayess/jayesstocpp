import { equals, fromUtf8, length } from "jayess:bytes";
import { hexEncode } from "jayess:encoding";
import {
  createHash,
  digestHash,
  hmacSha1,
  hmacSha256,
  randomBytes,
  sha1,
  sha256,
  updateHash
} from "jayess:crypto";

export function run() {
  var input = fromUtf8("abc");
  var sha256Digest = sha256(input);
  var sha1Digest = sha1(input);
  var hmac256 = hmacSha256(fromUtf8("key"), input);
  var hmac1 = hmacSha1(fromUtf8("key"), input);
  var stream = createHash("sha256");
  updateHash(stream, fromUtf8("a"));
  updateHash(stream, fromUtf8("bc"));
  var streamed = digestHash(stream);
  var random = randomBytes(4);
  return [
    hexEncode(sha256Digest),
    hexEncode(sha1Digest),
    hexEncode(hmac256),
    hexEncode(hmac1),
    equals(streamed, sha256Digest),
    length(random),
    equals(sha256Digest, sha256(input))
  ];
}
