import { cancelFrame, pollEvents, requestFrame, runFrame, shouldClose } from "jayess:window";
import { create as createCanvas } from "jayess:canvas";
import { rgb } from "jayess:color";
import { createWindowState, runGuiFrame } from "jayess:gui";

export function scheduleFrame(window) {
  var handle = requestFrame(window, function (currentWindow, label) {
    var events = pollEvents(currentWindow);
    return [shouldClose(currentWindow), events.length, label];
  }, ["frame"]);
  return handle.done;
}

export async function cancelScheduledFrame(window) {
  var handle = requestFrame(window, function () {
    return "ran";
  }, []);
  cancelFrame(handle);
  return await handle.done;
}

export function scheduleRunFrame(window) {
  var state = {
    label: "loop",
    updates: 0
  };
  var frame = runFrame(window, state, function (currentWindow, currentState, suffix) {
    var events = pollEvents(currentWindow);
    currentState.updates = currentState.updates + 1;
    return [currentState.label + suffix, currentState.updates, events.length];
  }, ["!"]);
  return frame.done;
}

export function skipRunFrame(window) {
  var state = {
    label: "closed"
  };
  return runFrame(window, state, function () {
    return "ran";
  }, []);
}

export function scheduleGuiFrame(window) {
  var state = createWindowState({
    width: 64,
    height: 32,
    background: rgb(0, 0, 0)
  });
  var canvas = createCanvas(64, 32, { background: rgb(0, 0, 0) });
  var frame = runGuiFrame(window, state, canvas, function (currentWindow, currentState, events, label) {
    currentState.actions.push({
      type: "custom",
      targetId: label
    });
    return events.length;
  }, ["gui"]);
  return frame.done;
}

export function skipGuiFrame(window) {
  var state = createWindowState({
    width: 64,
    height: 32
  });
  var canvas = createCanvas(64, 32, null);
  return runGuiFrame(window, state, canvas, function () {
    return "ran";
  }, []);
}
