import {
  jayessWindowClose,
  jayessWindowCreate,
  jayessWindowHeight,
  jayessWindowPollEvents,
  jayessWindowPresent,
  jayessWindowRequestClose,
  jayessWindowSetTitle,
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

export function close(window) {
  return jayessWindowClose(window);
}

export function shouldClose(window) {
  return jayessWindowShouldClose(window);
}

export function requestClose(window) {
  return jayessWindowRequestClose(window);
}

export function pollEvents(window) {
  return jayessWindowPollEvents(window);
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

export function present(window, canvas) {
  return jayessWindowPresent(window, canvas);
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
