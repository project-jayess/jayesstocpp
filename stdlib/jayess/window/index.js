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
