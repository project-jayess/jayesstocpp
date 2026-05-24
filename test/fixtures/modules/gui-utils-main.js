import { rgb } from "jayess:color";
import { create as createCanvas, getPixel } from "jayess:canvas";
import { clear as clearClipboard, writeText } from "jayess:clipboard";
import { charWidth, drawText, drawTextAligned, lineHeight, measureText } from "jayess:font";
import { column, contains, grid, inset, intersect, rect, row } from "jayess:layout";

export function inspect() {
  var bounds = rect(0, 0, 100, 50);
  var inside = contains(bounds, 10, 10);
  var clipped = intersect(bounds, rect(40, 20, 100, 100));
  var padded = inset(bounds, 5);
  var rows = row(bounds, 2);
  var columns = column(bounds, 2);
  var cells = grid(bounds, 2, 2);
  var size = measureText(null, "Hi");
  var multiline = measureText(null, "A\nHi");

  var canvas = createCanvas(16, 18, { background: rgb(0, 0, 0) });
  drawText(canvas, null, "A\nH", 1, 1, rgb(255, 255, 255));
  drawTextAligned(canvas, null, "I", { x: 0, y: 0, width: 16, height: 18 }, rgb(90, 90, 90), {
    align: "right",
    verticalAlign: "bottom"
  });
  var pixel = getPixel(canvas, 2, 1);
  var secondLinePixel = getPixel(canvas, 1, 9);
  var alignedPixel = getPixel(canvas, 12, 12);

  return [
    inside,
    clipped.width,
    padded.x,
    rows.length,
    columns[1].y,
    cells.length,
    size.width,
    size.height,
    pixel.red,
    lineHeight(null),
    charWidth(null, "A"),
    multiline.width,
    multiline.height,
    secondLinePixel.red,
    alignedPixel.red
  ];
}

export function invalidRect() {
  return rect(0, 0, -1, 1);
}

export function invalidClipboardText() {
  return writeText(123);
}

export function unavailableClipboard() {
  return clearClipboard();
}
