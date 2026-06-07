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
    writeBytes((fontDir / "invalid.ttf").string(), {0x6e, 0x6f, 0x70, 0x65});
    writeBytes((fontDir / "local-system.ttf").string(), sfntHeader());

    ${namespace}::jayess_module_init();
    auto result = ${namespace}::inspectSystemFont(std::vector<jayess::value>{fontDir.string()});
    const auto& items = std::get<jayess::array_ptr>(result)->items;

    require(std::get<std::string>(items[0]) == "system-fallback", "fallback font alias was not preserved");
    require(std::get<bool>(items[1]) == true, "disabled discovery did not mark fallback");
    require(std::get<double>(items[2]) == 255.0, "fallback bitmap font did not render deterministic pixels");
    require(std::get<bool>(items[3]) == true, "invalid discovered font did not fall back");
    require(std::get<std::string>(items[4]).find("unsupported") != std::string::npos, "invalid font diagnostic was not preserved");
    require(std::get<std::string>(items[5]) == "system-local", "discovered font name was not preserved");
    require(std::get<std::string>(items[6]) == "Local System", "discovered font family was not preserved");
    require(std::get<bool>(items[7]) == true, "discovered font was not marked as system font");
    require(std::get<bool>(items[8]) == false, "local TTF discovery unexpectedly used fallback");
    require(std::get<std::string>(items[9]) == "ttf", "local TTF source format was not preserved");
    require(std::get<double>(items[10]) == 255.0, "discovered system font fallback did not render crisp bitmap coverage");

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

runtimeTest("generated C++ discovers a local system font candidate and falls back deterministically", (t) => {
  const fixturePath = path.resolve("test/fixtures/runtime/font-system-main.js");
  const targetDir = createManagedTempDir(t, "runtime-font-system");
  const fontDir = path.join(targetDir, "font-fixtures");
  const result = transpileFile(fixturePath, targetDir);
  const output = compileAndRunCppExecutable(
    result.files.filter((file) => file.endsWith(".cpp")),
    targetDir,
    mainSource(generatedEntryForFixture(fixturePath), fontDir),
    "font-system-runtime"
  );

  assert.equal(output.trim(), "ok");
});
