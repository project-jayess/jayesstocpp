import {
  jayessWindowAddEventListener,
  jayessWindowClose,
  jayessWindowCreate,
  jayessWindowCurrentFps,
  jayessWindowDispatchEvents,
  jayessWindowFrame,
  jayessWindowHeight,
  jayessWindowHide,
  jayessWindowPollEvents,
  jayessWindowPresent,
  jayessWindowRequestRender,
  jayessWindowRemoveEventListener,
  jayessWindowRequestClose,
  jayessWindowRun,
  jayessWindowSetTitle,
  jayessWindowSetFps,
  jayessWindowShouldClose,
  jayessWindowShow,
  jayessWindowWidth
} from "./window-primitives.hpp";
import { clearTimeout, setTimeout } from "jayess:timers";

export function create(options) {
  return jayessWindowCreate(options);
}

export function show(window) {
  return jayessWindowShow(window);
}

export function hide(window) {
  return jayessWindowHide(window);
}

export function frame(window, enabled) {
  return jayessWindowFrame(window, enabled);
}

export function close(window) {
  return jayessWindowClose(window);
}

export function shouldClose(window) {
  return jayessWindowShouldClose(window);
}

export function isClosing(window) {
  return jayessWindowShouldClose(window);
}

export function requestClose(window) {
  return jayessWindowRequestClose(window);
}

export function pollEvents(window) {
  return jayessWindowPollEvents(window);
}

export function addEventListener(window, name, callback) {
  return jayessWindowAddEventListener(window, name, callback);
}

export function removeEventListener(window, name, callback) {
  return jayessWindowRemoveEventListener(window, name, callback);
}

export function dispatchEvents(window) {
  return jayessWindowDispatchEvents(window);
}

export function run(window) {
  return jayessWindowRun(window);
}

export function setFps(window, fps) {
  return jayessWindowSetFps(window, fps);
}

export function currentFps(window) {
  return jayessWindowCurrentFps(window);
}

export function requestFrame(window, callback, args) {
  return setTimeout(function (currentWindow, currentCallback, currentArgs) {
    if (shouldClose(currentWindow)) {
      return null;
    }
    return currentCallback(currentWindow, ...currentArgs);
  }, 0, [window, callback, args == null ? [] : args]);
}

export function cancelFrame(handle) {
  return clearTimeout(handle);
}

export function runFrame(window, state, callback, args) {
  if (shouldClose(window)) {
    return {
      scheduled: false,
      done: null,
      handle: null,
      state: state
    };
  }
  var handle = requestFrame(window, function (currentWindow, currentState, currentCallback, currentArgs) {
    if (shouldClose(currentWindow)) {
      return null;
    }
    return currentCallback(currentWindow, currentState, ...currentArgs);
  }, [state, callback, args == null ? [] : args]);
  return {
    scheduled: true,
    done: handle.done,
    handle: handle,
    state: state
  };
}

export function present(window, canvas) {
  return jayessWindowPresent(window, canvas);
}

export function requestRender(window, canvas) {
  return jayessWindowRequestRender(window, canvas);
}

export function width(window) {
  return jayessWindowWidth(window);
}

export function height(window) {
  return jayessWindowHeight(window);
}

export function setTitle(window, title) {
  return jayessWindowSetTitle(window, title);
}
