import test from "node:test";
import path from "node:path";
import { compileAndRunCppExecutable, findAvailableCompiler, writeRuntime } from "../support/compiler.js";
import { createManagedTempDir } from "../support/temp-dir.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

runtimeTest("generated runtime reports normalized handle diagnostics", (t) => {
  const targetDir = createManagedTempDir(t, "runtime-handle-diagnostics");
  const runtimeCppPath = writeRuntime(targetDir);
  const main = `#include <filesystem>
#include <iostream>
#include <stdexcept>
#include <string>
#include "runtime/jayess_runtime.hpp"

void requireMessage(const std::string& actual, const std::string& expected) {
  if (actual != expected) {
    throw std::runtime_error("expected '" + expected + "' but got '" + actual + "'");
  }
}

template <typename Fn>
void requireRuntimeError(Fn fn, const std::string& expected) {
  try {
    fn();
  } catch (const std::runtime_error& error) {
    requireMessage(error.what(), expected);
    return;
  }
  throw std::runtime_error("expected runtime_error");
}

int main() {
  requireRuntimeError([]() {
    jayess::channel_send(jayess::value(std::monostate{}), jayess::value(std::monostate{}));
  }, "Jayess channel expected a channel handle");

  auto channel = jayess::channel_create();
  jayess::channel_close(channel);
  requireRuntimeError([&]() {
    jayess::channel_send(channel, jayess::value(std::string("item")));
  }, "Jayess channel channel handle is closed");

  const auto filePath = (std::filesystem::path("${targetDir}") / "stream.txt").string();
  auto writeStream = jayess::stream_open_write(filePath);
  auto wrongDirection = jayess::stream_read_chunk_async(writeStream, 1);
  jayess::run_async_scheduler();
  try {
    jayess::await_sync(wrongDirection);
  } catch (const jayess::thrown_value& error) {
    requireMessage(std::get<std::string>(error.payload), "Jayess stream readChunk requires a read stream");
    std::cout << "ok\\n";
    return 0;
  }
  throw std::runtime_error("expected thrown_value");
}
`;

  compileAndRunCppExecutable([runtimeCppPath], path.dirname(runtimeCppPath), main);
});
