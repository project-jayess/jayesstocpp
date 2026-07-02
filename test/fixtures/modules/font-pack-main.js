import { packFont, registerFont, measureText } from "jayess:font";

export function run() {
  var font = registerFont(packFont("./fonts/probe.ttf", {
    name: "packed-probe",
    family: "Probe",
    charWidth: 9,
    charHeight: 14,
    advance: 10,
    lineHeight: 16
  }));
  var measured = measureText(font, "NN");
  return [font.name, font.sourcePath, font.sourceFormat, measured.width];
}
