import { packImage } from "jayess:canvas";
import {
  getPixel,
  height,
  loadGif,
  loadImage,
  loadJpeg,
  loadPng,
  loadWebp,
  width
} from "jayess:image";

export function stbImageSummary(root) {
  var png = loadPng(root + "/stb-probe.png");
  var pngGeneric = loadImage(root + "/stb-probe.png");
  var bmpGeneric = loadImage(root + "/stb-probe.bmp");
  var jpg = loadJpeg(root + "/stb-probe.jpg");
  var gif = loadGif(root + "/stb-probe.gif");
  var webp = loadWebp(root + "/webp-probe.webp");
  var packed = packImage("./packed-icon.png");
  var packedWebp = packImage("./webp-probe.webp");
  var transparent = getPixel(packed, 1, 0);
  var red = getPixel(png, 0, 0);
  var blue = getPixel(bmpGeneric, 0, 1);
  return [
    width(png),
    height(png),
    red.red,
    red.green,
    blue.blue,
    width(pngGeneric),
    height(bmpGeneric),
    width(jpg),
    height(jpg),
    width(gif),
    height(gif),
    width(webp),
    height(webp),
    width(packedWebp),
    height(packedWebp),
    transparent.green,
    transparent.alpha
  ];
}
