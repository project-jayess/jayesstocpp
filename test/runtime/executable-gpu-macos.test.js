import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { transpileFile } from "../../src/api/transpile-file.js";
import { compileAndRunCppExecutable, findAvailableCompiler } from "../support/compiler.js";
import { createManagedTempDir } from "../support/temp-dir.js";
import { generatedEntryForFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function gpuMacosMain({ header, namespace }) {
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

template <typename Callback>
std::string thrown_runtime_message(Callback&& callback) {
  try {
    callback();
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

#if !defined(__APPLE__)
  std::cout << "skip:macos-unavailable\\n";
  return 0;
#else
  auto unavailable = thrown_runtime_message([&]() {
    jayess::gpu_create_device(jayess::make_object({{"backend", std::string("metal")}}));
  });
  if (unavailable.find("Jayess GPU backend is not available") != std::string::npos
      || unavailable.find("Jayess window host adapter is not available") != std::string::npos) {
    std::cout << "skip:macos-unavailable\\n";
    return 0;
  }

  auto deviceValue = jayess::gpu_create_device(jayess::make_object({{"backend", std::string("metal")}}));
  auto device = std::get<jayess::gpu_ptr>(deviceValue);
  require(device->backend == "metal", "metal device backend");

  auto windowValue = jayess::window_create(jayess::make_object({
    {"title", std::string("Jayess GPU Cocoa")},
    {"width", 24.0},
    {"height", 16.0}
  }));
  auto window = std::get<jayess::window_ptr>(windowValue);
  jayess::window_show(windowValue);
  require(window->adapter == "macos-cocoa", "cocoa adapter");

  auto surfaceValue = jayess::gpu_create_surface(windowValue);
  auto surface = std::get<jayess::gpu_ptr>(surfaceValue);
  require(surface->backend == "metal", "metal surface backend");

  auto pipelineValue = jayess::gpu_create_pipeline(deviceValue, jayess::make_object({}));
  auto frameValue = jayess::gpu_begin_frame(surfaceValue);
  auto frame = std::get<jayess::gpu_ptr>(frameValue);
  require(frame->backend == "metal", "metal frame backend");

  jayess::gpu_clear(frameValue, jayess::make_object({{"red", 10.0}, {"green", 20.0}, {"blue", 30.0}, {"alpha", 1.0}}));
  jayess::gpu_draw(frameValue, pipelineValue, jayess::value(std::monostate{}));
  jayess::gpu_end_frame(frameValue);

  require(window->presented_width == 24, "presented width");
  require(window->presented_height == 16, "presented height");
  require(frame->frame.commands.size() == 4, "frame command count");

  jayess::window_close(windowValue);
  std::cout << "ok\\n";
  return 0;
#endif
}
`;
}

runtimeTest("generated C++ verifies the first Cocoa GPU surface clear/draw/present path when available", (t) => {
  const fixturePath = path.resolve("test/fixtures/runtime/gpu-host-main.js");
  const targetDir = createManagedTempDir(t, "runtime-gpu-macos");
  const result = transpileFile(fixturePath, targetDir);
  const cppFiles = result.files.filter((file) => file.endsWith(".cpp"));
  const output = compileAndRunCppExecutable(
    cppFiles,
    targetDir,
    gpuMacosMain(generatedEntryForFixture(fixturePath))
  );

  if (output.trim() === "skip:macos-unavailable") {
    t.skip("Cocoa GPU surface path is unavailable on this host");
    return;
  }

  assert.equal(output.trim(), "ok");
});
