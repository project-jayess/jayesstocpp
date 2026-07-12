import test from "node:test";
import { findAvailableCompiler } from "../support/compiler.js";
import { transpileAndRunFixture } from "../support/generated-executable.js";

const runtimeTest = findAvailableCompiler() == null ? test.skip : test;

function runtimeUpdateMain(_targetDir, { header, namespace }) {
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
  ${namespace}::jayess_module_init();
  auto value = ${namespace}::updateSummary(std::vector<jayess::value>{});
  const auto& items = std::get<jayess::array_ptr>(value)->items;
  require(std::get<double>(items[0]) == 255.0, "initial blue fill");
  require(std::get<double>(items[1]) == 1.0, "hit topmost target");
  require(std::get<double>(items[2]) == 2.0, "hit elements count");
  require(std::get<double>(items[3]) == 1.0, "hit elements topmost first");
  require(std::get<double>(items[4]) == 1.0, "hit elements includes lower target");
  require(std::get<double>(items[5]) == 1.0, "ellipse corner is outside hit area");
  require(std::get<double>(items[6]) == 0.0, "ellipse corner returns no hits");
  require(std::get<double>(items[7]) == 255.0, "mouseover redraw");
  require(std::get<double>(items[8]) == 1.0, "mouseover event count");
  require(std::get<double>(items[9]) == 1.0, "mouseover event type");
  require(std::get<double>(items[10]) == 255.0, "mouseout redraw");
  require(std::get<double>(items[11]) == 1.0, "mouseout event count");
  require(std::get<double>(items[12]) == 1.0, "mouseout event type");
  require(std::get<double>(items[13]) == 1.0, "runtime xy mutation moves element");
  require(std::get<double>(items[14]) == 1.0, "runtime w/h mutation resizes element");
  require(std::get<double>(items[15]) > 100.0 && std::get<double>(items[15]) < 160.0, "runtime outline opacity blends");

  auto scrolledValue = ${namespace}::scrolledHoverSummary(std::vector<jayess::value>{});
  const auto& scrolled = std::get<jayess::array_ptr>(scrolledValue)->items;
  require(std::get<double>(scrolled[0]) == 1.0, "root scroll hit maps viewport to document y");
  require(std::get<double>(scrolled[1]) == 1.0, "fixed hit remains viewport relative");
  require(std::get<double>(scrolled[2]) == 1.0, "scrolled mouseover event count");
  require(std::get<double>(scrolled[3]) == 1.0, "scrolled mouseover target");
  require(std::get<double>(scrolled[4]) == 255.0, "scrolled hover redraws viewport pixel");
  require(std::get<double>(scrolled[5]) > 0.0, "root scroll uses cache present path");
  require(std::get<double>(scrolled[6]) == 2.0, "scrolled target mouseUp and click event count");
  require(std::get<double>(scrolled[7]) == 1.0, "scrolled click targets document element");
  require(std::get<double>(scrolled[8]) == 2.0, "scrolled fixed mouseUp and click event count");
  require(std::get<double>(scrolled[9]) == 1.0, "scrolled click targets fixed overlay");

  auto nestedScrollValue = ${namespace}::nestedScrollSummary(std::vector<jayess::value>{});
  const auto& nestedScroll = std::get<jayess::array_ptr>(nestedScrollValue)->items;
  require(std::get<double>(nestedScroll[0]) == 1.0, "nested scroll initial hit");
  require(std::get<double>(nestedScroll[1]) > 0.0, "nested scroll offset changed");
  require(std::get<double>(nestedScroll[2]) == 1.0, "nested scroll hit remains stable");
  require(std::get<double>(nestedScroll[4]) > 0.0, "nested scroll uses copyRect path");
  require(std::get<double>(nestedScroll[5]) == 1.0, "nested horizontal scroll initial hit");
  require(std::get<double>(nestedScroll[6]) > 0.0, "nested horizontal scroll offset changed");
  require(std::get<double>(nestedScroll[7]) == 1.0, "nested horizontal scroll hit remains stable");

  auto scrollbarDragValue = ${namespace}::scrollbarDragSummary(std::vector<jayess::value>{});
  const auto& scrollbarDrag = std::get<jayess::array_ptr>(scrollbarDragValue)->items;
  require(std::get<double>(scrollbarDrag[0]) > 0.0, "nested scrollbar drag changes offset");
  require(std::get<double>(scrollbarDrag[1]) == 1.0, "nested scrollbar drag keeps integer offset");
  require(std::get<double>(scrollbarDrag[2]) > 0.0, "root scrollbar drag changes offset");
  require(std::get<double>(scrollbarDrag[3]) == 1.0, "root scrollbar drag keeps integer offset");
  require(std::get<double>(scrollbarDrag[4]) == 1.0, "root scrollbar drag updates hit testing");
  require(std::get<double>(scrollbarDrag[5]) > 0.0, "root scrollbar drag uses cache present path");
  require(std::get<double>(scrollbarDrag[6]) == 1.0, "nested scrollbar track click emits scroll event");
  require(std::get<double>(scrollbarDrag[7]) == 1.0, "nested scrollbar track click event type");
  require(std::get<double>(scrollbarDrag[8]) == 1.0, "nested scrollbar drag emits scroll event");
  require(std::get<double>(scrollbarDrag[9]) == 1.0, "nested scrollbar drag event type");
  require(std::get<double>(scrollbarDrag[10]) == 1.0, "root scrollbar track click emits scroll event");
  require(std::get<double>(scrollbarDrag[11]) == 1.0, "root scrollbar track click event type");
  require(std::get<double>(scrollbarDrag[12]) == 1.0, "root scrollbar drag emits scroll event");
  require(std::get<double>(scrollbarDrag[13]) == 1.0, "root scrollbar drag event type");

  auto clickValue = ${namespace}::clickSummary(std::vector<jayess::value>{});
  const auto& click = std::get<jayess::array_ptr>(clickValue)->items;
  require(std::get<double>(click[0]) == 1.0, "mouseDown event count");
  require(std::get<double>(click[1]) == 1.0, "mouseDown event type");
  require(std::get<double>(click[2]) == 2.0, "mouseUp and click event count");
  require(std::get<double>(click[3]) == 1.0, "mouseUp event type");
  require(std::get<double>(click[4]) == 1.0, "click event type");
  require(std::get<double>(click[5]) == 1.0, "click event target");
  require(std::get<double>(click[6]) == 255.0, "click event redraw");
  require(std::get<double>(click[7]) == 1.0, "mismatched release emits mouseUp only");
  require(std::get<double>(click[8]) == 1.0, "mismatched release mouseUp type");
  require(std::get<double>(click[9]) == 1.0, "mismatched release resets pressed target");

  auto buttonValue = ${namespace}::buttonEventSummary(std::vector<jayess::value>{});
  const auto& button = std::get<jayess::array_ptr>(buttonValue)->items;
  require(std::get<double>(button[0]) == 246.0, "button default fill before events");
  require(std::get<double>(button[1]) < std::get<double>(button[0]), "button hover darkens");
  require(std::get<double>(button[2]) < std::get<double>(button[1]), "button press darkens more");
  require(std::get<double>(button[3]) == std::get<double>(button[1]), "button release returns to hover");
  require(std::get<double>(button[4]) == 255.0, "button user handler overrides event fill");
  require(std::get<double>(button[5]) == 0.0, "button user handler override green");

  auto dirtyButtonValue = ${namespace}::buttonDirtyRedrawSummary(std::vector<jayess::value>{});
  const auto& dirtyButton = std::get<jayess::array_ptr>(dirtyButtonValue)->items;
  require(std::get<double>(dirtyButton[0]) == std::get<double>(dirtyButton[1]), "button dirty redraw preserves nearby ellipse outline red");
  require(std::get<double>(dirtyButton[2]) == std::get<double>(dirtyButton[3]), "button dirty redraw preserves nearby ellipse outline green");
  require(std::get<double>(dirtyButton[4]) == std::get<double>(dirtyButton[5]), "button dirty redraw preserves nearby ellipse label");

  auto textSelectionValue = ${namespace}::textSelectionSummary(std::vector<jayess::value>{});
  const auto& textSelection = std::get<jayess::array_ptr>(textSelectionValue)->items;
  require(std::get<double>(textSelection[0]) > 0.0, "text select draws configured red highlight");
  require(std::get<double>(textSelection[1]) == 0.0, "text select starts without green highlight");
  require(std::get<double>(textSelection[2]) == 0.0, "runtime text select clears previous red highlight");
  require(std::get<double>(textSelection[3]) > 0.0, "runtime text select draws configured green highlight");
  require(std::get<double>(textSelection[4]) == 0.0, "runtime text select none clears highlight");

  auto mouseTextSelectionValue = ${namespace}::mouseTextSelectionSummary(std::vector<jayess::value>{});
  const auto& mouseTextSelection = std::get<jayess::array_ptr>(mouseTextSelectionValue)->items;
  require(std::get<double>(mouseTextSelection[0]) == 1.0, "mouse text select starts with textselect event");
  require(std::get<double>(mouseTextSelection[1]) == 1.0, "mouse text select mousedown event type");
  require(std::get<double>(mouseTextSelection[2]) == 1.0, "mouse text select drag emits event");
  require(std::get<double>(mouseTextSelection[3]) == 1.0, "mouse text select drag event type");
  require(std::get<double>(mouseTextSelection[4]) == 1.0, "mouse text select exposes selected text");
  require(std::get<double>(mouseTextSelection[5]) > 0.0, "mouse text select draws configured highlight");
  require(std::get<double>(mouseTextSelection[6]) == 1.0, "mouse text select mouseup emits event");
  require(std::get<double>(mouseTextSelection[7]) == 1.0, "mouse text select mouseup event type");
  require(std::get<double>(mouseTextSelection[8]) == 1.0, "mouse text select clears on left mousedown");
  require(std::get<double>(mouseTextSelection[9]) == 1.0, "mouse text select clear event type");
  require(std::get<double>(mouseTextSelection[10]) == 0.0, "mouse text select clear removes selected text");
  require(std::get<double>(mouseTextSelection[11]) == 0.0, "mouse text select clear removes highlight");
  std::cout << "ok\\n";
  return 0;
}
`;
}

runtimeTest("generated C++ mutates canvas XML scene attributes at runtime", (t) => {
  transpileAndRunFixture(t, "test/fixtures/modules/canvas-runtime-update-main.js", "runtime-canvas-runtime-update", runtimeUpdateMain);
});
