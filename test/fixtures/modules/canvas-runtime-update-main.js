import {
  addEventListener,
  dispatchEvent,
  getPixel,
  hitElement,
  hitElements,
  renderScene,
  setAttribute,
  setAttributes
} from "jayess:canvas";

export function updateSummary() {
  var canvas = renderScene("<scene layout=\"none\" width=\"24\" height=\"24\" background=\"#ffffff\"><ellipse position=\"absolute\" id=\"target\" x=\"4\" y=\"4\" width=\"8\" height=\"8\" fill=\"#0000ff\" z=\"1\"/><rectangle position=\"absolute\" id=\"overlap\" x=\"6\" y=\"6\" width=\"4\" height=\"4\" fill=\"rgba(0,0,0,0)\" outline=\"#00ff00\" z=\"2\"/><rectangle position=\"absolute\" id=\"other\" x=\"14\" y=\"4\" width=\"4\" height=\"4\" fill=\"#00ff00\"/></scene>", null);
  var before = getPixel(canvas, 8, 8);
  var hit = hitElement(canvas, 8, 8);
  var hits = hitElements(canvas, 8, 8);
  var cornerHit = hitElement(canvas, 4, 4);
  var cornerHits = hitElements(canvas, 4, 4);

  addEventListener(canvas, "mouseover", function (event) {
    setAttributes(canvas, event.targetId, {
      fill: "#ff0000",
      outline: "#000000"
    });
  });

  addEventListener(canvas, "mouseout", function (event) {
    setAttribute(canvas, event.targetId, "fill", "#0000ff");
  });

  var overEvents = dispatchEvent(canvas, { type: "mouseMove", x: 8, y: 8 });
  var afterOver = getPixel(canvas, 8, 8);
  var outEvents = dispatchEvent(canvas, { type: "mouseMove", x: 20, y: 20 });
  var afterOut = getPixel(canvas, 8, 8);
  setAttribute(canvas, "other", "xy", "(1,1)");
  setAttribute(canvas, "other", "w", "2");
  setAttribute(canvas, "other", "h", "2");
  setAttribute(canvas, "other", "fill", "none");
  setAttribute(canvas, "other", "outline", "#ff0000");
  setAttribute(canvas, "other", "outline-opacity", "0.5");
  var movedHit = hitElement(canvas, 1, 1);
  var resizedMiss = hitElement(canvas, 3, 3);
  var outlinePixel = getPixel(canvas, 1, 1);

  return [
    before.blue,
    hit.id === "overlap" ? 1 : 0,
    hits.length,
    hits[0].id === "overlap" ? 1 : 0,
    hits[1].id === "target" ? 1 : 0,
    cornerHit === null ? 1 : 0,
    cornerHits.length,
    afterOver.red,
    overEvents.length,
    overEvents[0].type === "mouseover" ? 1 : 0,
    afterOut.blue,
    outEvents.length,
    outEvents[0].type === "mouseout" ? 1 : 0,
    movedHit.id === "other" ? 1 : 0,
    resizedMiss === null ? 1 : 0,
    outlinePixel.green
  ];
}
