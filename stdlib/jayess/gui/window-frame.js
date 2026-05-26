import { pollEvents, present, runFrame, shouldClose } from "jayess:window";
import { needsRedraw } from "./model.js";
import { update } from "./event-dispatch.js";
import { draw } from "./paint.js";

function frameResult(scheduled, handle, done, state, rendered, presented, result) {
  return {
    scheduled: scheduled,
    done: done,
    handle: handle,
    state: state,
    rendered: rendered,
    presented: presented,
    closed: state.closed === true,
    queuedActions: state.actions.length,
    result: result
  };
}

export function runGuiFrame(window, windowState, canvas, callback, args) {
  if (shouldClose(window) || windowState.closed === true) {
    return frameResult(false, null, null, windowState, false, false, null);
  }

  var frame = runFrame(window, windowState, function (currentWindow, currentState, currentCanvas, currentCallback, currentArgs) {
    var events = pollEvents(currentWindow);
    update(currentState, events);
    var result = currentCallback(currentWindow, currentState, events, ...currentArgs);
    var rendered = false;
    var presented = false;
    if (needsRedraw(currentState) && currentState.closed !== true && !shouldClose(currentWindow)) {
      draw(currentState, currentCanvas);
      rendered = true;
      present(currentWindow, currentCanvas);
      presented = true;
    }
    return frameResult(true, null, null, currentState, rendered, presented, result);
  }, [canvas, callback, args == null ? [] : args]);

  return frameResult(true, frame.handle, frame.done, windowState, false, false, null);
}
