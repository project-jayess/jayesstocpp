import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function runtimeAssetMain(targetDir, { header, namespace }) {
  const htmlPath = JSON.stringify(`${targetDir}/runtime-asset.html`);
  const cssPath = JSON.stringify(`${targetDir}/runtime-asset.css`);
  return `#include <filesystem>
#include <fstream>
#include <iostream>
#include <stdexcept>
#include <variant>
#include "${header}"

void require(bool condition, const char* message) {
  if (!condition) {
    throw std::runtime_error(message);
  }
}

void writeText(const std::string& path, const std::string& text) {
  std::filesystem::create_directories(std::filesystem::path(path).parent_path());
  std::ofstream stream(path, std::ios::binary);
  stream << text;
}

int main() {
  const std::string htmlPath = ${htmlPath};
  const std::string cssPath = ${cssPath};
  writeText(htmlPath, "<div id=\\"runtime\\">Runtime HTML</div>");
  writeText(cssPath, "#runtime { font-size: 18px; }");

  ${namespace}::jayess_module_init();
  auto result = ${namespace}::inspectRuntimeAssets(std::vector<jayess::value>{htmlPath, cssPath});
  const auto& items = std::get<jayess::array_ptr>(result)->items;
  require(std::get<std::string>(items[0]).find("Runtime HTML") != std::string::npos, "runtime html text");
  require(std::get<std::string>(items[1]).find("font-size") != std::string::npos, "runtime css text");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ loads canvas HTML and CSS assets at runtime", (t) => {
  transpileAndRunFixture(t, "test/fixtures/runtime/canvas-load-assets-main.js", "runtime-canvas-load-assets", runtimeAssetMain);
});
