import { clear, fillRect, strokeRect } from "jayess:canvas";
import { drawTextAligned } from "jayess:font";
import { inset } from "jayess:layout";
import { layout } from "./layout-pass.js";

function widgetColor(explicit, fallback) {
  if (explicit !== null) {
    return explicit;
  }
  return fallback;
}

function buttonBackground(windowState, button) {
  var theme = windowState.theme;
  if (button.pressed) {
    return widgetColor(button.pressedBackground, theme.buttonPressedBackground);
  }
  if (button.hovered) {
    return widgetColor(button.hoverBackground, theme.buttonHoverBackground);
  }
  return widgetColor(button.background, theme.buttonBackground);
}

function drawWidget(windowState, canvas, widget) {
  if (widget === null || widget.bounds === null) {
    return canvas;
  }

  if (widget.kind === "label") {
    if (widget.background !== null) {
      fillRect(canvas, widget.bounds.x, widget.bounds.y, widget.bounds.width, widget.bounds.height, widget.background);
    }
    drawTextAligned(
      canvas,
      null,
      widget.text,
      inset(widget.bounds, widget.padding),
      widgetColor(widget.color, windowState.theme.labelColor),
      {
        align: widget.align,
        verticalAlign: "middle"
      }
    );
    return canvas;
  }

  if (widget.kind === "button") {
    fillRect(canvas, widget.bounds.x, widget.bounds.y, widget.bounds.width, widget.bounds.height, buttonBackground(windowState, widget));
    strokeRect(canvas, widget.bounds.x, widget.bounds.y, widget.bounds.width, widget.bounds.height, widgetColor(widget.borderColor, windowState.theme.buttonBorder));
    drawTextAligned(
      canvas,
      null,
      widget.text,
      inset(widget.bounds, widget.padding),
      widgetColor(widget.color, windowState.theme.labelColor),
      {
        align: widget.align,
        verticalAlign: "middle"
      }
    );
    return canvas;
  }

  if (widget.background !== null) {
    fillRect(canvas, widget.bounds.x, widget.bounds.y, widget.bounds.width, widget.bounds.height, widget.background);
  }
  for (var index = 0; index < widget.children.length; index = index + 1) {
    drawWidget(windowState, canvas, widget.children[index]);
  }
  return canvas;
}

export function draw(windowState, canvas) {
  if (windowState.needsLayout) {
    layout(windowState);
  }
  clear(canvas, windowState.background);
  drawWidget(windowState, canvas, windowState.root);
  windowState.dirty = false;
  return canvas;
}
