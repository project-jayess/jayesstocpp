import { rgba } from "jayess:color";
import {
  jayessImageCopy,
  jayessImageCreate,
  jayessImageBlit,
  jayessImageCrop,
  jayessImageFill,
  jayessImageFillCapsule,
  jayessImageFillEllipse,
  jayessImageFillRect,
  jayessImageFillRectAlpha,
  jayessImageGetPixel,
  jayessImageHeight,
  jayessImageIsImage,
  jayessImageFlipHorizontal,
  jayessImageFlipVertical,
  jayessImageDecodeGif,
  jayessImageDecodeImage,
  jayessImageDecodeJpeg,
  jayessImageDecodePgm,
  jayessImageDecodePng,
  jayessImageDecodePpm,
  jayessImageDecodePsd,
  jayessImageDecodeWebp,
  jayessImageEncodePgm,
  jayessImageEncodePpm,
  jayessImageDrawLine,
  jayessImageLoadBmp,
  jayessImageLoadGif,
  jayessImageLoadImage,
  jayessImageLoadJpeg,
  jayessImageLoadJpg,
  jayessImageLoadPgm,
  jayessImageLoadPng,
  jayessImageLoadPpm,
  jayessImageLoadPsd,
  jayessImageLoadTga,
  jayessImageLoadWebp,
  jayessImageMetadataFromFile,
  jayessImageRotate90,
  jayessImageResizeNearest,
  jayessImageSaveBmp,
  jayessImageSavePgm,
  jayessImageSavePpm,
  jayessImageSaveTga,
  jayessImageSetPixel,
  jayessImageAntialias,
  jayessImageShadowMask,
  jayessImageTransparentBlit,
  jayessImageTransparentBlitClipped,
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

export function fillRect(image, x, y, width, height, color) {
  return jayessImageFillRect(image, x, y, width, height, normalizeColor(color));
}

export function fillRectAlpha(image, x, y, width, height, color) {
  return jayessImageFillRectAlpha(image, x, y, width, height, normalizeColor(color));
}

export function drawLine(image, x1, y1, x2, y2, color, strokeWidth) {
  return jayessImageDrawLine(image, x1, y1, x2, y2, normalizeColor(color), strokeWidth);
}

export function fillEllipse(image, x, y, width, height, color) {
  return jayessImageFillEllipse(image, x, y, width, height, normalizeColor(color));
}

export function fillCapsule(image, x, y, width, height, color) {
  return jayessImageFillCapsule(image, x, y, width, height, normalizeColor(color));
}

export function copy(image) {
  return jayessImageCopy(image);
}

export function antialias(image, level) {
  return jayessImageAntialias(image, level);
}

export function shadowMask(image, blurRadius, spreadRadius, color) {
  return jayessImageShadowMask(image, blurRadius, spreadRadius, normalizeColor(color));
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

export function loadPng(path) {
  return jayessImageLoadPng(path);
}

export function loadJpeg(path) {
  return jayessImageLoadJpeg(path);
}

export function loadJpg(path) {
  return jayessImageLoadJpg(path);
}

export function loadPsd(path) {
  return jayessImageLoadPsd(path);
}

export function loadGif(path) {
  return jayessImageLoadGif(path);
}

export function loadWebp(path) {
  return jayessImageLoadWebp(path);
}

export function loadImage(path) {
  return jayessImageLoadImage(path);
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

export function encodePgm(image) {
  return jayessImageEncodePgm(image);
}

export function decodePgm(bytes) {
  return jayessImageDecodePgm(bytes);
}

export function decodePng(bytes) {
  return jayessImageDecodePng(bytes);
}

export function decodeJpeg(bytes) {
  return jayessImageDecodeJpeg(bytes);
}

export function decodePsd(bytes) {
  return jayessImageDecodePsd(bytes);
}

export function decodeGif(bytes) {
  return jayessImageDecodeGif(bytes);
}

export function decodeWebp(bytes) {
  return jayessImageDecodeWebp(bytes);
}

export function decodeImage(bytes) {
  return jayessImageDecodeImage(bytes);
}

export function crop(image, x, y, width, height) {
  return jayessImageCrop(image, x, y, width, height);
}

export function subimage(image, x, y, width, height) {
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

export function transparentBlitClipped(target, source, x, y, clipX, clipY, clipWidth, clipHeight) {
  return jayessImageTransparentBlitClipped(target, source, x, y, clipX, clipY, clipWidth, clipHeight);
}

export function isImage(value) {
  return jayessImageIsImage(value);
}
