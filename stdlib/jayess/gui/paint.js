import { clear, fillRect, line, strokeRect } from "jayess:canvas";
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

function inputBackground(windowState, input) {
  var theme = windowState.theme;
  if (input.focused) {
    return widgetColor(input.focusedBackground, theme.inputFocusedBackground);
  }
  return widgetColor(input.background, theme.inputBackground);
}

function inputBorder(windowState, input) {
  if (input.focused) {
    return widgetColor(input.focusBorderColor, windowState.theme.inputFocusBorder);
  }
  return widgetColor(input.borderColor, windowState.theme.inputBorder);
}

function inputText(input) {
  if (input.value === "") {
    return input.placeholder;
  }
  return input.value;
}

function inputTextColor(windowState, input) {
  if (input.value === "") {
    return widgetColor(input.placeholderColor, windowState.theme.inputPlaceholderColor);
  }
  return widgetColor(input.color, windowState.theme.labelColor);
}

function controlBorder(windowState, control) {
  if (control.focused) {
    return widgetColor(control.borderColor, windowState.theme.controlFocusBorder);
  }
  return widgetColor(control.borderColor, windowState.theme.controlBorder);
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

  if (widget.kind === "textInput") {
    fillRect(canvas, widget.bounds.x, widget.bounds.y, widget.bounds.width, widget.bounds.height, inputBackground(windowState, widget));
    strokeRect(canvas, widget.bounds.x, widget.bounds.y, widget.bounds.width, widget.bounds.height, inputBorder(windowState, widget));
    drawTextAligned(
      canvas,
      null,
      inputText(widget),
      inset(widget.bounds, widget.padding),
      inputTextColor(windowState, widget),
      {
        align: "left",
        verticalAlign: "middle"
      }
    );
    if (widget.focused) {
      var cursorX = widget.bounds.x + widget.padding + widget.cursor * 6;
      line(canvas, cursorX, widget.bounds.y + widget.padding, cursorX, widget.bounds.y + widget.bounds.height - widget.padding - 1, windowState.theme.inputCursorColor);
    }
    return canvas;
  }

  if (widget.kind === "checkbox" || widget.kind === "radio") {
    var boxSize = widget.bounds.height - widget.padding * 2;
    if (boxSize < 4) {
      boxSize = 4;
    }
    var boxX = widget.bounds.x + widget.padding;
    var boxY = widget.bounds.y + widget.padding;
    fillRect(canvas, boxX, boxY, boxSize, boxSize, widgetColor(widget.background, windowState.theme.controlBackground));
    strokeRect(canvas, boxX, boxY, boxSize, boxSize, controlBorder(windowState, widget));
    if (widget.checked) {
      fillRect(canvas, boxX + 3, boxY + 3, boxSize - 6, boxSize - 6, windowState.theme.controlCheckedBackground);
    }
    drawTextAligned(
      canvas,
      null,
      widget.text,
      {
        x: boxX + boxSize + 4,
        y: widget.bounds.y,
        width: widget.bounds.width - boxSize - widget.padding * 2 - 4,
        height: widget.bounds.height
      },
      widgetColor(widget.color, windowState.theme.labelColor),
      {
        align: "left",
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
