import { rgba } from "jayess:color";

function maxValue(left, right) {
  return left > right ? left : right;
}

function minValue(left, right) {
  return left < right ? left : right;
}

function visibleScrollbar(overflow, scrollSize, clientSize) {
  if (overflow === "scroll") {
    return true;
  }
  return overflow === "auto" && scrollSize > clientSize;
}

function scrollbarThumb(trackStart, trackSize, scrollSize, clientSize, scrollOffset) {
  if (scrollSize <= clientSize || trackSize <= 0) {
    return {
      start: trackStart,
      size: trackSize
    };
  }
  var size = trackSize * clientSize / scrollSize;
  if (size < 18) {
    size = minValue(18, trackSize);
  }
  var range = trackSize - size;
  var scrollRange = scrollSize - clientSize;
  var start = trackStart;
  if (scrollRange > 0) {
    start = trackStart + range * scrollOffset / scrollRange;
  }
  return {
    start: start,
    size: size
  };
}

function paintScrollbars(canvas, node, operations, offsetX, offsetY) {
  if (node.layout === null) {
    return canvas;
  }
  var layout = node.layout;
  var barSize = 12;
  var vertical = visibleScrollbar(layout.overflowY, layout.scrollHeight, layout.clientHeight);
  var horizontal = visibleScrollbar(layout.overflowX, layout.scrollWidth, layout.clientWidth);
  if (vertical) {
    var trackHeight = layout.height - (horizontal ? barSize : 0);
    var trackX = layout.x + offsetX + layout.width - barSize;
    var trackY = layout.y + offsetY;
    operations.fillRect(canvas, trackX, trackY, barSize, trackHeight, rgba(0, 0, 0, 0.35));
    var thumb = scrollbarThumb(trackY, trackHeight, layout.scrollHeight, layout.clientHeight, layout.scrollTop);
    operations.fillRect(canvas, trackX + 2, thumb.start + 2, barSize - 4, maxValue(1, thumb.size - 4), rgba(220, 230, 240, 0.75));
  }
  if (horizontal) {
    var trackWidth = layout.width - (vertical ? barSize : 0);
    var horizontalTrackX = layout.x + offsetX;
    var trackY = layout.y + offsetY + layout.height - barSize;
    operations.fillRect(canvas, horizontalTrackX, trackY, trackWidth, barSize, rgba(0, 0, 0, 0.35));
    var horizontalThumb = scrollbarThumb(horizontalTrackX, trackWidth, layout.scrollWidth, layout.clientWidth, layout.scrollLeft);
    operations.fillRect(canvas, horizontalThumb.start + 2, trackY + 2, maxValue(1, horizontalThumb.size - 4), barSize - 4, rgba(220, 230, 240, 0.75));
  }
  return canvas;
}

function paintNode(canvas, node, operations, offsetX, offsetY) {
  if (node.layout === null) {
    return canvas;
  }

  var style = node.style;
  if (style["background-color"] !== null) {
    operations.fillRect(canvas, node.layout.x + offsetX, node.layout.y + offsetY, node.layout.width, node.layout.height, style["background-color"]);
  }
  if (node.layout.borderWidth > 0 && style["border-color"] !== null) {
    operations.strokeRect(canvas, node.layout.x + offsetX, node.layout.y + offsetY, node.layout.width, node.layout.height, style["border-color"], {
      strokeWidth: node.layout.borderWidth
    });
  }

  var clipped = node.layout.overflow !== "visible" && operations.clipRect !== null && operations.popClip !== null;
  if (clipped) {
    operations.clipRect(canvas, node.layout.x + offsetX, node.layout.y + offsetY, node.layout.width, node.layout.height);
  }

  if (node.type === "text" || node.tagName === "button" || node.tagName === "input" || node.tagName === "label" || node.tagName === "span" || node.tagName === "p") {
    if (node.layout.text !== "" && style.color !== null) {
      var lines = node.layout.textLines;
      if (lines === null || lines.length === 0) {
        lines = [node.layout.text];
      }
      for (var lineIndex = 0; lineIndex < lines.length; lineIndex = lineIndex + 1) {
        operations.text(canvas, lines[lineIndex], node.layout.contentX + offsetX, node.layout.contentY + offsetY + lineIndex * node.layout.lineHeight, {
          color: style.color,
          charHeight: node.layout.fontSize,
          lineHeight: node.layout.lineHeight,
          fontFamily: style["font-family"]
        });
      }
    }
  }

  if (node.tagName === "img" && node.attributes.image !== null) {
    operations.drawImage(canvas, node.attributes.image, node.layout.x + offsetX, node.layout.y + offsetY);
  }

  if (node.children !== null) {
    var childOffsetX = offsetX - node.layout.scrollLeft;
    var childOffsetY = offsetY - node.layout.scrollTop;
    for (var index = 0; index < node.children.length; index = index + 1) {
      paintNode(canvas, node.children[index], operations, childOffsetX, childOffsetY);
    }
  }
  if (clipped) {
    operations.popClip(canvas);
  }
  paintScrollbars(canvas, node, operations, offsetX, offsetY);
  return canvas;
}

function paintNodeScrollbars(canvas, node, operations, offsetX, offsetY) {
  if (node.layout === null) {
    return canvas;
  }
  if (node.children !== null) {
    var childOffsetX = offsetX - node.layout.scrollLeft;
    var childOffsetY = offsetY - node.layout.scrollTop;
    for (var index = 0; index < node.children.length; index = index + 1) {
      paintNodeScrollbars(canvas, node.children[index], operations, childOffsetX, childOffsetY);
    }
  }
  return paintScrollbars(canvas, node, operations, offsetX, offsetY);
}

export function paintHtmlDocument(canvas, document, operations) {
  for (var index = 0; index < document.tree.children.length; index = index + 1) {
    paintNode(canvas, document.tree.children[index], operations, 0, 0);
  }
  return canvas;
}

export function paintHtmlScrollbarsDocument(canvas, document, operations) {
  for (var index = 0; index < document.tree.children.length; index = index + 1) {
    paintNodeScrollbars(canvas, document.tree.children[index], operations, 0, 0);
  }
  return canvas;
}
