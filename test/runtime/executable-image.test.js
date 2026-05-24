import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function imageMain(targetDir, { header, namespace }) {
  const ppmPath = JSON.stringify(`${targetDir.replace(/\\/g, "/")}/image-output.ppm`);
  const bmpPath = JSON.stringify(`${targetDir.replace(/\\/g, "/")}/image-output.bmp`);
  const pgmPath = JSON.stringify(`${targetDir.replace(/\\/g, "/")}/image-output.pgm`);
  const tgaPath = JSON.stringify(`${targetDir.replace(/\\/g, "/")}/image-output.tga`);
  const unsupportedPath = JSON.stringify(`${targetDir.replace(/\\/g, "/")}/image-output.txt`);
  return `#include <fstream>
#include <iostream>
#include <stdexcept>
#include <string>
#include <variant>
#include "${header}"

void require(bool condition, const char* message) {
  if (!condition) {
    throw std::runtime_error(message);
  }
}

std::string readFile(const std::string& path) {
  std::ifstream input(path, std::ios::binary);
  return std::string(std::istreambuf_iterator<char>(input), std::istreambuf_iterator<char>());
}

std::string thrown_message(jayess::value (*fn)(const std::vector<jayess::value>&)) {
  try {
    fn(std::vector<jayess::value>{});
  } catch (const jayess::thrown_value& error) {
    auto payload = jayess::exception_to_value(error);
    if (std::holds_alternative<std::string>(payload)) {
      return std::get<std::string>(payload);
    }
    return "non-string";
  } catch (const std::exception& error) {
    return error.what();
  }
  return "not-thrown";
}

std::string thrown_message_with_string(jayess::value (*fn)(const std::vector<jayess::value>&), const std::string& arg) {
  try {
    fn(std::vector<jayess::value>{arg});
  } catch (const jayess::thrown_value& error) {
    auto payload = jayess::exception_to_value(error);
    if (std::holds_alternative<std::string>(payload)) {
      return std::get<std::string>(payload);
    }
    return "non-string";
  } catch (const std::exception& error) {
    return error.what();
  }
  return "not-thrown";
}

int main() {
  const std::string ppmPath = ${ppmPath};
  const std::string bmpPath = ${bmpPath};
  const std::string pgmPath = ${pgmPath};
  const std::string tgaPath = ${tgaPath};
  const std::string unsupportedPath = ${unsupportedPath};
  {
    std::ofstream output(unsupportedPath, std::ios::binary);
    output << "not an image";
  }
  ${namespace}::jayess_module_init();
  auto result = ${namespace}::run(std::vector<jayess::value>{ppmPath, bmpPath, pgmPath, tgaPath});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(std::get<double>(items[0]) == 3.0, "width");
  require(std::get<double>(items[1]) == 2.0, "height");
  require(std::get<double>(items[2]) == 255.0, "pixel red");
  require(std::get<double>(items[3]) == 0.0, "pixel green");
  require(std::get<double>(items[4]) == 0.0, "pixel blue");
  require(std::get<bool>(items[5]) == true, "isImage");
  require(std::get<double>(items[6]) == 2.0, "crop width");
  require(std::get<double>(items[7]) == 2.0, "resize height");
  require(std::get<double>(items[8]) == 255.0, "crop red");
  require(std::get<double>(items[9]) == 255.0, "resize blue");
  require(std::get<double>(items[10]) == 255.0, "blit blue");
  require(std::get<bool>(items[11]) == true, "bmp isImage");
  require(std::get<double>(items[12]) == 255.0, "bmp load blue");
  require(std::get<double>(items[13]) == 255.0, "flip horizontal blue");
  require(std::get<double>(items[14]) == 255.0, "flip vertical blue");
  require(std::get<double>(items[15]) == 2.0, "rotate width");
  require(std::get<double>(items[16]) == 3.0, "rotate height");
  require(std::get<double>(items[17]) == 255.0, "rotate blue");
  require(std::get<double>(items[18]) == 128.0, "transparent blit red");
  require(std::get<double>(items[19]) == 127.0, "transparent blit blue");
  require(std::get<double>(items[20]) == 3.0, "ppm metadata width");
  require(std::get<double>(items[21]) == 2.0, "bmp metadata height");
  require(std::get<std::string>(items[22]) == "pgm", "pgm metadata format");
  require(std::get<std::string>(items[23]) == "tga", "tga metadata format");
  require(std::get<double>(items[24]) == 85.0, "pgm grayscale red");
  require(std::get<double>(items[25]) == 255.0, "tga load blue");
  require(std::get<double>(items[26]) > 0.0, "encoded ppm bytes");
  require(std::get<double>(items[27]) == 255.0, "decoded ppm blue");

  const auto ppm = readFile(ppmPath);
  require(ppm == "P3\\n3 2\\n255\\n0 0 0\\n255 0 0\\n0 0 0\\n0 0 0\\n0 0 0\\n0 0 255\\n", "ppm content");

  const auto bmp = readFile(bmpPath);
  require(bmp.size() == 78, "bmp file size");
  require(bmp[0] == 'B' && bmp[1] == 'M', "bmp signature");
  const auto pgm = readFile(pgmPath);
  require(pgm == "P2\\n3 2\\n255\\n0\\n85\\n0\\n0\\n0\\n85\\n", "pgm content");
  const auto tga = readFile(tgaPath);
  require(tga.size() == 36, "tga file size");
  require(static_cast<unsigned char>(tga[2]) == 2, "tga image type");

  auto cropError = thrown_message(${namespace}::invalidCrop);
  require(cropError.find("crop rectangle") != std::string::npos, "crop diagnostic");
  auto pathError = thrown_message(${namespace}::invalidLoadPath);
  require(pathError.find("path must be a string") != std::string::npos, "load path diagnostic");
  auto bmpPathError = thrown_message(${namespace}::invalidLoadBmpPath);
  require(bmpPathError.find("path must be a string") != std::string::npos, "load bmp path diagnostic");
  auto metadataThrown = thrown_message_with_string(${namespace}::invalidMetadataFormat, unsupportedPath);
  require(metadataThrown.find("metadataFromFile supports") != std::string::npos, "metadata format diagnostic");
  auto decodeError = thrown_message(${namespace}::invalidDecodePpm);
  require(decodeError.find("decodePpm expects bytes") != std::string::npos, "decode ppm diagnostic");

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs image buffer operations and writes PPM output", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/image-main.js", "runtime-image-stdlib", imageMain);
});
