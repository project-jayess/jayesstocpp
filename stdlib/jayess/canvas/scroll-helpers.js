import { clamp } from "./scalar-helpers.js";

export function wheelDelta(value) {
  if (value === null) {
    return 0;
  }
  return value;
}

export function clampedScrollOffset(value, maximum) {
  return clamp(value, 0, maximum);
}

export function wheelScrollOffset(current, delta, step, maximum) {
  return clampedScrollOffset(current + wheelDelta(delta) * step, maximum);
}

export function scrollbarThumbSize(viewportSize, contentSize, minimumSize) {
  if (contentSize <= 0 || contentSize <= viewportSize) {
    return viewportSize;
  }
  var size = viewportSize * viewportSize / contentSize;
  if (size < minimumSize) {
    return minimumSize;
  }
  return size;
}

export function scrollbarThumbOffset(scrollOffset, maximumScroll, trackSize, thumbSize) {
  if (maximumScroll <= 0 || trackSize <= thumbSize) {
    return 0;
  }
  return scrollOffset * (trackSize - thumbSize) / maximumScroll;
}
