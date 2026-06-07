import { loadFont } from "jayess:font";

export function loadNamedFont(path) {
  var font = loadFont("fixture-font", path, null);
  return font.name;
}
