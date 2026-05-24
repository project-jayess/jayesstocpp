import { blit, create, loadBmp, loadPgm, loadPpm, loadTga, resizeNearest, transparentBlit } from "jayess:image";
import { rgb, rgba } from "jayess:color";

export function loadPpmFile(path) {
  return loadPpm(path);
}

export function loadPgmFile(path) {
  return loadPgm(path);
}

export function loadBmpFile(path) {
  return loadBmp(path);
}

export function loadTgaFile(path) {
  return loadTga(path);
}

export function createHugeImage() {
  return create(100000, 100000, rgb(0, 0, 0));
}

export function resizeHugeImage() {
  var image = create(1, 1, rgb(0, 0, 0));
  return resizeNearest(image, 100000, 100000);
}

export function blitHugeOffset() {
  var target = create(1, 1, rgb(0, 0, 0));
  var source = create(1, 1, rgb(255, 0, 0));
  return blit(target, source, 2147483648, 0);
}

export function transparentBlitHugeOffset() {
  var target = create(1, 1, rgb(0, 0, 255));
  var source = create(1, 1, rgba(255, 0, 0, 0.5));
  return transparentBlit(target, source, 0, -2147483649);
}
