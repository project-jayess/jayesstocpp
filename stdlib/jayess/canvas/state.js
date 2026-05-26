export function defaultDrawingState(fillColor, strokeColor, strokeWidth, textColor, textSize) {
  return {
    fillColor: fillColor,
    strokeColor: strokeColor,
    strokeWidth: strokeWidth,
    textColor: textColor,
    textSize: textSize,
    translateX: 0,
    translateY: 0,
    scaleX: 1,
    scaleY: 1
  };
}

export function copyDrawingState(state) {
  return {
    fillColor: state.fillColor,
    strokeColor: state.strokeColor,
    strokeWidth: state.strokeWidth,
    textColor: state.textColor,
    textSize: state.textSize,
    translateX: state.translateX,
    translateY: state.translateY,
    scaleX: state.scaleX,
    scaleY: state.scaleY
  };
}

export function copyDrawingStateStack(stack) {
  var copied = [];
  for (var index = 0; index < stack.length; index = index + 1) {
    copied.push({
      state: copyDrawingState(stack[index].state),
      clipStack: copyClipStack(stack[index].clipStack)
    });
  }
  return copied;
}

function copyClipStack(stack) {
  var copied = [];
  for (var index = 0; index < stack.length; index = index + 1) {
    copied.push(stack[index]);
  }
  return copied;
}

export function pushDrawingState(canvas) {
  canvas.stateStack.push({
    state: copyDrawingState(canvas.state),
    clipStack: copyClipStack(canvas.clipStack)
  });
  return canvas;
}

export function popDrawingState(canvas) {
  if (canvas.stateStack.length === 0) {
    throw "jayess:canvas restoreState requires a saved state";
  }
  var frame = canvas.stateStack[canvas.stateStack.length - 1];
  canvas.state = frame.state;
  canvas.clipStack = frame.clipStack;
  canvas.stateStack.pop();
  return canvas;
}

export function transformedPoint(state, x, y, roundValue) {
  return {
    x: roundValue(x * state.scaleX + state.translateX),
    y: roundValue(y * state.scaleY + state.translateY)
  };
}

export function scaleState(state, x, y) {
  if (x === 0 || y === 0) {
    throw "jayess:canvas scale values must be non-zero";
  }
  state.scaleX = state.scaleX * x;
  state.scaleY = state.scaleY * y;
  return state;
}
