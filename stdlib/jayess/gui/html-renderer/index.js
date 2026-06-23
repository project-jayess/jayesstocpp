import {
  create as createCanvas,
  createHtmlDocument,
  drawHtml,
  drawHtmlScrollbars,
  hitTestHtmlScrollTarget,
  hitTestHtml,
  layoutHtml,
  scrollHtmlNodeBy
} from "jayess:canvas";
import { isArray, join } from "jayess:array";
import { rgb } from "jayess:color";
import {
  close,
  create as createWindow,
  pollEvents,
  present,
  setTitle,
  shouldClose,
  show
} from "jayess:window";
import { sleep } from "jayess:thread";
import { elapsed, millis } from "jayess:time";
import { optionValue } from "../shared.js";

function defaultBackground() {
  return rgb(8, 12, 18);
}

function cssText(css) {
  if (css === null) {
    return "";
  }
  if (isArray(css)) {
    return join(css, "\n");
  }
  return css;
}

function createRendererDocument(renderer) {
  return createHtmlDocument(renderer.html, renderer.css, null);
}

function rootScrollNode(renderer) {
  if (renderer.document.tree.children.length === 0) {
    return null;
  }
  var root = renderer.document.tree.children[0];
  if (root.tagName === "html" && root.children !== null) {
    for (var index = 0; index < root.children.length; index = index + 1) {
      if (root.children[index].tagName === "body") {
        return root.children[index];
      }
    }
  }
  return root;
}

function rootBackground(renderer) {
  var root = rootScrollNode(renderer);
  if (root !== null && root.style !== null && root.style["background-color"] !== null) {
    return root.style["background-color"];
  }
  return renderer.background;
}

function composeRendererViewport(renderer) {
  renderer.canvas = createCanvas(renderer.width, renderer.height, {
    background: rootBackground(renderer),
    title: renderer.title
  });
  drawHtml(renderer.canvas, renderer.document);
  drawHtmlScrollbars(renderer.canvas, renderer.document);
  renderer.dirty = false;
  renderer.needsLayout = false;
  return renderer;
}

function renderRenderer(renderer) {
  layoutHtml(renderer.document, {
    x: 0,
    y: 0,
    width: renderer.width,
    height: renderer.height
  });
  composeRendererViewport(renderer);
  renderer.lastResizeRender = millis();
  return renderer;
}

function rememberResize(renderer, width, height) {
  if (width === renderer.width && height === renderer.height) {
    return renderer;
  }
  renderer.pendingResize = true;
  renderer.pendingWidth = width;
  renderer.pendingHeight = height;
  return renderer;
}

function applyPendingResize(renderer) {
  if (!renderer.pendingResize) {
    return renderer;
  }
  if (elapsed(renderer.lastResizeRender) < renderer.resizeDelay) {
    return renderer;
  }
  renderer.width = renderer.pendingWidth;
  renderer.height = renderer.pendingHeight;
  renderer.pendingResize = false;
  renderer.needsLayout = true;
  renderer.dirty = true;
  return renderRenderer(renderer);
}

function queueClick(renderer, hit) {
  renderer.actions.push({
    type: "htmlClick",
    targetId: hit.targetId,
    role: hit.role
  });
  return renderer;
}

function wheelDelta(value) {
  if (value === null) {
    return 0;
  }
  return value;
}

function applyWheel(renderer, event) {
  var deltaX = wheelDelta(event.deltaX) * 72;
  var deltaY = wheelDelta(event.deltaY) * 72;
  var target = hitTestHtmlScrollTarget(renderer.document, event.x, event.y, deltaX, deltaY);
  if (target === null) {
    return renderer;
  }
  scrollHtmlNodeBy(target, deltaX, deltaY);
  return composeRendererViewport(renderer);
}

export function reloadHtmlRenderer(renderer, html, css) {
  if (html !== null) {
    renderer.html = html;
  }
  if (css !== null) {
    renderer.css = cssText(css);
  }
  renderer.document = createRendererDocument(renderer);
  renderer.needsLayout = true;
  renderer.dirty = true;
  return renderRenderer(renderer);
}

function dispatchRendererEvent(renderer, event) {
  if (event.type === "resize") {
    return rememberResize(renderer, event.width, event.height);
  }
  if (event.type === "mouseUp" && event.button === "left") {
    var hit = hitTestHtml(renderer.document, event.x, event.y);
    if (hit !== null && hit.targetId !== null) {
      queueClick(renderer, hit);
    }
  }
  if (event.type === "wheel") {
    return applyWheel(renderer, event);
  }
  return renderer;
}

function initialRendererDocument(renderer) {
  renderer.document = createRendererDocument(renderer);
  return renderer;
}

export function htmlRenderer(options) {
  var width = optionValue(options, "width", 960);
  var height = optionValue(options, "height", 540);
  var title = optionValue(options, "title", "Jayess HTML");
  var renderer = {
    window: createWindow({
      title: title,
      width: width,
      height: height
    }),
    canvas: null,
    document: null,
    html: optionValue(options, "html", ""),
    css: cssText(optionValue(options, "css", "")),
    title: title,
    background: optionValue(options, "background", defaultBackground()),
    width: width,
    height: height,
    pendingResize: false,
    pendingWidth: width,
    pendingHeight: height,
    resizeDelay: optionValue(options, "resizeDelay", 120),
    lastResizeRender: millis(),
    actions: [],
    dirty: true,
    needsLayout: true
  };
  initialRendererDocument(renderer);
  return renderRenderer(renderer);
}

export function showHtmlRenderer(renderer) {
  show(renderer.window);
  setTitle(renderer.window, renderer.title);
  present(renderer.window, renderer.canvas);
  return renderer;
}

export function updateHtmlRenderer(renderer) {
  var events = pollEvents(renderer.window);
  for (var index = 0; index < events.length; index = index + 1) {
    dispatchRendererEvent(renderer, events[index]);
  }
  applyPendingResize(renderer);
  if (renderer.dirty || renderer.needsLayout) {
    renderRenderer(renderer);
  }
  present(renderer.window, renderer.canvas);
  return renderer;
}

export function shouldCloseHtmlRenderer(renderer) {
  return shouldClose(renderer.window);
}

export function closeHtmlRenderer(renderer) {
  close(renderer.window);
  return renderer;
}

export function drainHtmlRendererActions(renderer) {
  var actions = renderer.actions;
  renderer.actions = [];
  return actions;
}

export function runHtmlRenderer(renderer) {
  showHtmlRenderer(renderer);
  while (!shouldCloseHtmlRenderer(renderer)) {
    updateHtmlRenderer(renderer);
    sleep(16);
  }
  closeHtmlRenderer(renderer);
  return 0;
}
