import { rgb } from "jayess:color";
import {
  create,
  createHtmlDocument,
  drawHtml,
  getPixel,
  hitTestHtml,
  layoutHtml,
  parseCss,
  parseHtml,
  saveImage
} from "jayess:canvas";
import {
  attachHtmlDocument,
  createWindowState,
  drainActions,
  drawHtmlDocument,
  updateHtmlDocument
} from "jayess:gui";

export function inspect() {
  var tree = parseHtml("<div id=\"root\"><button id=\"ok\">OK</button><p>Hello</p><input id=\"name\" value=\"A\" /></div>", null);
  var sheet = parseCss("div { background-color: #102030; padding: 2; } button { background-color: #ffffff; color: #000000; width: 32; height: 14; }", null);
  var document = createHtmlDocument("<div id=\"root\"><button id=\"ok\">OK</button><p>Hello</p><input id=\"name\" value=\"A\" /></div>", "div { background-color: #102030; padding: 2; } button { background-color: #ffffff; color: #000000; width: 32; height: 14; } input { background-color: #ffffff; color: #000000; width: 32; height: 14; } p { color: #ffffff; }", null);
  var canvas = create(80, 40, { background: rgb(0, 0, 0) });
  layoutHtml(document, { x: 0, y: 0, width: 80, height: 40 });
  drawHtml(canvas, document);
  var pixel = getPixel(canvas, 1, 1);
  var buttonHit = hitTestHtml(document, 4, 4);

  var windowState = createWindowState({ width: 80, height: 40 });
  attachHtmlDocument(windowState, document);
  drawHtmlDocument(windowState, canvas);
  updateHtmlDocument(windowState, [{ type: "mouseUp", button: "left", x: 4, y: 4 }]);
  updateHtmlDocument(windowState, [{ type: "mouseUp", button: "left", x: 4, y: 29 }]);
  updateHtmlDocument(windowState, [{ type: "keyDown", key: "B" }]);
  updateHtmlDocument(windowState, [{ type: "keyDown", key: "Enter" }]);
  var actions = drainActions(windowState);

  return [
    tree.children.length,
    sheet.rules.length,
    document.tree.children[0].layout.width,
    pixel.red,
    buttonHit.targetId,
    buttonHit.role,
    actions.length,
    actions[0].type,
    actions[0].targetId,
    actions[1].type,
    actions[1].targetId,
    actions[1].value,
    actions[2].type,
    actions[2].value,
    actions[3].type,
    actions[3].value
  ];
}

export function invalidHtml() {
  return parseHtml("<section></section>", null);
}

export function invalidCss() {
  return parseCss("div { position: absolute; }", null);
}

export function inspectBoxModel() {
  var document = createHtmlDocument(
    "<div id=\"root\"><p id=\"message\" class=\"message\">Alpha Beta Gamma Delta</p></div>",
    "div { background-color: #102030; border-width: 1; border-color: #ff0000; padding: 2; width: 40; } div .message { color: #ffffff; font-size: 8; width: 20; }",
    null
  );
  var canvas = create(80, 48, { background: rgb(0, 0, 0) });
  layoutHtml(document, { x: 0, y: 0, width: 80, height: 48 });
  drawHtml(canvas, document);
  var root = document.tree.children[0];
  var message = root.children[0];
  var borderPixel = getPixel(canvas, 0, 0);
  var messageHit = hitTestHtml(document, 4, 8);
  return [
    document.stylesheet.rules.length,
    document.stylesheet.rules[1].kind,
    document.stylesheet.rules[1].chain.length,
    root.layout.borderWidth,
    root.layout.padding,
    message.layout.width,
    message.layout.textLines.length,
    message.style.color.red,
    borderPixel.red,
    messageHit.targetId
  ];
}

export function inspectCssConstraints() {
  var document = createHtmlDocument(
    "<div id=\"box\"><p id=\"fill\">Alpha Beta Gamma Delta</p></div>",
    "div { background-color: #ff0000; width: 40; min-width: 50; max-width: 60; height: 20; min-height: 24; max-height: 26; overflow: hidden; } p { background-color: #0000ff; color: #ffffff; width: 48; height: 40; }",
    null
  );
  var canvas = create(80, 48, { background: rgb(0, 0, 0) });
  layoutHtml(document, { x: 0, y: 0, width: 80, height: 48 });
  drawHtml(canvas, document);
  var root = document.tree.children[0];
  var child = root.children[0];
  var visiblePixel = getPixel(canvas, 2, 20);
  var clippedPixel = getPixel(canvas, 2, 30);
  var edgePixel = getPixel(canvas, 49, 23);
  return [
    root.layout.width,
    root.layout.height,
    root.layout.overflow,
    child.layout.height,
    visiblePixel.blue,
    clippedPixel.blue,
    edgePixel.red,
    document.stylesheet.rules[0].style["min-width"].value
  ];
}

export function inspectPercentageLayout() {
  var document = createHtmlDocument(
    "<div id=\"root\"><p id=\"half\">Half</p></div>",
    "div { background-color: #112233; width: 100%; height: 100%; padding: 4; border-width: 2; border-color: #ffffff; } p { background-color: #ff0000; color: #ffffff; width: 50%; height: 50%; }",
    null
  );
  var canvas = create(100, 60, { background: rgb(0, 0, 0) });
  layoutHtml(document, { x: 0, y: 0, width: 100, height: 60 });
  drawHtml(canvas, document);
  var root = document.tree.children[0];
  var child = root.children[0];
  var rootPixel = getPixel(canvas, 99, 59);
  var childPixel = getPixel(canvas, 8, 12);
  var childHit = hitTestHtml(document, 8, 12);
  return [
    root.layout.width,
    root.layout.height,
    root.layout.contentWidth,
    child.layout.width,
    child.layout.height,
    rootPixel.blue,
    childPixel.red,
    childHit.targetId
  ];
}

export function inspectCssCompatibility() {
  var document = createHtmlDocument(
    "<div id=root><button id=save disabled>Save</button><p id=child kind=note>Child</p></div>",
    "/* ordinary comment */ div { width: 100%; height: 100%; } button, p { color: #ffffff; } div > p { background-color: #ff0000; width: 50%; height: 50%; box-sizing: content-box; padding: 2; border-width: 1; border-color: #00ff00; }",
    null
  );
  var canvas = create(100, 60, { background: rgb(0, 0, 0) });
  layoutHtml(document, { x: 0, y: 0, width: 100, height: 60 });
  drawHtml(canvas, document);
  var root = document.tree.children[0];
  var button = root.children[0];
  var child = root.children[1];
  var childPixel = getPixel(canvas, 3, 18);
  var childHit = hitTestHtml(document, 3, 18);
  return [
    document.stylesheet.rules.length,
    document.stylesheet.rules[3].kind,
    button.attributes.disabled,
    child.attributes.id,
    child.style.color.red,
    root.layout.width,
    root.layout.height,
    child.layout.width,
    child.layout.height,
    child.layout.padding,
    child.layout.borderWidth,
    childPixel.red,
    childHit.targetId
  ];
}

export function inspectHtmlMaturity() {
  var document = createHtmlDocument(
    "<form id=\"login\"><p id=\"copy\"><span>Hello</span><span> Jayess</span></p><button id=\"send\" type=\"submit\">Send</button><button id=\"off\" disabled=\"true\">Off</button><input id=\"field\" disabled=\"true\" value=\"A\" /></form>",
    "form { background-color: #101010; padding: 1 2 3 4; margin: 2 3; border-width: 1; border-color: #00ff00; } p { color: #ffffff; font-size: 8; width: 64; } button { background-color: #ffffff; color: #000000; width: 32; height: 12; margin: 1 2 3 4; padding: 2 3; } input { width: 32; height: 12; color: #ffffff; }",
    null
  );
  var canvas = create(96, 64, { background: rgb(0, 0, 0) });
  layoutHtml(document, { x: 0, y: 0, width: 96, height: 64 });
  drawHtml(canvas, document);
  var form = document.tree.children[0];
  var copy = form.children[0];
  var submit = form.children[1];
  var disabledButton = form.children[2];
  var disabledInput = form.children[3];
  var submitHit = hitTestHtml(document, 14, 18);
  var disabledHit = hitTestHtml(document, 14, 30);

  var windowState = createWindowState({ width: 96, height: 64 });
  attachHtmlDocument(windowState, document);
  updateHtmlDocument(windowState, [{ type: "mouseUp", button: "left", x: 14, y: 18 }]);
  updateHtmlDocument(windowState, [{ type: "mouseUp", button: "left", x: 14, y: 30 }]);
  updateHtmlDocument(windowState, [{ type: "mouseUp", button: "left", x: 14, y: 42 }]);
  updateHtmlDocument(windowState, [{ type: "keyDown", key: "B" }]);
  var actions = drainActions(windowState);

  return [
    form.layout.paddingTop,
    form.layout.paddingRight,
    form.layout.paddingBottom,
    form.layout.paddingLeft,
    form.layout.marginTop,
    form.layout.marginRight,
    copy.layout.text,
    submit.layout.marginLeft,
    submit.layout.paddingRight,
    disabledButton.layout.disabled,
    disabledInput.layout.disabled,
    submitHit.disabled,
    disabledHit.disabled,
    actions.length,
    actions[0].type,
    actions[1].type,
    actions[1].formId
  ];
}

export function renderScene(path) {
  var document = createHtmlDocument("<div><button id=\"ok\">OK</button><p class=\"message\">Alpha Beta Gamma Delta</p></div>", "div { background-color: #102030; border-width: 1; border-color: #ff0000; padding: 2; } button { background-color: #ffffff; color: #000000; width: 32; height: 14; } div .message { color: #ffffff; font-size: 8; width: 24; }", null);
  var canvas = create(48, 24, { background: rgb(0, 0, 0) });
  layoutHtml(document, { x: 0, y: 0, width: 48, height: 24 });
  drawHtml(canvas, document);
  saveImage(canvas, path);
  return path;
}
