import { fromUtf8, toUtf8 } from "jayess:bytes";
import {
  base64Decode,
  base64Encode,
  asciiDecode,
  asciiEncode,
  hexDecode,
  hexEncode,
  utf16Decode,
  utf16Encode,
  uriDecode,
  uriEncode
} from "jayess:encoding";

export function run() {
  var bytes = fromUtf8("Jayess");
  var base64 = base64Encode(bytes);
  var hex = hexEncode(bytes);
  var ascii = asciiEncode("ASCII");
  var utf16 = utf16Encode("Wide");
  var uri = uriEncode("Jayess bytes");
  return [
    base64,
    toUtf8(base64Decode(base64)),
    hex,
    toUtf8(hexDecode(hex)),
    asciiDecode(ascii),
    utf16Decode(utf16),
    uri,
    uriDecode(uri)
  ];
}
