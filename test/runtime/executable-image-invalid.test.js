import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function imageInvalidMain(targetDir, { header, namespace }) {
  const truncatedPpm = JSON.stringify(`${targetDir.replace(/\\/g, "/")}/truncated.ppm`);
  const zeroPgm = JSON.stringify(`${targetDir.replace(/\\/g, "/")}/zero.pgm`);
  const hugePpm = JSON.stringify(`${targetDir.replace(/\\/g, "/")}/huge.ppm`);
  const invalidBmp = JSON.stringify(`${targetDir.replace(/\\/g, "/")}/invalid.bmp`);
  const truncatedTga = JSON.stringify(`${targetDir.replace(/\\/g, "/")}/truncated.tga`);
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

std::string thrown_message(jayess::value (*fn)(const std::vector<jayess::value>&), const std::string& arg) {
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

std::string thrown_message0(jayess::value (*fn)(const std::vector<jayess::value>&)) {
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

void writeText(const std::string& path, const std::string& text) {
  std::ofstream output(path, std::ios::binary);
  output << text;
}

void writeInvalidBmp(const std::string& path) {
  std::ofstream output(path, std::ios::binary);
  const unsigned char bytes[] = {
    0x42, 0x4d,
    0x3a, 0x00, 0x00, 0x00,
    0x00, 0x00,
    0x00, 0x00,
    0x36, 0x00, 0x00, 0x00,
    0x28, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x00, 0x00,
    0x01, 0x00,
    0x20, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x04, 0x00, 0x00, 0x00,
    0x13, 0x0b, 0x00, 0x00,
    0x13, 0x0b, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00
  };
  output.write(reinterpret_cast<const char*>(bytes), sizeof(bytes));
}

void writeTruncatedTga(const std::string& path) {
  std::ofstream output(path, std::ios::binary);
  const unsigned char bytes[] = {0x00, 0x00};
  output.write(reinterpret_cast<const char*>(bytes), sizeof(bytes));
}

int main() {
  const std::string truncatedPpm = ${truncatedPpm};
  const std::string zeroPgm = ${zeroPgm};
  const std::string hugePpm = ${hugePpm};
  const std::string invalidBmp = ${invalidBmp};
  const std::string truncatedTga = ${truncatedTga};

  writeText(truncatedPpm, "P3\\n");
  writeText(zeroPgm, "P2\\n0 1\\n255\\n0\\n");
  writeText(hugePpm, "P3\\n2147483647 2147483647\\n255\\n");
  writeInvalidBmp(invalidBmp);
  writeTruncatedTga(truncatedTga);

  ${namespace}::jayess_module_init();

  const auto ppmError = thrown_message(${namespace}::loadPpmFile, truncatedPpm);
  require(ppmError.find("unsupported width") != std::string::npos || ppmError.find("unsupported PPM content") != std::string::npos, "ppm malformed diagnostic");

  const auto pgmError = thrown_message(${namespace}::loadPgmFile, zeroPgm);
  require(pgmError.find("unsupported content") != std::string::npos, "pgm dimension diagnostic");

  const auto hugeError = thrown_message(${namespace}::loadPpmFile, hugePpm);
  require(hugeError.find("unsupported image dimensions") != std::string::npos, "ppm overflow diagnostic");

  const auto bmpError = thrown_message(${namespace}::loadBmpFile, invalidBmp);
  require(bmpError.find("uncompressed 24-bit BMP") != std::string::npos, "bmp bit depth diagnostic");

  const auto tgaError = thrown_message(${namespace}::loadTgaFile, truncatedTga);
  require(tgaError.find("unsupported TGA header") != std::string::npos, "tga truncated header diagnostic");

  const auto createHugeError = thrown_message0(${namespace}::createHugeImage);
  require(createHugeError.find("dimensions exceed supported size") != std::string::npos, "create huge diagnostic");

  const auto resizeHugeError = thrown_message0(${namespace}::resizeHugeImage);
  require(resizeHugeError.find("dimensions exceed supported size") != std::string::npos, "resize huge diagnostic");

  const auto blitHugeError = thrown_message0(${namespace}::blitHugeOffset);
  require(blitHugeError.find("within supported range") != std::string::npos, "blit huge offset diagnostic");

  const auto transparentHugeError = thrown_message0(${namespace}::transparentBlitHugeOffset);
  require(transparentHugeError.find("within supported range") != std::string::npos, "transparent blit huge offset diagnostic");

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ rejects malformed image files with focused diagnostics", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/image-invalid-main.js", "runtime-image-invalid", imageInvalidMain);
});
