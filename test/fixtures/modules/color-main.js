import {
  darken,
  lighten,
  mix,
  parse,
  rgb,
  rgba,
  toHex,
  withAlpha
} from "jayess:color";

export function run() {
  var red = rgb(255, 0, 0);
  var shortHex = parse("#0f8");
  var longHex = parse("#336699");
  var functional = parse("rgb(12, 34, 56)");
  var alpha = parse("rgba(12, 34, 56, 0.5)");
  var faded = withAlpha(red, 0.25);
  var mixed = mix(red, rgb(0, 0, 255), 0.5);
  var light = lighten(rgb(0, 0, 0), 0.5);
  var dark = darken(rgba(255, 255, 255, 0.75), 0.5);

  return [
    toHex(red),
    shortHex.red,
    shortHex.green,
    shortHex.blue,
    toHex(longHex),
    toHex(functional),
    alpha.alpha,
    faded.alpha,
    toHex(mixed),
    toHex(light),
    toHex(dark),
    dark.alpha
  ];
}

export function invalidChannel() {
  return rgb(300, 0, 0);
}

export function invalidAlpha() {
  return rgba(0, 0, 0, 2);
}

export function invalidParse() {
  return parse("not-a-color");
}

export function invalidMixAmount() {
  return mix(rgb(0, 0, 0), rgb(255, 255, 255), 2);
}
