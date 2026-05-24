import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function imageRoundtripMain(targetDir, { header, namespace }) {
  const ppmPath = JSON.stringify(`${targetDir.replace(/\\/g, "/")}/image-roundtrip.ppm`);
  const bmpPath = JSON.stringify(`${targetDir.replace(/\\/g, "/")}/image-roundtrip.bmp`);
  const pgmPath = JSON.stringify(`${targetDir.replace(/\\/g, "/")}/image-roundtrip.pgm`);
  const tgaPath = JSON.stringify(`${targetDir.replace(/\\/g, "/")}/image-roundtrip.tga`);
  return `#include <iostream>
#include <stdexcept>
#include <string>
#include <variant>
#include "${header}"

void require(bool condition, const char* message) {
  if (!condition) {
    throw std::runtime_error(message);
  }
}

int main() {
  ${namespace}::jayess_module_init();
  auto result = ${namespace}::run(std::vector<jayess::value>{${ppmPath}, ${bmpPath}, ${pgmPath}, ${tgaPath}});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(std::get<double>(items[0]) == 255.0, "ppm roundtrip red");
  require(std::get<double>(items[1]) == 255.0, "ppm roundtrip green");
  require(std::get<double>(items[2]) == 255.0, "bmp roundtrip green");
  require(std::get<double>(items[3]) == 255.0, "tga roundtrip blue");
  require(std::get<double>(items[4]) == 85.0, "pgm grayscale red");
  require(std::get<double>(items[5]) == 170.0, "pgm grayscale yellow");
  require(std::get<double>(items[6]) == 255.0, "edge crop top");
  require(std::get<double>(items[7]) == 255.0, "edge crop bottom");
  require(std::get<double>(items[8]) == 255.0, "resize edge bottom");
  require(std::get<double>(items[9]) == 255.0, "resize edge top");
  require(std::get<double>(items[10]) == 255.0, "flip horizontal edge");
  require(std::get<double>(items[11]) == 255.0, "flip vertical edge");
  require(std::get<double>(items[12]) == 255.0, "rotate top-left");
  require(std::get<double>(items[13]) == 255.0, "rotate bottom-right");
  require(std::get<double>(items[14]) == 255.0, "blit clipped visible pixel");
  require(std::get<double>(items[15]) == 10.0, "blit clipped hidden pixel");
  require(std::get<double>(items[16]) == 255.0, "transparent blit fully transparent");
  require(std::get<double>(items[17]) == 255.0, "transparent blit fully opaque");

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs image format round-trips and transform edge cases", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/image-roundtrip-main.js", "runtime-image-roundtrip", imageRoundtripMain);
});
