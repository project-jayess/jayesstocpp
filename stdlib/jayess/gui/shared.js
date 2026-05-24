import { rgb, rgba } from "jayess:color";

export function fail(message) {
  throw message;
}

export function optionValue(options, key, fallback) {
  if (options === null) {
    return fallback;
  }
  var value = options[key];
  if (value === null) {
    return fallback;
  }
  return value;
}

export function copyChildren(children) {
  if (children === null) {
    return [];
  }
  var copied = [];
  for (var index = 0; index < children.length; index = index + 1) {
    copied.push(children[index]);
  }
  return copied;
}

export function defaultTheme() {
  return {
    windowBackground: rgb(18, 20, 24),
    panelBackground: rgba(0, 0, 0, 0),
    labelColor: rgb(238, 238, 244),
    buttonBackground: rgb(44, 50, 62),
    buttonHoverBackground: rgb(60, 78, 102),
    buttonPressedBackground: rgb(34, 112, 204),
    buttonBorder: rgb(188, 194, 208)
  };
}
