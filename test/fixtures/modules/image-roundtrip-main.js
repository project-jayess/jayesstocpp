import { rgb, rgba } from "jayess:color";
import {
  blit,
  create,
  crop,
  flipHorizontal,
  flipVertical,
  getPixel,
  loadBmp,
  loadPgm,
  loadPpm,
  loadTga,
  resizeNearest,
  rotate90,
  saveBmp,
  savePgm,
  savePpm,
  saveTga,
  setPixel,
  transparentBlit
} from "jayess:image";

export function run(ppmPath, bmpPath, pgmPath, tgaPath) {
  var source = create(2, 2, rgb(0, 0, 0));
  setPixel(source, 0, 0, rgb(255, 0, 0));
  setPixel(source, 1, 0, rgb(0, 255, 0));
  setPixel(source, 0, 1, rgb(0, 0, 255));
  setPixel(source, 1, 1, rgb(255, 255, 0));

  savePpm(source, ppmPath);
  saveBmp(source, bmpPath);
  savePgm(source, pgmPath);
  saveTga(source, tgaPath);

  var ppmLoaded = loadPpm(ppmPath);
  var bmpLoaded = loadBmp(bmpPath);
  var pgmLoaded = loadPgm(pgmPath);
  var tgaLoaded = loadTga(tgaPath);

  var edgeCrop = crop(source, 1, 0, 1, 2);
  var resized = resizeNearest(edgeCrop, 2, 4);
  var flippedH = flipHorizontal(source);
  var flippedV = flipVertical(source);
  var rotated = rotate90(source);

  var blitTarget = create(2, 2, rgb(10, 10, 10));
  blit(blitTarget, source, -1, 0);

  var alphaTarget = create(1, 2, rgb(0, 0, 255));
  var alphaSource = create(1, 2, rgba(255, 0, 0, 0));
  setPixel(alphaSource, 0, 1, rgba(255, 0, 0, 1));
  transparentBlit(alphaTarget, alphaSource, 0, 0);

  return [
    getPixel(ppmLoaded, 1, 1).red,
    getPixel(ppmLoaded, 1, 1).green,
    getPixel(bmpLoaded, 1, 0).green,
    getPixel(tgaLoaded, 0, 1).blue,
    getPixel(pgmLoaded, 0, 0).red,
    getPixel(pgmLoaded, 1, 1).red,
    getPixel(edgeCrop, 0, 0).green,
    getPixel(edgeCrop, 0, 1).red,
    getPixel(resized, 1, 3).red,
    getPixel(resized, 1, 0).green,
    getPixel(flippedH, 0, 0).green,
    getPixel(flippedV, 1, 0).red,
    getPixel(rotated, 0, 0).blue,
    getPixel(rotated, 1, 1).green,
    getPixel(blitTarget, 0, 0).green,
    getPixel(blitTarget, 1, 0).red,
    getPixel(alphaTarget, 0, 0).blue,
    getPixel(alphaTarget, 0, 1).red
  ];
}
