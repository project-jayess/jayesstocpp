import { systemDefaultFont } from "jayess:font";

export function inspectSystemFontFallback() {
  var font = systemDefaultFont({ disabled: true });
  return font.name;
}
