import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { compileAndRunCppExecutable, findAvailableCompiler } from "../support/compiler.js";
import { createManagedTempDir } from "../support/temp-dir.js";
import { generatedEntryForFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function windowWaylandMain({ header, namespace }) {
  return `#include <cstdlib>
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

int main() {
  ${namespace}::jayess_module_init();

#if defined(_WIN32) || defined(__APPLE__)
  std::cout << "skip:wayland-unavailable\\n";
  return 0;
#else
  const auto* displayName = std::getenv("WAYLAND_DISPLAY");
  if (displayName == nullptr || displayName[0] == '\\0') {
    std::cout << "skip:wayland-unavailable\\n";
    return 0;
  }

  auto unavailable = thrown_message(${namespace}::createWindow);
  if (unavailable.find("Jayess window host adapter is not available") != std::string::npos) {
    std::cout << "skip:wayland-unavailable\\n";
    return 0;
  }

  try {
    auto windowValue = ${namespace}::createWindow(std::vector<jayess::value>{});
    auto window = std::get<jayess::window_ptr>(windowValue);
    require(window->adapter == "linux-wayland", "window uses linux-wayland adapter");

    auto shown = ${namespace}::showWindow(std::vector<jayess::value>{windowValue});
    const auto& shownItems = std::get<jayess::array_ptr>(shown)->items;
    require(std::get<double>(shownItems[0]) == 96.0, "window width after show");
    require(std::get<double>(shownItems[1]) == 64.0, "window height after show");
    require(std::get<bool>(shownItems[2]) == false, "window initially open");

    auto drained = ${namespace}::pollWindow(std::vector<jayess::value>{windowValue});
    require(std::holds_alternative<jayess::array_ptr>(drained), "wayland pollEvents result shape");

    auto presented = ${namespace}::presentWindow(std::vector<jayess::value>{windowValue});
    require(std::get<bool>(presented) == true, "wayland present call");
    require(window->presented_width == 8, "wayland recorded presented width");
    require(window->presented_height == 6, "wayland recorded presented height");

    auto renamed = ${namespace}::renameWindow(std::vector<jayess::value>{windowValue, std::string("Updated Wayland")});
    require(std::get<bool>(renamed) == true, "wayland setTitle call");

    auto shouldClose = ${namespace}::isClosing(std::vector<jayess::value>{windowValue});
    require(std::get<bool>(shouldClose) == false, "wayland shouldClose before close");

    auto closeResult = ${namespace}::closeWindow(std::vector<jayess::value>{windowValue});
    require(std::holds_alternative<std::monostate>(closeResult), "wayland close returns null");
    require(window->closed == true, "wayland close marks closed");

    auto closeEvents = jayess::window_poll_events(window);
    require(std::holds_alternative<jayess::array_ptr>(closeEvents), "wayland close drains event array");

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
#endif
}
`;
}

runtimeTest("generated C++ verifies current Wayland window lifecycle and software-buffer presentation when the host adapter is available", (t) => {
  const fixturePath = path.resolve("test/fixtures/runtime/window-wayland-main.js");
  const targetDir = createManagedTempDir(t, "runtime-window-wayland");
  const result = transpileFile(fixturePath, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));
  const output = compileAndRunCppExecutable(
    cppFiles,
    targetDir,
    windowWaylandMain(generatedEntryForFixture(fixturePath))
  );

  if (output.trim() === "skip:wayland-unavailable") {
    t.skip("Wayland window adapter or compositor is unavailable on this host");
    return;
  }

  assert.equal(output.trim(), "ok");
});
