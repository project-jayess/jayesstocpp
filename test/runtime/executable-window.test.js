import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function windowMain({ header, namespace }) {
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

std::string thrown_message(jayess::value (*fn)(const std::vector<jayess::value>&)) {
  try {
    fn(std::vector<jayess::value>{});
  } catch (const jayess::thrown_value& error) {
    if (std::holds_alternative<std::string>(error.value)) {
      return std::get<std::string>(error.value);
    }
    return "non-string";
  } catch (const std::exception& error) {
    return error.what();
  }
  return "not-thrown";
}

int main() {
  ${namespace}::jayess_module_init();
  auto unavailable = thrown_message(${namespace}::openWindow);
  require(unavailable.find("Jayess window host adapter is not available") != std::string::npos, "window unavailable diagnostic");
  auto invalid = thrown_message(${namespace}::invalidOptions);
  require(invalid.find("options object") != std::string::npos || invalid.find("host adapter") != std::string::npos, "window options diagnostic");

  auto manualWindow = std::make_shared<jayess::window_state>();
  manualWindow->events.push_back(jayess::make_object({
    {"type", std::string("close")}
  }));
  manualWindow->events.push_back(jayess::make_object({
    {"type", std::string("resize")},
    {"width", 320.0},
    {"height", 240.0}
  }));
  manualWindow->events.push_back(jayess::make_object({
    {"type", std::string("keyDown")},
    {"key", std::string("a")},
    {"code", std::string("KeyA")},
    {"pressed", true}
  }));
  manualWindow->events.push_back(jayess::make_object({
    {"type", std::string("keyUp")},
    {"key", std::string("Escape")},
    {"code", std::string("Escape")},
    {"pressed", false}
  }));
  manualWindow->events.push_back(jayess::make_object({
    {"type", std::string("mouseMove")},
    {"x", 12.0},
    {"y", 24.0}
  }));
  manualWindow->events.push_back(jayess::make_object({
    {"type", std::string("mouseDown")},
    {"button", std::string("left")},
    {"x", 12.0},
    {"y", 24.0},
    {"pressed", true}
  }));
  manualWindow->events.push_back(jayess::make_object({
    {"type", std::string("mouseUp")},
    {"button", std::string("left")},
    {"x", 12.0},
    {"y", 24.0},
    {"pressed", false}
  }));
  require(std::get<bool>(jayess::window_should_close(manualWindow)) == false, "window initially not closing");
  jayess::window_request_close(manualWindow);
  require(std::get<bool>(jayess::window_should_close(manualWindow)) == true, "window request close state");
  auto drained = jayess::window_poll_events(manualWindow);
  const auto& drainedItems = std::get<jayess::array_ptr>(drained)->items;
  require(drainedItems.size() == 8, "window event queue drains all event types");
  const auto closeEvent = std::get<jayess::object_ptr>(drainedItems[0]);
  require(std::get<std::string>(closeEvent->fields["type"]) == "close", "window close event type");
  const auto resizeEvent = std::get<jayess::object_ptr>(drainedItems[1]);
  require(std::get<std::string>(resizeEvent->fields["type"]) == "resize", "window resize event type");
  require(std::get<double>(resizeEvent->fields["width"]) == 320.0, "window resize width");
  const auto keyEvent = std::get<jayess::object_ptr>(drainedItems[2]);
  require(std::get<std::string>(keyEvent->fields["type"]) == "keyDown", "window key event type");
  require(std::get<std::string>(keyEvent->fields["key"]) == "a", "window key value");
  require(std::get<std::string>(keyEvent->fields["code"]) == "KeyA", "window key code");
  require(std::get<bool>(keyEvent->fields["pressed"]) == true, "window key pressed");
  const auto mouseEvent = std::get<jayess::object_ptr>(drainedItems[5]);
  require(std::get<std::string>(mouseEvent->fields["button"]) == "left", "window mouse button");
  require(std::get<bool>(mouseEvent->fields["pressed"]) == true, "window mouse pressed");
  const auto requestedCloseEvent = std::get<jayess::object_ptr>(drainedItems[7]);
  require(std::get<std::string>(requestedCloseEvent->fields["type"]) == "close", "window requested close event");
  auto secondDrain = jayess::window_poll_events(manualWindow);
  require(std::get<jayess::array_ptr>(secondDrain)->items.empty(), "window event queue is empty after drain");

  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ reports window adapter availability deterministically", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/window-main.js", "runtime-window", (_targetDir, entry) => windowMain(entry));
});
