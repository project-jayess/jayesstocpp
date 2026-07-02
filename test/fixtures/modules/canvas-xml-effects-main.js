import { getPixel, renderScene } from "jayess:canvas";

export function renderEffectsSummary() {
  var canvas = renderScene("<scene layout=\"none\" width=\"50\" height=\"20\" background=\"#000000\"><rectangle position=\"absolute\" x=\"1\" y=\"1\" width=\"5\" height=\"5\" fill=\"#00ff00\" z=\"1\"/><rectangle position=\"absolute\" x=\"1\" y=\"1\" width=\"5\" height=\"5\" fill=\"#ff0000\" z=\"2\"/><rectangle position=\"absolute\" x=\"8\" y=\"1\" width=\"3\" height=\"3\" fill=\"#220000\" shadow=\"4 0 0 0 #330000\"/><text position=\"absolute\" x=\"1\" y=\"8\" text=\"A\" font-size=\"7\" fill=\"#440000\" shadow=\"8 0 0 0 #550000\"/><pixel position=\"absolute\" x=\"16\" y=\"8\" fill=\"#550000\" shadow=\"10 0 0 0 #330000\"/><rectangle position=\"absolute\" x=\"22\" y=\"1\" width=\"4\" height=\"4\" fill=\"rgba(255,0,0,0.5)\"/><pixel position=\"absolute\" x=\"27\" y=\"8\" fill=\"rgba(255,0,0,0.5)\"/><rectangle position=\"absolute\" x=\"32\" y=\"2\" width=\"2\" height=\"2\" fill=\"#000000\" shadow=\"0 0 0 2 #440000\"/><rectangle position=\"absolute\" x=\"38\" y=\"2\" width=\"2\" height=\"2\" fill=\"#000000\" shadow=\"0 0 2 0 #660000\"/><rectangle position=\"absolute\" x=\"45\" y=\"1\" width=\"3\" height=\"3\" fill=\"rgba(0,0,0,0)\" outline=\"#ff0000\" outline-opacity=\"0.5\"/></scene>");
  return [
    getPixel(canvas, 2, 2).red,
    getPixel(canvas, 9, 2).red,
    getPixel(canvas, 12, 2).red,
    getPixel(canvas, 2, 8).red,
    getPixel(canvas, 10, 8).red,
    getPixel(canvas, 16, 8).red,
    getPixel(canvas, 26, 8).red,
    getPixel(canvas, 27, 8).red,
    getPixel(canvas, 31, 2).red,
    getPixel(canvas, 36, 2).red,
    getPixel(canvas, 43, 2).red,
    getPixel(canvas, 45, 1).red
  ];
}

export function renderAntialiasSummary() {
  var plain = renderScene("<scene width=\"8\" height=\"8\" background=\"#000000\"><polygon points=\"(0,0), (8,8), (0,8)\" fill=\"#ff0000\" /></scene>");
  var smooth = renderScene("<scene width=\"8\" height=\"8\" background=\"#000000\" antialias=\"2\"><polygon points=\"(0,0), (8,8), (0,8)\" fill=\"#ff0000\" /></scene>");
  return [
    getPixel(plain, 4, 4).red,
    getPixel(smooth, 4, 4).red,
    getPixel(smooth, 1, 6).red
  ];
}
