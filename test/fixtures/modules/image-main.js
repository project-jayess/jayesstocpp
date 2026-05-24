import { rgb, rgba } from "jayess:color";
import { length as bytesLength } from "jayess:bytes";
import {
  blit,
  copy,
  create,
  crop,
  decodePpm,
  encodePpm,
  fill,
  flipHorizontal,
  flipVertical,
  getPixel,
  height,
  isImage,
  loadBmp,
  loadPgm,
  loadPpm,
  loadTga,
  metadataFromFile,
  rotate90,
  resizeNearest,
  saveBmp,
  savePgm,
  savePpm,
  saveTga,
  setPixel,
  transparentBlit,
  width
} from "jayess:image";

export function run(outputPath, bmpPath, pgmPath, tgaPath) {
  var image = create(3, 2, rgb(0, 0, 0));
  setPixel(image, 1, 0, rgb(255, 0, 0));
  setPixel(image, 2, 1, rgb(0, 0, 255));

  var copied = copy(image);
  fill(image, rgb(0, 255, 0));
  var pixel = getPixel(copied, 1, 0);
  savePpm(copied, outputPath);
  saveBmp(copied, bmpPath);
  savePgm(copied, pgmPath);
  saveTga(copied, tgaPath);

  var loaded = loadPpm(outputPath);
  var loadedBmp = loadBmp(bmpPath);
  var loadedPgm = loadPgm(pgmPath);
  var loadedTga = loadTga(tgaPath);
  var cropped = crop(loaded, 1, 0, 2, 2);
  var resized = resizeNearest(cropped, 4, 2);
  var target = create(4, 3, rgb(0, 255, 0));
  blit(target, resized, 1, 1);
  var flippedH = flipHorizontal(loadedBmp);
  var flippedV = flipVertical(loadedBmp);
  var rotated = rotate90(loadedBmp);
  var alphaTarget = create(1, 1, rgb(0, 0, 255));
  var alphaSource = create(1, 1, rgba(255, 0, 0, 0.5));
  transparentBlit(alphaTarget, alphaSource, 0, 0);
  var cropPixel = getPixel(cropped, 0, 0);
  var resizedPixel = getPixel(resized, 3, 1);
  var blitPixel = getPixel(target, 3, 2);
  var loadedBmpPixel = getPixel(loadedBmp, 2, 1);
  var flippedHPixel = getPixel(flippedH, 0, 1);
  var flippedVPixel = getPixel(flippedV, 2, 0);
  var rotatedPixel = getPixel(rotated, 0, 2);
  var blendedPixel = getPixel(alphaTarget, 0, 0);
  var ppmMetadata = metadataFromFile(outputPath);
  var bmpMetadata = metadataFromFile(bmpPath);
  var pgmMetadata = metadataFromFile(pgmPath);
  var tgaMetadata = metadataFromFile(tgaPath);
  var loadedPgmPixel = getPixel(loadedPgm, 1, 0);
  var loadedTgaPixel = getPixel(loadedTga, 2, 1);
  var encoded = encodePpm(copied);
  var decoded = decodePpm(encoded);
  var decodedPixel = getPixel(decoded, 2, 1);

  return [
    width(copied),
    height(copied),
    pixel.red,
    pixel.green,
    pixel.blue,
    isImage(loaded),
    width(cropped),
    height(resized),
    cropPixel.red,
    resizedPixel.blue,
    blitPixel.blue,
    isImage(loadedBmp),
    loadedBmpPixel.blue,
    flippedHPixel.blue,
    flippedVPixel.blue,
    width(rotated),
    height(rotated),
    rotatedPixel.blue,
    blendedPixel.red,
    blendedPixel.blue,
    ppmMetadata.width,
    bmpMetadata.height,
    pgmMetadata.format,
    tgaMetadata.format,
    loadedPgmPixel.red,
    loadedTgaPixel.blue,
    bytesLength(encoded),
    decodedPixel.blue
  ];
}

export function invalidCrop() {
  var image = create(2, 2, rgb(0, 0, 0));
  return crop(image, 1, 0, 2, 1);
}

export function invalidLoadPath() {
  return loadPpm(123);
}

export function invalidLoadBmpPath() {
  return loadBmp(123);
}

export function invalidMetadataFormat(path) {
  return metadataFromFile(path);
}

export function invalidDecodePpm() {
  return decodePpm(123);
}
