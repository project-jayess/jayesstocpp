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

int main() {
  try {
    const auto fontDir = std::filesystem::path(${cppStringLiteral(fontDir)});
    std::filesystem::create_directories(fontDir);
    const auto fontPath = (fontDir / "selection.ttf").string();
    writeBytes(fontPath, sfntHeader());

    ${namespace}::jayess_module_init();
    auto result = ${namespace}::inspectFontSelection(std::vector<jayess::value>{fontPath});
    const auto& items = std::get<jayess::array_ptr>(result)->items;
    require(std::get<std::string>(items[0]) == "Narrow File", "narrow font family was not stored");
    require(std::get<std::string>(items[1]) == "Wide File", "wide font family was not stored");
    require(std::get<double>(items[2]) < std::get<double>(items[3]), "fontFamily did not select wider metrics");
    require(std::get<double>(items[4]) == 8.0, "ascent option was not preserved");
    require(std::get<double>(items[5]) == 3.0, "descent option was not preserved");
    require(std::get<double>(items[6]) == 9.0, "glyph advance metric was not preserved");
    require(std::get<double>(items[7]) > 0.0 && std::get<double>(items[7]) < 255.0, "direct canvas text did not render vector coverage");
    require(std::get<double>(items[8]) > 0.0 && std::get<double>(items[8]) < 255.0, "HTML/CSS font-family did not render vector coverage");
    require(std::get<double>(items[9]) == 0.0, "default bitmap comparison pixel was unexpectedly filled");
    require(std::get<double>(items[10]) > 0.0 && std::get<double>(items[10]) < 255.0, "loaded vector font did not produce deterministic grayscale pixels");

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

runtimeTest("generated C++ preserves vector font metrics and canvas fontFamily selection", (t) => {
  const fixturePath = path.resolve("test/fixtures/runtime/font-selection-main.js");
  const targetDir = createManagedTempDir(t, "runtime-font-selection");
  const fontDir = path.join(targetDir, "font-fixtures");
  const result = transpileFile(fixturePath, targetDir);
  const output = compileAndRunCppExecutable(
    result.files.filter((file) => file.endsWith(".cpp")),
    targetDir,
    mainSource(generatedEntryForFixture(fixturePath), fontDir),
    "font-selection-runtime"
  );

  assert.equal(output.trim(), "ok");
});
