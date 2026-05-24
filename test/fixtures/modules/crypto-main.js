import { equals, fromUtf8, length, secureEquals } from "jayess:bytes";
import { hexEncode } from "jayess:encoding";
import {
  createHash,
  digestHash,
  hkdfSha256,
  hmacSha1,
  hmacSha256,
  hmacSha512,
  randomBytes,
  sha1,
  sha256,
  sha512,
  updateHash
} from "jayess:crypto";

export function run() {
  var input = fromUtf8("abc");
  var sha256Digest = sha256(input);
  var sha1Digest = sha1(input);
  var sha512Digest = sha512(input);
  var hmac256 = hmacSha256(fromUtf8("key"), input);
  var hmac1 = hmacSha1(fromUtf8("key"), input);
  var hmac512 = hmacSha512(fromUtf8("key"), input);
  var hkdf = hkdfSha256(fromUtf8("key"), fromUtf8("salt"), fromUtf8("info"), 42);
  var stream = createHash("sha256");
  updateHash(stream, fromUtf8("a"));
  updateHash(stream, fromUtf8("bc"));
  var streamed = digestHash(stream);
  var random = randomBytes(32);
  var secondRandom = randomBytes(32);
  return [
    hexEncode(sha256Digest),
    hexEncode(sha1Digest),
    hexEncode(sha512Digest),
    hexEncode(hmac256),
    hexEncode(hmac1),
    hexEncode(hmac512),
    hexEncode(hkdf),
    equals(streamed, sha256Digest),
    secureEquals(hmac256, hmacSha256(fromUtf8("key"), input)),
    length(random),
    equals(sha256Digest, sha256(input)),
    equals(random, secondRandom)
  ];
}
