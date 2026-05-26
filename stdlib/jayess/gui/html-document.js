import { drawHtml, hitTestHtmlNode, layoutHtml } from "jayess:canvas";
import { editHtmlInput, htmlInputAction, inputValue } from "./html-input.js";

function nodeId(node) {
  if (node === null || node.attributes === null) {
    return null;
  }
  return node.attributes.id;
}

function isDisabled(node) {
  if (node === null || node.attributes === null) {
    return false;
  }
  return node.attributes.disabled === "true" || node.attributes.disabled === "disabled";
}

function targetType(node) {
  if (node === null || node.attributes === null || node.attributes.type === null) {
    return "";
  }
  return node.attributes.type;
}

function findFormIdByTarget(node, targetId, activeFormId) {
  var formId = activeFormId;
  if (node.tagName === "form") {
    formId = nodeId(node);
  }
  if (nodeId(node) === targetId) {
    return formId;
  }
  if (node.children !== null) {
    for (var index = 0; index < node.children.length; index = index + 1) {
      var found = findFormIdByTarget(node.children[index], targetId, formId);
      if (found !== null) {
        return found;
      }
    }
  }
  return null;
}

function submitAction(windowState, target) {
  var targetId = nodeId(target);
  return {
    type: "htmlSubmit",
    targetId: targetId,
    formId: findFormIdByTarget(windowState.htmlDocument.tree, targetId, null)
  };
}

function dispatchDocumentMouseUp(windowState, event) {
  var target = hitTestHtmlNode(windowState.htmlDocument, event.x, event.y);
  if (target === null) {
    return null;
  }
  if (isDisabled(target)) {
    return null;
  }
  if (target.tagName === "button") {
    windowState.actions.push({
      type: "htmlClick",
      targetId: nodeId(target),
      role: "button"
    });
    if (targetType(target) === "submit") {
      windowState.actions.push(submitAction(windowState, target));
    }
    windowState.dirty = true;
  }
  if (target.tagName === "input") {
    windowState.htmlFocus = nodeId(target);
    windowState.actions.push({
      type: "htmlInputFocus",
      targetId: nodeId(target),
      value: inputValue(target)
    });
    windowState.dirty = true;
  }
}

function findHtmlNodeById(node, targetId) {
  if (nodeId(node) === targetId) {
    return node;
  }
  if (node.children !== null) {
    for (var index = 0; index < node.children.length; index = index + 1) {
      var child = findHtmlNodeById(node.children[index], targetId);
      if (child !== null) {
        return child;
      }
    }
  }
  return null;
}

function focusedHtmlInput(windowState) {
  if (windowState.htmlFocus === null || windowState.htmlDocument === null) {
    return null;
  }
  return findHtmlNodeById(windowState.htmlDocument.tree, windowState.htmlFocus);
}

function dispatchDocumentKeyDown(windowState, event) {
  var target = focusedHtmlInput(windowState);
  if (target === null || target.tagName !== "input" || isDisabled(target)) {
    return null;
  }
  var result = editHtmlInput(target, event);
  if (result === true) {
    windowState.actions.push(htmlInputAction("htmlInput", target));
    windowState.dirty = true;
  } else if (result === "change") {
    windowState.actions.push(htmlInputAction("htmlChange", target));
    windowState.dirty = true;
  } else if (result === "cursor") {
    windowState.dirty = true;
  }
}

export function attachHtmlDocument(windowState, document) {
  windowState.htmlDocument = document;
  windowState.htmlFocus = null;
  windowState.needsLayout = true;
  windowState.dirty = true;
  return windowState;
}

export function updateHtmlDocument(windowState, events) {
  if (windowState.htmlDocument === null || events === null) {
    return windowState;
  }
  for (var index = 0; index < events.length; index = index + 1) {
    var event = events[index];
    if (event.type === "resize") {
      windowState.needsLayout = true;
      windowState.dirty = true;
    } else if (event.type === "mouseUp" && event.button === "left") {
      dispatchDocumentMouseUp(windowState, event);
    } else if (event.type === "keyDown") {
      dispatchDocumentKeyDown(windowState, event);
    }
  }
  return windowState;
}

export function drawHtmlDocument(windowState, canvas) {
  if (windowState.htmlDocument === null) {
    return canvas;
  }
  if (windowState.needsLayout) {
    layoutHtml(windowState.htmlDocument, {
      x: 0,
      y: 0,
      width: windowState.width,
      height: windowState.height
    });
  }
  drawHtml(canvas, windowState.htmlDocument);
  return canvas;
}
