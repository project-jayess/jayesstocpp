import { writeLine } from "jayess:console";
import
  {
    addEventListener as addCanvasEventListener,
    dispatchEvent as dispatchCanvasEvent,
    packImage,
    renderScene,
    setAttributes,
  } from "jayess:canvas";
import { packFont, registerFont } from "jayess:font";
import { create } from "jayess:window";

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

function sceneXml(width, height, antialias)
{
  var sceneWidth = positiveSize(width, 1280);
  var sceneHeight = positiveSize(height, 720);
  var bodyHeight = bodyHeightFor(sceneHeight);
  var sceneWidthText = textOf(sceneWidth);
  var sceneHeightText = textOf(sceneHeight);
  var bodyHeightText = textOf(bodyHeight);
  var antialiasText = textOf(antialias);
  return `<scene width="${ sceneWidthText }" height="${ sceneHeightText }" background="#f6f8fb" padding="32" gap="18" antialias="${ antialiasText }" overflow-y="auto" scrollbar-width="80" scrollbar-thumb="girl" scrollbar-thumb-width="72" scrollbar-thumb-height="96" scrollbar-thumb-corners="4" scrollbar-thumb-opacity="1" scrollbar-track-color="#dbeafe" scrollbar-track-opacity="0.85" scrollbar-track-corners="4">
    <rectangle width="100%" height="80" shrink="0" corners="18" fill="#253342" outline="#6de7ff" outline-thickness="2" shadow="8 12 8 1 rgba(0,0,0,0.35)" padding="18" font-color="#f2f7ff" font-family="Noto Sans KR" font-size="22" text-align="center middle">Responsive column root</rectangle>
    <group width="100%" height="${ bodyHeightText }" shrink="0" layout="row" gap="20" align="stretch">
      <rectangle width="28%" min-width="220" max-width="420" height="100%" corners="16 28 16 28" fill="#ffffff" outline="#d5e2f0" outline-thickness="2" shadow="8 12 8 1 rgba(0,0,0,0.18)" padding="16" font-color="#253342" font-family="Noto Sans Mono" font-size="14" line-height="18" letter-spacing="1" overflow="auto" scrollbar-width="10" scrollbar-thumb-color="#2563eb" scrollbar-thumb-opacity="0.9" scrollbar-thumb-corners="5" scrollbar-track-color="#f1f5f9" scrollbar-track-opacity="0.8" scrollbar-track-corners="5" text-align="left top">Sidebar uses 28% with min/max width and overflow scrollbars when text becomes taller than the panel.</rectangle>
      <group width="400" grow="1" height="100%" layout="column" gap="14">
        <rectangle width="100%" height="78" corners="14" fill="#e8f3ff" outline="#9ed8ff" outline-thickness="2" padding="12" font-color="#253342" font-family="Noto Sans Mono" font-size="14" text-transform="uppercase" text-decoration="underline">Main column grows to fill remaining space</rectangle>
        <button id="auto-button" width="220" height="42">Default button</button>
        <ellipse id="hover-ellipse" width="100%" max-width="320" height="150" fill="#39ff88" outline="#253342" outline-thickness="6" shadow="14 18 10 1 rgba(0,0,0,0.28)" padding="16" font-color="#102015" font-family="Noto Sans Mono" font-size="14">Hover me</ellipse>
        <rectangle width="100%" height="76" corners="10 24" fill="#fff7d6" outline="#ffcc00" outline-thickness="2" padding="10" font-color="#253342" font-family="Noto Sans Mono" font-size="12" line-height="15" overflow="hidden" text-align-x="right" text-align-y="bottom">Hidden overflow keeps this label inside the rounded card.</rectangle>
        <rectangle width="100%" height="86" corners="10" fill="#eef2ff" outline="#818cf8" outline-thickness="2" padding="10" font-color="#312e81" font-family="Noto Sans Mono" font-size="15" line-height="19" overflow="auto" scrollbar-width="14" scrollbar-thumb-corners="7" scrollbar-thumb-opacity="1" scrollbar-track-color="#c7d2fe" scrollbar-track-opacity="0.7" scrollbar-track-corners="7" text-align="left top">Vertical scrollbar test: this panel is intentionally short and the text is intentionally long. Line one should be visible near the top. Line two should wrap because the panel width is constrained. Line three adds more content so the measured text height exceeds the visible box. Line four should require scrolling to inspect. Line five keeps the scrollbar thumb small enough to notice. Line six confirms wheel or scrollbar movement has room to change the visible text. Line seven is here so the bottom content cannot fit at once.</rectangle>
        <rectangle width="100%" height="72" corners="12" fill="#fce7f3" outline="#f472b6" outline-thickness="2" padding="10" font-color="#831843" font-family="Noto Sans KR" font-size="13" line-height="16" overflow="hidden" text-align="left middle">한국어 글꼴 테스트 Jayess Canvas</rectangle>
        <rectangle width="100%" height="380" corners="12" fill="#ecfdf5" outline="#10b981" outline-thickness="2" padding="14" font-color="#064e3b" font-family="Noto Sans Mono" font-size="14" line-height="18" text-align="left top">Extra root-scroll content. Use the mouse wheel outside the nested text scroller to move the scene. The fixed bottom-right badge should stay pinned to the viewport while this card moves underneath it.</rectangle>
      </group>
    </group>
    <rectangle id="fixed-badge" position="fixed" right="32" bottom="24" width="220" height="44" corners="22" fill="#111827" outline="#6de7ff" outline-thickness="2" padding="10" font-color="#ffffff" font-family="Noto Sans Mono" font-size="12">fixed bottom-right</rectangle>
  </scene>`;
}

function scrollbarImages()
{
  return {
    girl: packImage("./high_school_girl_100x100.png")
  };
}

function buildCanvas(width, height, antialias, images)
{
  return renderScene(sceneXml(width, height, antialias), {
    images: images
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

export function main()
{
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
  var images = scrollbarImages();
  var canvas = buildCanvas(initialWidth, initialHeight, 0, images);
  var state = { canvas: canvas };
  attachCanvasEvents(canvas, window);

  function replaceCanvas(width, height, antialias)
  {
    canvas = buildCanvas(width, height, antialias, images);
    state.canvas = canvas;
    attachCanvasEvents(canvas, window);
    window.requestRender(canvas);
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
    var emitted = dispatchCanvasEvent(state.canvas, event);
    if (emitted.length > 0)
    {
      window.requestRender(state.canvas);
    }
  });

  window.addEventListener("wheel", function (event)
  {
    dispatchCanvasEvent(state.canvas, event);
    window.requestRender(state.canvas);
  });

  window.addEventListener("mouseDown", function (event)
  {
    var emitted = dispatchCanvasEvent(state.canvas, event);
    if (emitted.length > 0)
    {
      window.requestRender(state.canvas);
    }
  });

  window.addEventListener("mouseUp", function (event)
  {
    var emitted = dispatchCanvasEvent(state.canvas, event);
    if (emitted.length > 0)
    {
      window.requestRender(state.canvas);
    }
  });

  window.addEventListener("resize", function (event)
  {
    renderResponsiveCanvas(event.width, event.height);
  });

  window.addEventListener("close", function ()
  {
    window.close();
    writeLine("canvas-window is closed");
  });

  window.show();
  window.dispatchEvents();
  window.requestRender(canvas);

  window.run();
  return 0;
}
