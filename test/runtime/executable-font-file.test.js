import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { compileAndRunCppExecutable, findAvailableCompiler } from "../support/compiler.js";
import { generatedEntryForFixture } from "../support/generated-executable.js";
import { createManagedTempDir } from "../support/temp-dir.js";
import { transpileFile } from "../../src/api/transpile-file.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function cppStringLiteral(value) {
  return JSON.stringify(value);
}

function mainSource({ header, namespace }, fontDir) {
  return `#include <filesystem>
#include <fstream>
#include <functional>
#include <iostream>
#include <stdexcept>
#include <string>
#include <variant>
#include <vector>
#include "${header}"

void require(bool condition, const char* message) {
  if (!condition) {
    throw std::runtime_error(message);
  }
}

void writeBytes(const std::string& path, const std::vector<unsigned char>& bytes) {
  std::ofstream stream(path, std::ios::binary);
  if (!stream) {
    throw std::runtime_error("could not write font fixture");
  }
  stream.write(reinterpret_cast<const char*>(bytes.data()), static_cast<std::streamsize>(bytes.size()));
}

std::vector<unsigned char> sfntHeader() {
  return {0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00};
}

std::vector<unsigned char> woffHeader() {
  return {
    'w', 'O', 'F', 'F',
    0x00, 0x01, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x2c,
    0x00, 0x00,
    0x00, 0x00,
    0x00, 0x00, 0x00, 0x0c,
    0x00, 0x00,
    0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00
  };
}

std::vector<unsigned char> compressedWoffHeader() {
  return {
    'w', 'O', 'F', 'F',
    0x00, 0x01, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x4f,
    0x00, 0x01,
    0x00, 0x00,
    0x00, 0x00, 0x00, 0x20,
    0x00, 0x00,
    0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x74, 0x65, 0x73, 0x74,
    0x00, 0x00, 0x00, 0x40,
    0x00, 0x00, 0x00, 0x0f,
    0x00, 0x00, 0x00, 0x04,
    0x00, 0x00, 0x00, 0x00,
    0x78, 0x01,
    0x01,
    0x04, 0x00,
    0xfb, 0xff,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00
  };
}

std::vector<unsigned char> woff2Header() {
  return {
    'w', 'O', 'F', '2',
    0x00, 0x01, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x30,
    0x00, 0x00,
    0x00, 0x00,
    0x00, 0x00, 0x00, 0x0c,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00,
    0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00
  };
}

void requireDiagnosticContains(const std::function<void()>& operation, const std::string& expected) {
  try {
    operation();
  } catch (const std::exception& error) {
    if (std::string(error.what()).find(expected) != std::string::npos) {
      return;
    }
    throw;
  }
  throw std::runtime_error("expected diagnostic was not thrown: " + expected);
}

int main() {
  try {
    const auto fontDir = std::filesystem::path(${cppStringLiteral(fontDir)});
    std::filesystem::create_directories(fontDir);
    const auto ttfPath = (fontDir / "tiny.ttf").string();
    const auto otfTrueTypePath = (fontDir / "tiny-glyf.otf").string();
    const auto woffPath = (fontDir / "tiny.woff").string();
    const auto compressedWoffPath = (fontDir / "tiny-stored.woff").string();
    const auto woff2Path = (fontDir / "tiny.woff2").string();
    const auto otfPath = (fontDir / "tiny.otf").string();
    const auto invalidSfntPath = (fontDir / "invalid-directory.ttf").string();
    const auto unsupportedPath = (fontDir / "unsupported.bin").string();
    const auto invalidWoffPath = (fontDir / "invalid.woff").string();
    const auto invalidWoff2Path = (fontDir / "invalid.woff2").string();
    const auto transformedWoff2Path = (fontDir / "transformed.woff2").string();
    const auto missingPath = (fontDir / "missing.ttf").string();

    // Minimal container signatures generated in-test; no third-party font bytes are bundled.
    writeBytes(ttfPath, sfntHeader());
    writeBytes(otfTrueTypePath, sfntHeader());
    writeBytes(woffPath, woffHeader());
    writeBytes(compressedWoffPath, compressedWoffHeader());
    writeBytes(woff2Path, woff2Header());
    writeBytes(otfPath, {'O', 'T', 'T', 'O'});
    writeBytes(invalidSfntPath, {0x00, 0x01, 0x00, 0x00});
    writeBytes(unsupportedPath, {'n', 'o', 'p', 'e'});
    auto invalidWoff = woffHeader();
    invalidWoff[11] = 0x2d;
    writeBytes(invalidWoffPath, invalidWoff);
    writeBytes(invalidWoff2Path, {'w', 'O', 'F', '2', 0x00, 0x01, 0x00, 0x00});
    auto transformedWoff2 = woff2Header();
    transformedWoff2[23] = 0x01;
    writeBytes(transformedWoff2Path, transformedWoff2);

    ${namespace}::jayess_module_init();
    auto result = ${namespace}::inspectFontFiles(std::vector<jayess::value>{ttfPath, otfTrueTypePath, woffPath, compressedWoffPath, woff2Path});
    const auto& items = std::get<jayess::array_ptr>(result)->items;
    require(std::get<std::string>(items[0]) == "vector-font", "ttf did not load as a vector font handle");
    require(std::get<std::string>(items[1]) == "ttf", "ttf source format was not detected");
    require(std::get<std::string>(items[2]) == "otf", "otf truetype source format was not detected");
    require(std::get<std::string>(items[3]) == "woff", "woff source format was not detected");
    require(std::get<std::string>(items[4]) == "woff", "compressed woff source format was not detected");
    require(std::get<std::string>(items[5]) == "woff2", "woff2 source format was not detected");
    require(std::get<std::string>(items[6]) == "tiny-woff", "woff font was not registered by name");
    require(std::get<double>(items[7]) > 0.0, "font metrics were not available");
    require(std::get<double>(items[8]) > 0.0 && std::get<double>(items[8]) < 255.0, "loaded font did not render grayscale coverage");

    requireDiagnosticContains([&]() {
      (void)${namespace}::loadUnsupportedFont(std::vector<jayess::value>{missingPath});
    }, "missing or unreadable");
    requireDiagnosticContains([&]() {
      (void)${namespace}::loadUnsupportedFont(std::vector<jayess::value>{invalidSfntPath});
    }, "sfnt table directory");
    requireDiagnosticContains([&]() {
      (void)${namespace}::loadUnsupportedFont(std::vector<jayess::value>{unsupportedPath});
    }, "format is unsupported");
    requireDiagnosticContains([&]() {
      (void)${namespace}::loadUnsupportedFont(std::vector<jayess::value>{invalidWoffPath});
    }, "WOFF compression metadata");
    requireDiagnosticContains([&]() {
      (void)${namespace}::loadUnsupportedFont(std::vector<jayess::value>{invalidWoff2Path});
    }, "WOFF2 transform data");
    requireDiagnosticContains([&]() {
      (void)${namespace}::loadUnsupportedFont(std::vector<jayess::value>{transformedWoff2Path});
    }, "decoder support");
    requireDiagnosticContains([&]() {
      (void)${namespace}::loadUnsupportedFont(std::vector<jayess::value>{otfPath});
    }, "OTF/CFF");
    requireDiagnosticContains([&]() {
      (void)${namespace}::loadUnsupportedRasterizer(std::vector<jayess::value>{ttfPath});
    }, "rasterization");

    std::cout << "ok\\n";
    return 0;
  } catch (const jayess::thrown_value& error) {
    auto payload = jayess::exception_to_value(error);
    if (std::holds_alternative<std::string>(payload)) {
      std::cerr << std::get<std::string>(payload) << "\\n";
    }
    return 2;
  } catch (const std::exception& error) {
    std::cerr << error.what() << "\\n";
    return 3;
  }
}
`;
}

runtimeTest("generated C++ loads file-backed font handles for canvas text selection", (t) => {
  const fixturePath = path.resolve("test/fixtures/runtime/font-file-main.js");
  const targetDir = createManagedTempDir(t, "runtime-font-file");
  const fontDir = path.join(targetDir, "font-fixtures");
  const result = transpileFile(fixturePath, targetDir);
  const output = compileAndRunCppExecutable(
    result.files.filter((file) => file.endsWith(".cpp")),
    targetDir,
    mainSource(generatedEntryForFixture(fixturePath), fontDir),
    "font-file-runtime"
  );

  assert.equal(output.trim(), "ok");
});
