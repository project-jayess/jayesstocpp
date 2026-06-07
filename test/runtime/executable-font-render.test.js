import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { compileAndRunCppExecutable, findAvailableCompiler } from "../support/compiler.js";
import { generatedEntryForFixture } from "../support/generated-executable.js";
import { createManagedTempDir } from "../support/temp-dir.js";
import { transpileFile } from "../../src/api/transpile-file.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function mainSource({ header, namespace }) {
  return `#include <iostream>
#include <stdexcept>
#include <variant>
#include "${header}"

void require(bool condition, const char* message) {
  if (!condition) {
    throw std::runtime_error(message);
  }
}

int main() {
  try {
    ${namespace}::jayess_module_init();
    auto defaultResult = ${namespace}::inspectDefault(std::vector<jayess::value>{});
    const auto& defaultItems = std::get<jayess::array_ptr>(defaultResult)->items;
    require(std::get<double>(defaultItems[0]) == 0.0, "default font is not old solid box at left corner");
    require(std::get<double>(defaultItems[0]) != std::get<double>(defaultItems[1]), "default font has non-solid top row");
    require(std::get<double>(defaultItems[2]) == 0.0, "default font has readable top-right gap");
    require(std::get<double>(defaultItems[3]) == 255.0, "default font draws A crossbar");

    auto fontResult = ${namespace}::inspectFonts(std::vector<jayess::value>{});
    const auto& fontItems = std::get<jayess::array_ptr>(fontResult)->items;
    require(std::get<double>(fontItems[0]) == 255.0, "registered top font draws first pixel");
    require(std::get<double>(fontItems[1]) == 0.0, "registered gap font leaves first pixel empty");
    require(std::get<double>(fontItems[2]) == 255.0, "registered top font keeps crossbar");
    require(std::get<double>(fontItems[3]) == 255.0, "registered gap font keeps crossbar");

    auto coverageResult = ${namespace}::inspectDefaultCoverage(std::vector<jayess::value>{});
    const auto& coverageItems = std::get<jayess::array_ptr>(coverageResult)->items;
    require(std::get<bool>(coverageItems[0]) == false, "default font is missing lowercase glyphs");
    require(std::get<bool>(coverageItems[1]) == false, "default font is missing at-sign glyph");
    require(std::get<bool>(coverageItems[2]) == false, "default font is missing brace glyph");
    require(std::get<bool>(coverageItems[3]) == false, "default font is missing pipe glyph");

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

runtimeTest("generated C++ renders default and registered bitmap fonts", (t) => {
  const fixturePath = path.resolve("test/fixtures/runtime/font-render-main.js");
  const targetDir = createManagedTempDir(t, "runtime-font-render");
  const result = transpileFile(fixturePath, targetDir);
  const output = compileAndRunCppExecutable(
    result.files.filter((file) => file.endsWith(".cpp")),
    targetDir,
    mainSource(generatedEntryForFixture(fixturePath)),
    "font-render-runtime"
  );

  assert.equal(output.trim(), "ok");
});
