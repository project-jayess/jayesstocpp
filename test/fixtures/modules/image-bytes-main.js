import { rgb } from "jayess:color";
import { length as bytesLength, toUtf8 } from "jayess:bytes";
import { create, decodePgm, decodePpm, encodePgm, encodePpm, getPixel } from "jayess:image";

export function run() {
  var image = create(2, 1, rgb(0, 0, 0));
  var encodedPpm = encodePpm(image);
  var encodedPgm = encodePgm(image);
  var decodedPpm = decodePpm(encodedPpm);
  var decodedPgm = decodePgm(encodedPgm);
  var decodedPixel = getPixel(decodedPgm, 1, 0);

  return [
    bytesLength(encodedPpm),
    bytesLength(encodedPgm),
    toUtf8(encodedPgm),
    getPixel(decodedPpm, 0, 0).blue,
    decodedPixel.red,
    decodedPixel.green,
    decodedPixel.blue
  ];
}

export function invalidDecodePgm() {
  return decodePgm(123);
}
