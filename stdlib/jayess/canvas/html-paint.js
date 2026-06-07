function paintNode(canvas, node, operations) {
  if (node.layout === null) {
    return canvas;
  }

  var style = node.style;
  if (style["background-color"] !== null) {
    operations.fillRect(canvas, node.layout.x, node.layout.y, node.layout.width, node.layout.height, style["background-color"]);
  }
  if (node.layout.borderWidth > 0 && style["border-color"] !== null) {
    operations.strokeRect(canvas, node.layout.x, node.layout.y, node.layout.width, node.layout.height, style["border-color"], {
      strokeWidth: node.layout.borderWidth
    });
  }

  var clipped = node.layout.overflow === "hidden" && operations.clipRect !== null && operations.popClip !== null;
  if (clipped) {
    operations.clipRect(canvas, node.layout.x, node.layout.y, node.layout.width, node.layout.height);
  }

  if (node.type === "text" || node.tagName === "button" || node.tagName === "input" || node.tagName === "label" || node.tagName === "span" || node.tagName === "p") {
    if (node.layout.text !== "" && style.color !== null) {
      var lines = node.layout.textLines;
      if (lines === null || lines.length === 0) {
        lines = [node.layout.text];
      }
      for (var lineIndex = 0; lineIndex < lines.length; lineIndex = lineIndex + 1) {
        operations.text(canvas, lines[lineIndex], node.layout.contentX, node.layout.contentY + lineIndex * node.layout.lineHeight, {
          color: style.color,
          charHeight: node.layout.fontSize,
          lineHeight: node.layout.lineHeight,
          fontFamily: style["font-family"]
        });
      }
    }
  }

  if (node.tagName === "img" && node.attributes.image !== null) {
    operations.drawImage(canvas, node.attributes.image, node.layout.x, node.layout.y);
  }

  if (node.children !== null) {
    for (var index = 0; index < node.children.length; index = index + 1) {
      paintNode(canvas, node.children[index], operations);
    }
  }
  if (clipped) {
    operations.popClip(canvas);
  }
  return canvas;
}

export function paintHtmlDocument(canvas, document, operations) {
  for (var index = 0; index < document.tree.children.length; index = index + 1) {
    paintNode(canvas, document.tree.children[index], operations);
  }
  return canvas;
}
