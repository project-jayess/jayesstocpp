import { rgb } from "jayess:color";
import { create as createImage, setPixel } from "jayess:image";
import { getPixel, renderScene } from "jayess:canvas";

export function renderSummary() {
  var canvas = renderScene("<scene layout=\"none\" width=\"40\" height=\"28\" background=\"#000000\"><rectangle position=\"absolute\" x=\"1\" y=\"1\" width=\"5\" height=\"4\" fill=\"#110000\"/><line position=\"absolute\" x=\"0\" y=\"0\" points=\"(0,26), (5,26)\" outline=\"#220000\"/><pixel position=\"absolute\" x=\"8\" y=\"2\" fill=\"#330000\"/><ellipse position=\"absolute\" x=\"10\" y=\"1\" width=\"7\" height=\"5\" fill=\"#440000\"/><semiellipse position=\"absolute\" x=\"18\" y=\"1\" width=\"7\" height=\"5\" fill=\"#550000\"/><triangle position=\"absolute\" x=\"1\" y=\"8\" width=\"6\" height=\"5\" fill=\"#660000\"/><polygon position=\"absolute\" points=\"(10,10), (15,10), (15,14), (10,14)\" fill=\"#770000\"/><polyline position=\"absolute\" points=\"(18,10), (22,10), (22,14)\" outline=\"#880000\"/><capsule position=\"absolute\" x=\"1\" y=\"16\" width=\"8\" height=\"5\" fill=\"#990000\"/><text position=\"absolute\" x=\"12\" y=\"16\" text=\"A\" fill=\"#aa0000\" font-size=\"7\"/><rectangle position=\"absolute\" x=\"0\" y=\"0\" width=\"3\" height=\"3\" fill=\"#bb0000\" points=\"(28,1)\"/><ellipse position=\"absolute\" x=\"0\" y=\"0\" width=\"5\" height=\"5\" fill=\"#cc0000\" points=\"(32,1)\"/><semiellipse position=\"absolute\" x=\"0\" y=\"0\" width=\"5\" height=\"5\" fill=\"#dd0000\" points=\"(28,7)\"/><capsule position=\"absolute\" x=\"0\" y=\"0\" width=\"7\" height=\"4\" fill=\"#ee0000\" points=\"(28,15)\"/></scene>");
  return [
    getPixel(canvas, 2, 2).red,
    getPixel(canvas, 3, 26).red,
    getPixel(canvas, 8, 2).red,
    getPixel(canvas, 13, 3).red,
    getPixel(canvas, 21, 2).red,
    getPixel(canvas, 4, 11).red,
    getPixel(canvas, 12, 12).red,
    getPixel(canvas, 20, 10).red,
    getPixel(canvas, 4, 18).red,
    getPixel(canvas, 13, 16).red,
    getPixel(canvas, 29, 2).red,
    getPixel(canvas, 34, 3).red,
    getPixel(canvas, 30, 8).red,
    getPixel(canvas, 31, 16).red
  ];
}

export function renderImageSummary() {
  var source = createImage(2, 2, rgb(0, 0, 0));
  setPixel(source, 0, 0, rgb(12, 0, 0));
  setPixel(source, 1, 1, rgb(34, 0, 0));
  var canvas = renderScene("<scene layout=\"none\" width=\"6\" height=\"6\" background=\"#000000\"><image position=\"absolute\" id=\"icon\" src=\"probe\" x=\"2\" y=\"2\" width=\"2\" height=\"2\" /></scene>", {
    images: {
      probe: source
    }
  });
  return [
    getPixel(canvas, 2, 2).red,
    getPixel(canvas, 3, 3).red
  ];
}

export function renderLabelSummary() {
  var canvas = renderScene("<scene width=\"24\" height=\"16\" background=\"#000000\"><rectangle x=\"1\" y=\"1\" width=\"20\" height=\"12\" fill=\"#000000\" font-color=\"#ff0000\" font-size=\"7\" padding=\"1\">A</rectangle></scene>");
  var count = 0;
  var y = 0;
  while (y < 16) {
    var x = 0;
    while (x < 24) {
      var pixel = getPixel(canvas, x, y);
      if (pixel.red > 0 && pixel.green == 0 && pixel.blue == 0) {
        count = count + 1;
      }
      x = x + 1;
    }
    y = y + 1;
  }
  return count;
}

export function invalidNetworkImage() {
  return renderScene("<scene width=\"4\" height=\"4\"><image src=\"https://example.test/icon.ppm\" x=\"0\" y=\"0\" width=\"1\" height=\"1\" /></scene>");
}
