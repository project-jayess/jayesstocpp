import { writeText as writeClipboardText } from "jayess:clipboard";
import { writeLine } from "jayess:console";
import
  {
    addEventListener as addCanvasEventListener,
    dispatchEvent as dispatchCanvasEvent,
    findElement,
    hitElement,
    packImage,
    renderScene,
    renderStats,
    selectedText,
    setAttributes,
  } from "jayess:canvas";
import { packFont, registerFont } from "jayess:font";
import { hasEnv } from "jayess:process";
import { create, height as windowHeight, width as windowWidth } from "jayess:window";

function positiveSize(value, fallback)
{
  if (value > 0)
  {
    return value;
  }
  return fallback;
}

function bodyHeightFor(height)
{
  var value = height + 520;
  if (value < 360)
  {
    return 360;
  }
  return value;
}

function textOf(value)
{
  return value.toString();
}

function isControlKey(event)
{
  return event.key === "Control" || event.key === "control" || event.key === "Ctrl" || event.code === "Control";
}

function isCopyKey(event)
{
  return event.key === "c" || event.key === "C" || event.code === "KeyC";
}

function sceneXml(width, height, antialias)
{
  var sceneWidth = positiveSize(width, 1280);
  var sceneHeight = positiveSize(height, 720);
  var bodyHeight = bodyHeightFor(sceneHeight);
  var sceneWidthText = textOf(sceneWidth);
  var sceneHeightText = textOf(sceneHeight);
  var bodyHeightText = textOf(bodyHeight);
  var antialiasText = textOf(antialias);
  return `<scene width="${ sceneWidthText }" height="${ sceneHeightText }" background="#f6f8fb" padding="32" gap="18" antialias="${ antialiasText }" overflow-y="auto" scrollbar-width="80" scrollbar-track-color="#dbeafe" scrollbar-track-opacity="0.85" scrollbar-track-corners="4">
    <rectangle width="100%" height="80" shrink="0" corners="18" fill="#253342" outline="#6de7ff" outline-thickness="2" shadow="8 12 8 1 rgba(0,0,0,0.35)" padding="18" font-color="#f2f7ff" font-family="Noto Sans KR" font-size="22" text-align="center middle">Responsive column root</rectangle>
    <group width="100%" height="${ bodyHeightText }" shrink="0" layout="row" gap="20" align="stretch">
      <rectangle width="28%" min-width="220" max-width="420" height="100%" corners="16 28 16 28" fill="#ffffff" outline="#d5e2f0" outline-thickness="2" shadow="8 12 8 1 rgba(0,0,0,0.18)" padding="16" font-color="#253342" font-family="Noto Sans Mono" font-size="14" line-height="18" letter-spacing="1" overflow="auto" scrollbar-width="18" scrollbar-thumb="girl-thumb" scrollbar-thumb-width="18" scrollbar-thumb-height="18" scrollbar-thumb-corners="9" scrollbar-track-color="#f1f5f9" scrollbar-track-opacity="0.8" scrollbar-track-corners="5" text-align="left top">Sidebar uses 28% with min/max width and overflow scrollbars when text becomes taller than the panel.</rectangle>
      <group width="400" grow="1" height="100%" layout="column" gap="14">
        <rectangle width="100%" height="78" corners="14" fill="#e8f3ff" outline="#9ed8ff" outline-thickness="2" padding="12" font-color="#253342" font-family="Noto Sans Mono" font-size="14" text-transform="uppercase" text-decoration="underline">Main column grows to fill remaining space</rectangle>
        <button id="auto-button" width="220" height="42">Default button</button>
        <rectangle id="selection-demo" width="100%" height="64" corners="12" fill="#ffffff" outline="#38bdf8" outline-thickness="2" padding="12" font-color="#0f172a" font-family="Noto Sans Mono" font-size="14" line-height="18" text-align="left middle" text-select="0 22" text-select-color="#bae6fd" mouse-select="true" mouse-select-color="#bbf7d0">Selected text attribute demo: drag across this text, then press Ctrl+C to copy.</rectangle>
        <ellipse id="hover-ellipse" width="100%" max-width="320" height="150" fill="#39ff88" outline="#253342" outline-thickness="6" shadow="14 18 10 1 rgba(0,0,0,0.28)" padding="16" font-color="#102015" font-family="Noto Sans Mono" font-size="14">Hover me</ellipse>
        <rectangle width="100%" height="76" corners="10 24" fill="#fff7d6" outline="#ffcc00" outline-thickness="2" padding="10" font-color="#253342" font-family="Noto Sans Mono" font-size="12" line-height="15" overflow="hidden" text-align-x="right" text-align-y="bottom">Hidden overflow keeps this label inside the rounded card.</rectangle>
        <rectangle id="nested-panel" width="100%" height="86" corners="10" fill="#eef2ff" outline="#818cf8" outline-thickness="2" padding="10" font-color="#312e81" font-family="Noto Sans Mono" font-size="15" line-height="19" overflow="auto" scrollbar-width="22" scrollbar-thumb="girl-thumb" scrollbar-thumb-width="22" scrollbar-thumb-height="22" scrollbar-thumb-corners="11" scrollbar-track-color="#c7d2fe" scrollbar-track-opacity="0.7" scrollbar-track-corners="7" text-align="left top">Vertical scrollbar test: this panel is intentionally short and the text is intentionally long. Line one should be visible near the top. Line two should wrap because the panel width is constrained. Line three adds more content so the measured text height exceeds the visible box. Line four should require scrolling to inspect. Line five keeps the scrollbar thumb small enough to notice. Line six confirms wheel or scrollbar movement has room to change the visible text. Line seven is here so the bottom content cannot fit at once.</rectangle>
        <rectangle width="100%" height="72" corners="12" fill="#fce7f3" outline="#f472b6" outline-thickness="2" padding="10" font-color="#831843" font-family="Noto Sans KR" font-size="13" line-height="16" overflow="hidden" text-align="left middle">한국어 글꼴 테스트 Jayess Canvas</rectangle>
        <rectangle width="100%" height="380" corners="12" fill="#ecfdf5" outline="#10b981" outline-thickness="2" padding="14" font-color="#064e3b" font-family="Noto Sans Mono" font-size="14" line-height="18" text-align="left top">Extra root-scroll content. Use the mouse wheel outside the nested text scroller to move the scene. The fixed bottom-right badge should stay pinned to the viewport while this card moves underneath it.</rectangle>
      </group>
    </group>
    <rectangle id="fixed-badge" position="fixed" right="32" bottom="24" width="220" height="44" corners="22" fill="#111827" outline="#6de7ff" outline-thickness="2" padding="10" font-color="#ffffff" font-family="Noto Sans Mono" font-size="12">fixed bottom-right</rectangle>
  </scene>`;
}

function buildCanvas(width, height, antialias, scrollbarThumb)
{
  return renderScene(sceneXml(width, height, antialias), {
    images: {
      "girl-thumb": scrollbarThumb
    }
  });
}

function registerPackedFonts()
{
  registerFont(packFont("./NotoSansMono.ttf", {
    name: "Noto Sans Mono",
    family: "Noto Sans Mono"
  }));
  registerFont(packFont("./NotoSansKR.ttf", {
    name: "Noto Sans KR",
    family: "Noto Sans KR"
  }));
}

function attachCanvasEvents(canvas, window)
{
  addCanvasEventListener(canvas, "mouseover", function (event)
  {
    if (event.targetId === "hover-ellipse")
    {
      setAttributes(canvas, event.targetId, {
        fill: "#ff3355",
        outline: "#111111"
      });
      window.requestRender(canvas);
    }
  });

  addCanvasEventListener(canvas, "mouseout", function (event)
  {
    if (event.targetId === "hover-ellipse")
    {
      setAttributes(canvas, event.targetId, {
        fill: "#39ff88",
        outline: "#253342"
      });
      window.requestRender(canvas);
    }
  });

  addCanvasEventListener(canvas, "mouseDown", function (event)
  {
    if (event.targetId === "hover-ellipse")
    {
      setAttributes(canvas, event.targetId, {
        fill: "#7c3aed",
        outline: "#facc15",
        text: "Pressed"
      });
      window.requestRender(canvas);
    }
    if (event.targetId === "fixed-badge")
    {
      setAttributes(canvas, event.targetId, {
        fill: "#dc2626",
        outline: "#ffffff",
        text: "fixed pressed"
      });
      window.requestRender(canvas);
    }
  });

  addCanvasEventListener(canvas, "mouseUp", function (event)
  {
    if (event.targetId === "hover-ellipse")
    {
      setAttributes(canvas, event.targetId, {
        fill: "#ff3355",
        outline: "#111111",
        text: "Hover me"
      });
      window.requestRender(canvas);
    }
    if (event.targetId === "fixed-badge")
    {
      setAttributes(canvas, event.targetId, {
        fill: "#111827",
        outline: "#6de7ff",
        text: "fixed bottom-right"
      });
      window.requestRender(canvas);
    }
  });
}

function requireSmoke(condition, message)
{
  if (!condition)
  {
    throw message;
  }
}

function runSmokeProbe(scrollbarThumb)
{
  var canvas = buildCanvas(960, 540, 0, scrollbarThumb);
  dispatchCanvasEvent(canvas, {
    type: "wheel",
    x: 880,
    y: 480,
    deltaX: 0,
    deltaY: 4
  });
  var fixedHit = hitElement(canvas, 760, 490);
  requireSmoke(fixedHit !== null && fixedHit.id === "fixed-badge", "canvas-window smoke fixed overlay hit failed after root scroll");

  dispatchCanvasEvent(canvas, {
    type: "wheel",
    x: 360,
    y: 430,
    deltaX: 0,
    deltaY: 1
  });
  var root = canvas.scene;
  var nestedPanel = findElement(canvas, "nested-panel");
  requireSmoke(root.scrollOffsetY > 0, "canvas-window smoke root scroll did not move");
  requireSmoke(nestedPanel !== null && nestedPanel.scrollOffsetY > 0, "canvas-window smoke nested scroll did not move");

  var hoverHit = hitElement(canvas, 520, 255);
  dispatchCanvasEvent(canvas, {
    type: "mouseMove",
    x: 520,
    y: 255
  });
  dispatchCanvasEvent(canvas, {
    type: "mouseDown",
    x: 760,
    y: 490
  });
  dispatchCanvasEvent(canvas, {
    type: "mouseUp",
    x: 760,
    y: 490
  });
  requireSmoke(hoverHit !== null, "canvas-window smoke hover hit did not resolve");

  var button = findElement(canvas, "auto-button");
  requireSmoke(button !== null, "canvas-window smoke button is missing");

  var stats = renderStats(canvas);
  requireSmoke(stats.cachePresents > 0, "canvas-window smoke root scroll did not use cache-present path");
  requireSmoke(stats.copyRectScrolls > 0, "canvas-window smoke nested scroll did not use copy-rect path");
  writeLine("canvas-window smoke stats fullRedraws=" + stats.fullRedraws.toString() +
    " dirtyRegionRedraws=" + stats.dirtyRegionRedraws.toString() +
    " copyRectScrolls=" + stats.copyRectScrolls.toString() +
    " cachePresents=" + stats.cachePresents.toString());
  writeLine("canvas-window smoke ok");
  return 0;
}

export function main()
{
  registerPackedFonts();
  var scrollbarThumb = packImage("./high_school_girl_100x100.png");
  if (hasEnv("JAYESS_CANVAS_WINDOW_SMOKE"))
  {
    return runSmokeProbe(scrollbarThumb);
  }
  var requestedWidth = 1280;
  var requestedHeight = 720;
  var eventStats = {
    mouseMove: 0,
    wheel: 0,
    mouseDown: 0,
    mouseUp: 0,
    resize: 0,
    renderRequests: 0,
    replacements: 0
  };
  var controlDown = false;
  var window = create({
    title: "Jayess Canvas Window",
    width: requestedWidth,
    height: requestedHeight
  });
  window.setFps(60);
  window.show();
  window.dispatchEvents();

  var latestWidth = positiveSize(windowWidth(window), requestedWidth);
  var latestHeight = positiveSize(windowHeight(window), requestedHeight);
  var canvas = buildCanvas(latestWidth, latestHeight, 0, scrollbarThumb);
  var state = { canvas: canvas };
  attachCanvasEvents(canvas, window);

  function requestProbeRender(currentCanvas)
  {
    eventStats.renderRequests = eventStats.renderRequests + 1;
    window.requestRender(currentCanvas);
  }

  function replaceCanvas(width, height, antialias)
  {
    eventStats.replacements = eventStats.replacements + 1;
    canvas = buildCanvas(width, height, antialias, scrollbarThumb);
    state.canvas = canvas;
    attachCanvasEvents(canvas, window);
    requestProbeRender(canvas);
  }

  function renderResponsiveCanvas(width, height)
  {
    var nextWidth = positiveSize(width, latestWidth);
    var nextHeight = positiveSize(height, latestHeight);
    if (nextWidth === latestWidth && nextHeight === latestHeight)
    {
      return null;
    }
    latestWidth = nextWidth;
    latestHeight = nextHeight;
    return replaceCanvas(latestWidth, latestHeight, 0);
  }

  window.addEventListener("mouseMove", function (event)
  {
    eventStats.mouseMove = eventStats.mouseMove + 1;
    var emitted = dispatchCanvasEvent(state.canvas, event);
    if (emitted.length > 0)
    {
      requestProbeRender(state.canvas);
    }
  });

  window.addEventListener("wheel", function (event)
  {
    eventStats.wheel = eventStats.wheel + 1;
    dispatchCanvasEvent(state.canvas, event);
    requestProbeRender(state.canvas);
  });

  window.addEventListener("mouseDown", function (event)
  {
    eventStats.mouseDown = eventStats.mouseDown + 1;
    var emitted = dispatchCanvasEvent(state.canvas, event);
    if (emitted.length > 0)
    {
      requestProbeRender(state.canvas);
    }
  });

  window.addEventListener("mouseUp", function (event)
  {
    eventStats.mouseUp = eventStats.mouseUp + 1;
    var emitted = dispatchCanvasEvent(state.canvas, event);
    if (emitted.length > 0)
    {
      requestProbeRender(state.canvas);
    }
  });

  window.addEventListener("keyDown", function (event)
  {
    if (isControlKey(event))
    {
      controlDown = true;
    }
    if (controlDown && isCopyKey(event))
    {
      var text = selectedText(state.canvas);
      if (text.length > 0)
      {
        writeClipboardText(text);
        writeLine("canvas-window copied selected text: " + text);
      }
    }
  });

  window.addEventListener("keyUp", function (event)
  {
    if (isControlKey(event))
    {
      controlDown = false;
    }
  });

  window.addEventListener("resize", function (event)
  {
    eventStats.resize = eventStats.resize + 1;
    renderResponsiveCanvas(event.width, event.height);
  });

  window.addEventListener("close", function ()
  {
    var stats = renderStats(state.canvas);
    window.close();
    writeLine("canvas-window event stats mouseMove=" + eventStats.mouseMove.toString() +
      " wheel=" + eventStats.wheel.toString() +
      " mouseDown=" + eventStats.mouseDown.toString() +
      " mouseUp=" + eventStats.mouseUp.toString() +
      " resize=" + eventStats.resize.toString() +
      " renderRequests=" + eventStats.renderRequests.toString() +
      " replacements=" + eventStats.replacements.toString());
    writeLine("canvas-window render stats fullRedraws=" + stats.fullRedraws.toString() +
      " dirtyRegionRedraws=" + stats.dirtyRegionRedraws.toString() +
      " copyRectScrolls=" + stats.copyRectScrolls.toString() +
      " cachePresents=" + stats.cachePresents.toString());
    writeLine("canvas-window is closed");
  });

  requestProbeRender(canvas);

  window.run();
  return 0;
}
