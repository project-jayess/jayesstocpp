import {
  addEventListener,
  dispatchEvent,
  findElement,
  getPixel,
  hitElement,
  hitElements,
  renderStats,
  renderScene,
  selectedText,
  setAttribute,
  setAttributes
} from "jayess:canvas";
import { round } from "jayess:math";

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
  dispatchEvent(canvas, { type: "mouseDown", x: 8, y: 6 });
  var clickEvents = dispatchEvent(canvas, { type: "mouseUp", x: 8, y: 6 });
  dispatchEvent(canvas, { type: "mouseDown", x: 26, y: 6 });
  var fixedClickEvents = dispatchEvent(canvas, { type: "mouseUp", x: 26, y: 6 });
  var stats = renderStats(canvas);

  return [
    hit.id === "target" ? 1 : 0,
    fixedHit.id === "fixed" ? 1 : 0,
    events.length,
    events[0].targetId === "target" ? 1 : 0,
    changed.red,
    stats.cachePresents,
    clickEvents.length,
    clickEvents[1].targetId === "target" ? 1 : 0,
    fixedClickEvents.length,
    fixedClickEvents[1].targetId === "fixed" ? 1 : 0
  ];
}

export function nestedScrollSummary() {
  var canvas = renderScene("<scene layout=\"none\" width=\"80\" height=\"54\" background=\"#ffffff\"><rectangle position=\"absolute\" id=\"panel\" x=\"4\" y=\"4\" width=\"44\" height=\"24\" fill=\"#ffffff\" font-color=\"#000000\" font-size=\"7\" line-height=\"8\" overflow=\"auto\" scrollbar-width=\"4\">Line one wraps through the panel. Line two keeps this text taller than the visible area. Line three gives the scrollbar room.</rectangle><rectangle position=\"absolute\" id=\"wide\" x=\"4\" y=\"34\" width=\"44\" height=\"14\" fill=\"#ffffff\" font-color=\"#000000\" font-size=\"7\" line-height=\"8\" text-wrap=\"nowrap\" overflow-x=\"auto\" overflow-y=\"hidden\" scrollbar-width=\"4\">abcdefghijklmnopqrstuvwxyz 1234567890</rectangle></scene>", null);
  var beforeHit = hitElement(canvas, 8, 8);
  dispatchEvent(canvas, { type: "wheel", x: 8, y: 8, deltaX: 0, deltaY: 0.25 });
  var panel = findElement(canvas, "panel");
  var afterHit = hitElement(canvas, 8, 8);
  var sample = getPixel(canvas, 45, 8);
  var beforeWideHit = hitElement(canvas, 8, 38);
  dispatchEvent(canvas, { type: "wheel", x: 8, y: 38, deltaX: 1, deltaY: 0 });
  var wide = findElement(canvas, "wide");
  var afterWideHit = hitElement(canvas, 8, 38);
  var stats = renderStats(canvas);

  return [
    beforeHit.id === "panel" ? 1 : 0,
    panel.scrollOffsetY,
    afterHit.id === "panel" ? 1 : 0,
    sample.red,
    stats.copyRectScrolls,
    beforeWideHit.id === "wide" ? 1 : 0,
    wide.scrollOffsetX,
    afterWideHit.id === "wide" ? 1 : 0
  ];
}

export function scrollbarDragSummary() {
  var canvas = renderScene("<scene layout=\"none\" width=\"80\" height=\"54\" background=\"#ffffff\"><rectangle position=\"absolute\" id=\"panel\" x=\"4\" y=\"4\" width=\"44\" height=\"24\" fill=\"#ffffff\" font-color=\"#000000\" font-size=\"7\" line-height=\"8\" overflow=\"auto\" scrollbar-width=\"4\">Line one wraps through the panel. Line two keeps this text taller than the visible area. Line three gives the scrollbar room.</rectangle></scene>", null);
  var panelDownEvents = dispatchEvent(canvas, { type: "mouseDown", x: 46, y: 8 });
  var panelMoveEvents = dispatchEvent(canvas, { type: "mouseMove", x: 46, y: 18 });
  dispatchEvent(canvas, { type: "mouseUp", x: 46, y: 18 });
  var panel = findElement(canvas, "panel");

  var rootCanvas = renderScene("<scene layout=\"none\" width=\"40\" height=\"40\" background=\"#ffffff\" overflow-y=\"auto\" scrollbar-width=\"8\"><rectangle position=\"absolute\" id=\"target\" x=\"4\" y=\"70\" width=\"12\" height=\"12\" fill=\"#0000ff\"/><rectangle position=\"absolute\" x=\"0\" y=\"130\" width=\"1\" height=\"1\" fill=\"#ffffff\"/></scene>", null);
  var rootDownEvents = dispatchEvent(rootCanvas, { type: "mouseDown", x: 36, y: 18 });
  var rootMoveEvents = dispatchEvent(rootCanvas, { type: "mouseMove", x: 36, y: 22 });
  dispatchEvent(rootCanvas, { type: "mouseUp", x: 36, y: 22 });
  var rootHit = hitElement(rootCanvas, 8, 20);
  var stats = renderStats(rootCanvas);

  return [
    panel.scrollOffsetY,
    panel.scrollOffsetY === round(panel.scrollOffsetY) ? 1 : 0,
    rootCanvas.scene.scrollOffsetY,
    rootCanvas.scene.scrollOffsetY === round(rootCanvas.scene.scrollOffsetY) ? 1 : 0,
    rootHit.id === "target" ? 1 : 0,
    stats.cachePresents,
    panelDownEvents.length,
    panelDownEvents[0].type === "scroll" ? 1 : 0,
    panelMoveEvents.length,
    panelMoveEvents[0].type === "scroll" ? 1 : 0,
    rootDownEvents.length,
    rootDownEvents[0].type === "scroll" ? 1 : 0,
    rootMoveEvents.length,
    rootMoveEvents[0].type === "scroll" ? 1 : 0
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

export function buttonDirtyRedrawSummary() {
  var canvas = renderScene("<scene layout=\"none\" width=\"90\" height=\"72\" background=\"#ffffff\"><button position=\"absolute\" id=\"button\" x=\"8\" y=\"4\" width=\"42\" height=\"18\">Button</button><ellipse position=\"absolute\" id=\"ellipse\" x=\"8\" y=\"28\" width=\"52\" height=\"30\" fill=\"#39ff88\" outline=\"#253342\" outline-thickness=\"4\" shadow=\"0 -14 4 1 rgba(0,0,0,0.25)\" padding=\"8\" font-color=\"#102015\" font-size=\"7\">Hover me</ellipse></scene>", null);
  var outlineBefore = getPixel(canvas, 10, 42);
  var labelBefore = getPixel(canvas, 23, 40);
  dispatchEvent(canvas, { type: "mouseMove", x: 12, y: 8 });
  dispatchEvent(canvas, { type: "mouseDown", x: 12, y: 8 });
  dispatchEvent(canvas, { type: "mouseUp", x: 12, y: 8 });
  var outlineAfter = getPixel(canvas, 10, 42);
  var labelAfter = getPixel(canvas, 23, 40);
  return [
    outlineBefore.red,
    outlineAfter.red,
    outlineBefore.green,
    outlineAfter.green,
    labelBefore.red,
    labelAfter.red
  ];
}

function countColor(canvas, red, green, blue) {
  var count = 0;
  var y = 0;
  while (y < 28) {
    var x = 0;
    while (x < 92) {
      var pixel = getPixel(canvas, x, y);
      if (pixel.red === red && pixel.green === green && pixel.blue === blue) {
        count = count + 1;
      }
      x = x + 1;
    }
    y = y + 1;
  }
  return count;
}

export function textSelectionSummary() {
  var canvas = renderScene("<scene layout=\"none\" width=\"92\" height=\"28\" background=\"#ffffff\"><rectangle position=\"absolute\" id=\"label\" x=\"2\" y=\"2\" width=\"86\" height=\"22\" fill=\"#ffffff\" font-color=\"#000000\" font-size=\"8\" line-height=\"12\" padding=\"4\" text-align=\"left top\" text-select=\"0 5\" text-select-color=\"#ff0000\">hello world</rectangle></scene>", null);
  var redHighlight = countColor(canvas, 255, 0, 0);
  var greenBefore = countColor(canvas, 0, 255, 0);
  setAttribute(canvas, "label", "text-select", "6 11");
  setAttribute(canvas, "label", "text-select-color", "#00ff00");
  var redAfter = countColor(canvas, 255, 0, 0);
  var greenHighlight = countColor(canvas, 0, 255, 0);
  setAttribute(canvas, "label", "text-select", "none");
  var greenCleared = countColor(canvas, 0, 255, 0);

  return [
    redHighlight,
    greenBefore,
    redAfter,
    greenHighlight,
    greenCleared
  ];
}

export function mouseTextSelectionSummary() {
  var canvas = renderScene("<scene layout=\"none\" width=\"140\" height=\"32\" background=\"#ffffff\"><rectangle position=\"absolute\" id=\"label\" x=\"2\" y=\"2\" width=\"130\" height=\"24\" fill=\"#ffffff\" font-color=\"#000000\" font-size=\"8\" line-height=\"12\" padding=\"4\" text-align=\"left top\" mouse-select=\"true\" mouse-select-color=\"#00ff00\">hello world</rectangle></scene>", null);
  var downEvents = dispatchEvent(canvas, { type: "mouseDown", x: 8, y: 10 });
  var moveEvents = dispatchEvent(canvas, { type: "mouseMove", x: 42, y: 10 });
  var selected = selectedText(canvas);
  var greenHighlight = countColor(canvas, 0, 255, 0);
  var upEvents = dispatchEvent(canvas, { type: "mouseUp", x: 42, y: 10 });
  var clearEvents = dispatchEvent(canvas, { type: "mouseDown", x: 136, y: 30, button: "left" });
  var selectedAfterClear = selectedText(canvas);
  var greenAfterClear = countColor(canvas, 0, 255, 0);

  return [
    downEvents.length,
    downEvents[0].type === "textselect" ? 1 : 0,
    moveEvents.length,
    moveEvents[0].type === "textselect" ? 1 : 0,
    selected === "hello" ? 1 : 0,
    greenHighlight,
    upEvents.length,
    upEvents[0].type === "textselect" ? 1 : 0,
    clearEvents.length,
    clearEvents[0].type === "textselect" ? 1 : 0,
    selectedAfterClear.length,
    greenAfterClear
  ];
}
