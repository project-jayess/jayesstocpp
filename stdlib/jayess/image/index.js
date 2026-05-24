import { rgba } from "jayess:color";
import {
  jayessImageCopy,
  jayessImageCreate,
  jayessImageBlit,
  jayessImageCrop,
  jayessImageFill,
  jayessImageGetPixel,
  jayessImageHeight,
  jayessImageIsImage,
  jayessImageFlipHorizontal,
  jayessImageFlipVertical,
  jayessImageDecodePpm,
  jayessImageEncodePpm,
  jayessImageLoadBmp,
  jayessImageLoadPgm,
  jayessImageLoadPpm,
  jayessImageLoadTga,
  jayessImageMetadataFromFile,
  jayessImageRotate90,
  jayessImageResizeNearest,
  jayessImageSaveBmp,
  jayessImageSavePgm,
  jayessImageSavePpm,
  jayessImageSaveTga,
  jayessImageSetPixel,
  jayessImageTransparentBlit,
  jayessImageWidth
} from "./image-primitives.hpp";

function normalizeColor(color) {
  return rgba(color.red, color.green, color.blue, color.alpha);
}

export function create(width, height, background) {
  return jayessImageCreate(width, height, normalizeColor(background));
}

export function width(image) {
  return jayessImageWidth(image);
}

export function height(image) {
  return jayessImageHeight(image);
}

export function metadata(image) {
  return {
    width: width(image),
    height: height(image)
  };
}

export function getPixel(image, x, y) {
  return jayessImageGetPixel(image, x, y);
}

export function setPixel(image, x, y, color) {
  return jayessImageSetPixel(image, x, y, normalizeColor(color));
}

export function fill(image, color) {
  return jayessImageFill(image, normalizeColor(color));
}

export function copy(image) {
  return jayessImageCopy(image);
}

export function savePpm(image, path) {
  return jayessImageSavePpm(image, path);
}

export function saveBmp(image, path) {
  return jayessImageSaveBmp(image, path);
}

export function savePgm(image, path) {
  return jayessImageSavePgm(image, path);
}

export function saveTga(image, path) {
  return jayessImageSaveTga(image, path);
}

export function loadPpm(path) {
  return jayessImageLoadPpm(path);
}

export function loadBmp(path) {
  return jayessImageLoadBmp(path);
}

export function loadPgm(path) {
  return jayessImageLoadPgm(path);
}

export function loadTga(path) {
  return jayessImageLoadTga(path);
}

export function metadataFromFile(path) {
  return jayessImageMetadataFromFile(path);
}

export function encodePpm(image) {
  return jayessImageEncodePpm(image);
}

export function decodePpm(bytes) {
  return jayessImageDecodePpm(bytes);
}

export function crop(image, x, y, width, height) {
  return jayessImageCrop(image, x, y, width, height);
}

export function resizeNearest(image, width, height) {
  return jayessImageResizeNearest(image, width, height);
}

export function blit(target, source, x, y) {
  return jayessImageBlit(target, source, x, y);
}

export function flipHorizontal(image) {
  return jayessImageFlipHorizontal(image);
}

export function flipVertical(image) {
  return jayessImageFlipVertical(image);
}

export function rotate90(image) {
  return jayessImageRotate90(image);
}

export function transparentBlit(target, source, x, y) {
  return jayessImageTransparentBlit(target, source, x, y);
}

export function isImage(value) {
  return jayessImageIsImage(value);
}
