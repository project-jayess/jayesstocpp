import { contains } from "jayess:layout";

function targetId(node) {
  if (node === null || node.attributes === null) {
    return null;
  }
  if (node.attributes.id !== null) {
    return node.attributes.id;
  }
  if (node.attributes.name !== null) {
    return node.attributes.name;
  }
  return null;
}

function role(node) {
  if (node.tagName === "button") {
    return "button";
  }
  if (node.tagName === "input") {
    return "input";
  }
  return "node";
}

function disabled(node) {
  if (node === null || node.attributes === null) {
    return false;
  }
  return node.attributes.disabled === "true" || node.attributes.disabled === "disabled";
}

function hitNode(node, x, y) {
  if (node.layout === null || !contains(node.layout, x, y)) {
    return null;
  }
  if (node.children !== null) {
    for (var index = node.children.length - 1; index >= 0; index = index - 1) {
      var child = hitNode(node.children[index], x, y);
      if (child !== null) {
        return child;
      }
    }
  }
  return node;
}

export function hitTestHtmlNode(document, x, y) {
  for (var index = document.tree.children.length - 1; index >= 0; index = index - 1) {
    var match = hitNode(document.tree.children[index], x, y);
    if (match !== null) {
      return match;
    }
  }
  return null;
}

export function hitTestHtml(document, x, y) {
  var node = hitTestHtmlNode(document, x, y);
  if (node === null) {
    return null;
  }
  return {
    type: "htmlHit",
    tagName: node.tagName,
    role: role(node),
    targetId: targetId(node),
    disabled: disabled(node),
    bounds: node.layout
  };
}
