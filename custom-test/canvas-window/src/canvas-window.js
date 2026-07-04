import { writeLine } from "jayess:console";
import {
  addEventListener as addCanvasEventListener,
  dispatchEvent as dispatchCanvasEvent,
  renderScene,
  setAttributes,
} from "jayess:canvas";
import { packFont, registerFont } from "jayess:font";
import { create } from "jayess:window";

function positiveSize(value, fallback) {
  if (value > 0) {
    return value;
  }
  return fallback;
}

function bodyHeightFor(height) {
  var value = height - 160;
  if (value < 360) {
    return 360;
  }
  return value;
}

function textOf(value) {
  return value.toString();
}

function sceneXml(width, height, antialias) {
  var sceneWidth = positiveSize(width, 1280);
  var sceneHeight = positiveSize(height, 720);
  var bodyHeight = bodyHeightFor(sceneHeight);
  var sceneWidthText = textOf(sceneWidth);
  var sceneHeightText = textOf(sceneHeight);
  var bodyHeightText = textOf(bodyHeight);
  var antialiasText = textOf(antialias);
  return `<scene width="${sceneWidthText}" height="${sceneHeightText}" background="#f6f8fb" padding="32" gap="18" antialias="${antialiasText}">
    <rectangle width="100%" height="80" corners="18" fill="#253342" outline="#6de7ff" outline-thickness="2" shadow="8 12 8 1 rgba(0,0,0,0.35)" padding="18" font-color="#f2f7ff" font-family="Noto Sans KR" font-size="22" text-align="center middle">Responsive column root</rectangle>
    <group width="100%" height="${bodyHeightText}" layout="row" gap="20" align="stretch">
      <rectangle width="28%" min-width="220" max-width="420" height="100%" corners="16 28 16 28" fill="#ffffff" outline="#d5e2f0" outline-thickness="2" shadow="8 12 8 1 rgba(0,0,0,0.18)" padding="16" font-color="#253342" font-family="Noto Sans Mono" font-size="14" line-height="18" letter-spacing="1" overflow="auto" scrollbar-width="10" scrollbar-color="#888888 #f1f1f1" text-align="left top">Sidebar uses 28% with min/max width and overflow scrollbars when text becomes taller than the panel.</rectangle>
      <group width="400" grow="1" height="100%" layout="column" gap="14">
        <rectangle width="100%" height="78" corners="14" fill="#e8f3ff" outline="#9ed8ff" outline-thickness="2" padding="12" font-color="#253342" font-family="Noto Sans Mono" font-size="14" text-transform="uppercase" text-decoration="underline">Main column grows to fill remaining space</rectangle>
        <ellipse id="hover-ellipse" width="100%" max-width="320" height="150" fill="#39ff88" outline="#253342" outline-thickness="6" shadow="14 18 10 1 rgba(0,0,0,0.28)" padding="16" font-color="#102015" font-family="Noto Sans Mono" font-size="14">Hover me</ellipse>
        <rectangle width="100%" height="76" corners="10 24" fill="#fff7d6" outline="#ffcc00" outline-thickness="2" padding="10" font-color="#253342" font-family="Noto Sans Mono" font-size="12" line-height="15" overflow="hidden" text-align-x="right" text-align-y="bottom">Hidden overflow keeps this label inside the rounded card.</rectangle>
        <rectangle width="100%" height="86" corners="10" fill="#eef2ff" outline="#818cf8" outline-thickness="2" padding="10" font-color="#312e81" font-family="Noto Sans Mono" font-size="15" line-height="19" overflow="auto" scrollbar-width="14" scrollbar-color="#4f46e5 #c7d2fe" text-align="left top">Vertical scrollbar test: this panel is intentionally short and the text is intentionally long. Line one should be visible near the top. Line two should wrap because the panel width is constrained. Line three adds more content so the measured text height exceeds the visible box. Line four should require scrolling to inspect. Line five keeps the scrollbar thumb small enough to notice. Line six confirms wheel or scrollbar movement has room to change the visible text. Line seven is here so the bottom content cannot fit at once.</rectangle>
        <rectangle width="100%" height="72" corners="12" fill="#fce7f3" outline="#f472b6" outline-thickness="2" padding="10" font-color="#831843" font-family="Noto Sans KR" font-size="13" line-height="16" overflow="hidden" text-align="left middle">한국어 글꼴 테스트 Jayess Canvas</rectangle>
      </group>
    </group>
    <rectangle position="fixed" right="32" bottom="24" width="220" height="44" corners="22" fill="#111827" outline="#6de7ff" outline-thickness="2" padding="10" font-color="#ffffff" font-family="Noto Sans Mono" font-size="12">fixed bottom-right</rectangle>
  </scene>`;
}

function buildCanvas(width, height, antialias) {
  return renderScene(sceneXml(width, height, antialias), null);
}

function registerPackedFonts() {
  registerFont(packFont("./NotoSansMono.ttf", {
    name: "Noto Sans Mono",
    family: "Noto Sans Mono"
  }));
  registerFont(packFont("./NotoSansKR.ttf", {
    name: "Noto Sans KR",
    family: "Noto Sans KR"
  }));
}

function attachCanvasEvents(canvas, window) {
  addCanvasEventListener(canvas, "mouseover", function (event) {
    if (event.targetId === "hover-ellipse") {
      setAttributes(canvas, event.targetId, {
        fill: "#ff3355",
        outline: "#111111"
      });
      window.requestRender(canvas);
    }
  });

  addCanvasEventListener(canvas, "mouseout", function (event) {
    if (event.targetId === "hover-ellipse") {
      setAttributes(canvas, event.targetId, {
        fill: "#39ff88",
        outline: "#253342"
      });
      window.requestRender(canvas);
    }
  });
}

export function main() {
  registerPackedFonts();
  var initialWidth = 1280;
  var initialHeight = 720;
  var latestWidth = initialWidth;
  var latestHeight = initialHeight;
  var window = create({
    title: "Jayess Canvas Window",
    width: initialWidth,
    height: initialHeight
  });
  window.setFps(60);
  var canvas = buildCanvas(initialWidth, initialHeight, 0);
  var state = { canvas: canvas };
  attachCanvasEvents(canvas, window);

  function replaceCanvas(width, height, antialias) {
    canvas = buildCanvas(width, height, antialias);
    state.canvas = canvas;
    attachCanvasEvents(canvas, window);
    window.requestRender(canvas);
  }

  function renderResponsiveCanvas(width, height) {
    var nextWidth = positiveSize(width, latestWidth);
    var nextHeight = positiveSize(height, latestHeight);
    if (nextWidth === latestWidth && nextHeight === latestHeight) {
      return null;
    }
    latestWidth = nextWidth;
    latestHeight = nextHeight;
    return replaceCanvas(latestWidth, latestHeight, 0);
  }

  window.show();
  window.dispatchEvents();
  window.requestRender(canvas);

  window.addEventListener("mouseMove", function (event) {
    dispatchCanvasEvent(state.canvas, event);
    window.requestRender(state.canvas);
  });

  window.addEventListener("wheel", function (event) {
    dispatchCanvasEvent(state.canvas, event);
    window.requestRender(state.canvas);
  });

  window.addEventListener("mouseDown", function (event) {
    dispatchCanvasEvent(state.canvas, event);
  });

  window.addEventListener("mouseUp", function (event) {
    dispatchCanvasEvent(state.canvas, event);
  });

  window.addEventListener("resize", function (event) {
    renderResponsiveCanvas(event.width, event.height);
  });

  window.addEventListener("close", function () {
    window.close();
    writeLine("canvas-window is closed");
  });

  window.run();
  return 0;
}
