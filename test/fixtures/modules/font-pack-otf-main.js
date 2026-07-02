import { packFont, registerFont } from "jayess:font";

export function run() {
  var font = registerFont(packFont("./fonts/probe.otf", {
    name: "packed-otf",
    family: "Probe OTF"
  }));
  return [font.sourcePath, font.sourceFormat, font.decodedFormat, font.metricsOnly];
}
