import {
  cancelFrame,
  pollEvents,
  requestFrame,
  runFrame,
  shouldClose
} from "jayess:window";

function frameCallback(window, label) {
  var events = pollEvents(window);
  return [
    shouldClose(window),
    events.length,
    label
  ];
}

function runFrameCallback(window, state, label) {
  var events = pollEvents(window);
  state.count = state.count + 1;
  return [
    label,
    state.count,
    events.length
  ];
}

export function scheduleFrame(window) {
  var frame = requestFrame(window, frameCallback, ["frame"]);
  return frame.done;
}

export function cancelScheduledFrame(window) {
  var frame = requestFrame(window, frameCallback, ["cancelled"]);
  cancelFrame(frame);
  return frame.done;
}

export function scheduleRunFrame(window) {
  var state = { count: 0 };
  var frame = runFrame(window, state, runFrameCallback, ["loop!"]);
  return frame.done;
}

export function skipRunFrame(window) {
  return runFrame(window, { count: 0 }, runFrameCallback, ["closed"]);
}
