import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function windowFrameMain({ header, namespace }) {
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

int main() {
  ${namespace}::jayess_module_init();

  auto activeWindow = std::make_shared<jayess::window_state>();
  activeWindow->events.push_back(jayess::make_object({
    {"type", std::string("resize")},
    {"width", 320.0},
    {"height", 240.0}
  }));
  auto scheduled = jayess::await_sync(${namespace}::scheduleFrame(std::vector<jayess::value>{activeWindow}));
  const auto& scheduledItems = std::get<jayess::array_ptr>(scheduled)->items;
  require(std::get<bool>(scheduledItems[0]) == false, "frame helper preserves explicit shouldClose state");
  require(std::get<double>(scheduledItems[1]) == 1.0, "frame helper leaves pollEvents explicit");
  require(std::get<std::string>(scheduledItems[2]) == "frame", "frame helper forwards callback args");

  auto closingWindow = std::make_shared<jayess::window_state>();
  closingWindow->close_requested = true;
  auto skipped = jayess::await_sync(${namespace}::scheduleFrame(std::vector<jayess::value>{closingWindow}));
  require(std::holds_alternative<std::monostate>(skipped), "frame helper skips callback once close is requested");

  auto cancelledWindow = std::make_shared<jayess::window_state>();
  auto cancelled = jayess::await_sync(${namespace}::cancelScheduledFrame(std::vector<jayess::value>{cancelledWindow}));
  require(std::holds_alternative<std::monostate>(cancelled), "cancelFrame resolves cancelled frame handle to null");

  auto runWindow = std::make_shared<jayess::window_state>();
  runWindow->events.push_back(jayess::make_object({
    {"type", std::string("mouseMove")},
    {"x", 12.0},
    {"y", 18.0}
  }));
  auto runResult = jayess::await_sync(${namespace}::scheduleRunFrame(std::vector<jayess::value>{runWindow}));
  const auto& runItems = std::get<jayess::array_ptr>(runResult)->items;
  require(std::get<std::string>(runItems[0]) == "loop!", "runFrame forwards state and args");
  require(std::get<double>(runItems[1]) == 1.0, "runFrame callback mutates state");
  require(std::get<double>(runItems[2]) == 1.0, "runFrame leaves pollEvents explicit");

  auto runClosedWindow = std::make_shared<jayess::window_state>();
  runClosedWindow->close_requested = true;
  auto skippedRecord = ${namespace}::skipRunFrame(std::vector<jayess::value>{runClosedWindow});
  const auto& skippedFields = std::get<jayess::object_ptr>(skippedRecord)->fields;
  require(std::get<bool>(skippedFields.at("scheduled")) == false, "runFrame reports skipped close state");
  require(std::holds_alternative<std::monostate>(skippedFields.at("done")), "runFrame skipped done is null");

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ runs jayess:window frame helper scheduling over jayess:timers", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/window-frame-main.js", "runtime-window-frame", (_targetDir, entry) => windowFrameMain(entry));
});
