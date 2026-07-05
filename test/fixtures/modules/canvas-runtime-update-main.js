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

export function scrolledHoverSummary() {
  var canvas = renderScene("<scene layout=\"none\" width=\"40\" height=\"40\" background=\"#ffffff\" overflow-y=\"auto\" scrollbar-width=\"8\"><rectangle position=\"absolute\" id=\"target\" x=\"6\" y=\"50\" width=\"12\" height=\"12\" fill=\"#0000ff\"/><rectangle position=\"absolute\" x=\"0\" y=\"130\" width=\"1\" height=\"1\" fill=\"#ffffff\"/><rectangle position=\"fixed\" id=\"fixed\" x=\"24\" y=\"4\" width=\"8\" height=\"8\" fill=\"#00ff00\"/></scene>", null);
  dispatchEvent(canvas, { type: "wheel", x: 8, y: 8, deltaX: 0, deltaY: 1 });
  var hit = hitElement(canvas, 8, 6);
  var fixedHit = hitElement(canvas, 26, 6);

  addEventListener(canvas, "mouseover", function (event) {
    setAttribute(canvas, event.targetId, "fill", "#ff0000");
  });

  var events = dispatchEvent(canvas, { type: "mouseMove", x: 8, y: 6 });
  var changed = getPixel(canvas, 8, 6);

  return [
    hit.id === "target" ? 1 : 0,
    fixedHit.id === "fixed" ? 1 : 0,
    events.length,
    events[0].targetId === "target" ? 1 : 0,
    changed.red
  ];
}

export function clickSummary() {
  var canvas = renderScene("<scene layout=\"none\" width=\"32\" height=\"32\" background=\"#ffffff\"><rectangle position=\"absolute\" id=\"target\" x=\"4\" y=\"4\" width=\"10\" height=\"10\" fill=\"#0000ff\"/><rectangle position=\"absolute\" id=\"other\" x=\"18\" y=\"4\" width=\"8\" height=\"8\" fill=\"#00ff00\"/></scene>", null);
  addEventListener(canvas, "click", function (event) {
    setAttribute(canvas, event.targetId, "fill", "#ff0000");
  });
  var downEvents = dispatchEvent(canvas, { type: "mouseDown", x: 6, y: 6 });
  var clickEvents = dispatchEvent(canvas, { type: "mouseUp", x: 6, y: 6 });
  var changed = getPixel(canvas, 6, 6);
  dispatchEvent(canvas, { type: "mouseDown", x: 6, y: 6 });
  var mismatchEvents = dispatchEvent(canvas, { type: "mouseUp", x: 20, y: 6 });
  return [
    downEvents.length,
    downEvents[0].type === "mouseDown" ? 1 : 0,
    clickEvents.length,
    clickEvents[0].type === "mouseUp" ? 1 : 0,
    clickEvents[1].type === "click" ? 1 : 0,
    clickEvents[1].targetId === "target" ? 1 : 0,
    changed.red,
    mismatchEvents.length,
    mismatchEvents[0].type === "mouseUp" ? 1 : 0,
    mismatchEvents[0].targetId === "target" ? 1 : 0
  ];
}

export function buttonEventSummary() {
  var canvas = renderScene("<scene layout=\"none\" width=\"80\" height=\"40\" background=\"#ffffff\"><button position=\"absolute\" id=\"button\" x=\"4\" y=\"4\" width=\"32\" height=\"20\">Button</button><button position=\"absolute\" id=\"custom\" x=\"44\" y=\"4\" width=\"28\" height=\"20\" fill=\"#203040\" color-event-mode=\"lighter\">Custom</button></scene>", null);
  var before = getPixel(canvas, 8, 8);
  dispatchEvent(canvas, { type: "mouseMove", x: 8, y: 8 });
  var hover = getPixel(canvas, 8, 8);
  dispatchEvent(canvas, { type: "mouseDown", x: 8, y: 8 });
  var pressed = getPixel(canvas, 8, 8);
  dispatchEvent(canvas, { type: "mouseUp", x: 8, y: 8 });
  var released = getPixel(canvas, 8, 8);

  addEventListener(canvas, "mouseDown", function (event) {
    if (event.targetId === "custom") {
      setAttribute(canvas, event.targetId, "fill", "#ff0000");
    }
  });
  dispatchEvent(canvas, { type: "mouseMove", x: 48, y: 8 });
  dispatchEvent(canvas, { type: "mouseDown", x: 48, y: 8 });
  var custom = getPixel(canvas, 48, 8);

  return [
    before.red,
    hover.red,
    pressed.red,
    released.red,
    custom.red,
    custom.green
  ];
}
