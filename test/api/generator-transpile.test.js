import test from "node:test";
import assert from "node:assert/strict";
import { transpile } from "../../src/api/transpile.js";

test("transpile emits generator declarations through Jayess generator handles and state slots", () => {
  const cpp = transpile("function* run(value) { yield value; return value; }", { moduleName: "generator_case" });
  assert.match(cpp, /jayess::value jayess_generator = jayess::make_generator_handle\(\);/);
  assert.match(cpp, /jayess::generator_set_resume\(jayess_generator,/);
  assert.match(cpp, /switch \(jayess::generator_next_state\(jayess_generator\)\)/);
  assert.match(cpp, /jayess::generator_yield\(jayess_generator, 1, value\);/);
  assert.match(cpp, /case 1:/);
  assert.match(cpp, /jayess::generator_complete\(jayess_generator, value\);/);
});

test("transpile lowers selected generator expression-yield forms", () => {
  const cpp = transpile(
    "function* run(value, use, target) { var sum = 1 + (yield value); use(yield sum); target.value = yield sum; return yield target.value; }",
    { moduleName: "generator_expression_yield_case" }
  );

  assert.match(cpp, /jayess::generator_yield\(jayess_generator, [0-9]+, value\);/);
  assert.match(cpp, /jayess_yield_expr_[0-9]+ = jayess::generator_take_sent\(jayess_generator\);/);
  assert.match(cpp, /sum = jayess::add\(jayess_yield_expr_[0-9]+, jayess_yield_expr_[0-9]+\);/);
  assert.match(cpp, /jayess::call\(jayess_yield_expr_[0-9]+, jayess_yield_expr_[0-9]+\);/);
  assert.match(cpp, /jayess::set_property\(jayess_yield_expr_[0-9]+, "value", jayess_yield_expr_[0-9]+\);/);
  assert.match(cpp, /jayess::generator_complete\(jayess_generator, jayess::generator_take_sent\(jayess_generator\)\);/);
});

test("transpile lowers generator short-circuit expression-yield forms", () => {
  const cpp = transpile(
    "function* run(left, right) { var a = left && (yield right); var b = left || (yield right); return left ?? (yield right); }",
    { moduleName: "generator_short_circuit_yield_case" }
  );

  assert.match(cpp, /if \(!jayess::truthy\(jayess_yield_expr_\d+\)\) \{/);
  assert.match(cpp, /if \(jayess::truthy\(jayess_yield_expr_\d+\)\) \{/);
  assert.match(cpp, /if \(!jayess::is_null\(jayess_yield_expr_\d+\)\) \{/);
  assert.match(cpp, /jayess::generator_yield\(jayess_generator, \d+, right\);/);
  assert.match(cpp, /jayess_yield_expr_\d+ = jayess::generator_take_sent\(jayess_generator\);/);
});

test("transpile lowers generator array, object, and conditional expression-yield forms", () => {
  const cpp = transpile(
    "function* run(flag, first, second) { var items = [yield first, flag ? (yield second) : first]; var record = { first: yield first, second: items }; return flag ? record : items; }",
    { moduleName: "generator_composite_expression_yield_case" }
  );

  assert.match(cpp, /jayess::make_array\(\{jayess_yield_expr_\d+, jayess_yield_expr_\d+\}\)/);
  assert.match(cpp, /jayess::make_object\(\{\{"first", jayess_yield_expr_\d+\}, \{"second", jayess_yield_expr_\d+\}\}\)/);
  assert.match(cpp, /if \(jayess::truthy\(jayess_yield_expr_\d+\)\) \{/);
  assert.match(cpp, /jayess::generator_yield\(jayess_generator, \d+, first\);/);
  assert.match(cpp, /jayess::generator_yield\(jayess_generator, \d+, second\);/);
});

test("transpile emits generator class methods through Jayess generator handles", () => {
  const cpp = transpile("class Worker { *items(value) { yield value; return value; } }", { moduleName: "generator_method_case" });

  assert.match(cpp, /jayess::define_class_method\(class_value, "items", jayess::make_callable/);
  assert.match(cpp, /jayess::value this_value = jayess::argument_at\(jayess_args, 0\);/);
  assert.match(cpp, /jayess::value jayess_generator = jayess::make_generator_handle\(\);/);
  assert.match(cpp, /jayess::value value = jayess::argument_at\(jayess_args, 1\);/);
  assert.match(cpp, /jayess::generator_yield\(jayess_generator, 1, value\);/);
  assert.match(cpp, /jayess::generator_complete\(jayess_generator, value\);/);
});

test("transpile emits generator function expressions through the shared generator handle path", () => {
  const cpp = transpile("function build(step) { var make = function* named(value) { yield value; return step; }; return make; }", { moduleName: "generator_expression_case" });
  assert.match(cpp, /jayess::make_callable\(\[step\]\(const std::vector<jayess::value>& jayess_args\) -> jayess::value \{/);
  assert.match(cpp, /jayess::value jayess_generator = jayess::make_generator_handle\(\);/);
  assert.match(cpp, /jayess::generator_set_resume\(jayess_generator,/);
  assert.match(cpp, /jayess::generator_yield\(jayess_generator, 1, value\);/);
  assert.match(cpp, /jayess::generator_complete\(jayess_generator, step\);/);
});

test("transpile emits generator yields inside nested control flow", () => {
  const cpp = transpile(
    "function* run(flag, items) { if (flag) { yield items[0]; } else { yield items[1]; } var index = 0; while (index < 2) { yield index; index = index + 1; } for (var step = 0; step < 2; step = step + 1) { yield step; } }",
    { moduleName: "generator_control_flow_case" }
  );

  assert.match(cpp, /if \(jayess::truthy\(flag\)\) \{/);
  assert.match(cpp, /else \{/);
  assert.match(cpp, /while \(jayess::truthy\(jayess::less_than\(index, jayess::value\(static_cast<double>\(2\)\)\)\)\) \{/);
  assert.match(cpp, /while \(jayess::truthy\(jayess::less_than\(step, jayess::value\(static_cast<double>\(2\)\)\)\)\) \{/);
  assert.match(cpp, /jayess::generator_yield\(jayess_generator, \d+, jayess::get_index\(items, jayess::value\(static_cast<double>\(0\)\)\)\);/);
});

test("transpile emits expanded generator statement yield positions", () => {
  const cpp = transpile("function* run(value) { do { yield value; } while (false); switch (value) { case 1: yield value; break; default: yield 0; } try { value = value + 1; yield value; } catch (error) { return error; } return value; }", {
    moduleName: "generator_expanded_statement_case"
  });

  assert.match(cpp, /do \{/);
  assert.match(cpp, /while \(jayess::truthy\(jayess::value\(false\)\)\);/);
  assert.match(cpp, /jayess_yield_expr_\d+ = value;/);
  assert.match(cpp, /goto jayess_generator_switch_end_\d+;/);
  assert.match(cpp, /try \{/);
  assert.match(cpp, /\(value = jayess::add\(value, jayess::value\(static_cast<double>\(1\)\)\)\);/);
  assert.match(cpp, /catch \(const jayess::thrown_value& jayess_error\)/);
  assert.match(cpp, /jayess::generator_yield\(jayess_generator, \d+, value\);/);
});

test("transpile emits generator try/catch with multiple direct try-body yields", () => {
  const cpp = transpile("function* run(value) { try { value = value + 1; yield value; value = value + 2; yield value; value = value + 3; } catch (error) { return error; } return value; }", {
    moduleName: "generator_multi_try_catch_case"
  });

  assert.match(cpp, /try \{/);
  assert.match(cpp, /\(value = jayess::add\(value, jayess::value\(static_cast<double>\(1\)\)\)\);/);
  assert.match(cpp, /\(value = jayess::add\(value, jayess::value\(static_cast<double>\(2\)\)\)\);/);
  assert.match(cpp, /\(value = jayess::add\(value, jayess::value\(static_cast<double>\(3\)\)\)\);/);
  assert.match(cpp, /catch \(const jayess::thrown_value& jayess_error\)/);
  assert.match(cpp, /goto jayess_generator_try_end_\d+;/);
  assert.equal((cpp.match(/jayess::generator_yield\(jayess_generator, \d+, value\);/g) ?? []).length, 2);

  const firstSetupIndex = cpp.indexOf("(value = jayess::add(value, jayess::value(static_cast<double>(1))));");
  const firstYieldIndex = cpp.indexOf("jayess::generator_yield", firstSetupIndex);
  const firstResumeIndex = cpp.indexOf("case ", firstYieldIndex);
  const secondSetupIndex = cpp.indexOf("(value = jayess::add(value, jayess::value(static_cast<double>(2))));", firstResumeIndex);
  const secondYieldIndex = cpp.indexOf("jayess::generator_yield", secondSetupIndex);
  const secondResumeIndex = cpp.indexOf("case ", secondYieldIndex);
  const tailIndex = cpp.indexOf("(value = jayess::add(value, jayess::value(static_cast<double>(3))));", secondResumeIndex);
  assert.ok(firstSetupIndex < firstYieldIndex);
  assert.ok(firstYieldIndex < firstResumeIndex);
  assert.ok(firstResumeIndex < secondSetupIndex);
  assert.ok(secondSetupIndex < secondYieldIndex);
  assert.ok(secondYieldIndex < secondResumeIndex);
  assert.ok(secondResumeIndex < tailIndex);
});

test("transpile emits focused generator try/finally yield positions", () => {
  const cpp = transpile("function* run(value) { try { value = value + 1; yield value; value = value + 2; yield value; value = value + 3; } finally { value = value + 4; } return value; }", {
    moduleName: "generator_try_finally_case"
  });

  assert.match(cpp, /\(value = jayess::add\(value, jayess::value\(static_cast<double>\(1\)\)\)\);/);
  assert.equal((cpp.match(/jayess::generator_yield\(jayess_generator, \d+, value\);/g) ?? []).length, 2);
  assert.match(cpp, /\(value = jayess::add\(value, jayess::value\(static_cast<double>\(2\)\)\)\);/);
  assert.match(cpp, /\(value = jayess::add\(value, jayess::value\(static_cast<double>\(3\)\)\)\);/);
  assert.match(cpp, /\(value = jayess::add\(value, jayess::value\(static_cast<double>\(4\)\)\)\);/);
  assert.match(cpp, /jayess::generator_complete\(jayess_generator, value\);/);

  const beforeYieldIndex = cpp.indexOf("(value = jayess::add(value, jayess::value(static_cast<double>(1))));");
  const yieldIndex = cpp.indexOf("jayess::generator_yield");
  const resumeIndex = cpp.indexOf("case ", yieldIndex);
  const afterResumeIndex = cpp.indexOf("(value = jayess::add(value, jayess::value(static_cast<double>(2))));");
  const secondYieldIndex = cpp.indexOf("jayess::generator_yield", afterResumeIndex);
  const secondResumeIndex = cpp.indexOf("case ", secondYieldIndex);
  const tailIndex = cpp.indexOf("(value = jayess::add(value, jayess::value(static_cast<double>(3))));", secondResumeIndex);
  const finalizerIndex = cpp.indexOf("(value = jayess::add(value, jayess::value(static_cast<double>(4))));");
  assert.ok(beforeYieldIndex < yieldIndex);
  assert.ok(yieldIndex < resumeIndex);
  assert.ok(resumeIndex < afterResumeIndex);
  assert.ok(afterResumeIndex < secondYieldIndex);
  assert.ok(secondYieldIndex < secondResumeIndex);
  assert.ok(secondResumeIndex < tailIndex);
  assert.ok(tailIndex < finalizerIndex);
});

test("transpile emits focused generator catch-body yield positions", () => {
  const cpp = transpile("function* run(value) { try { if (value) { throw value; } } catch (error) { value = error; yield value; value = value + 1; } return value; }", {
    moduleName: "generator_catch_yield_case"
  });

  assert.match(cpp, /try \{/);
  assert.match(cpp, /catch \(const jayess::thrown_value& jayess_error\)/);
  assert.match(cpp, /error = jayess::exception_to_value\(jayess_error\);/);
  assert.match(cpp, /\(value = error\);/);
  assert.match(cpp, /jayess::generator_yield\(jayess_generator, \d+, value\);/);
  assert.match(cpp, /case \d+:;/);
  assert.match(cpp, /\(value = jayess::add\(value, jayess::value\(static_cast<double>\(1\)\)\)\);/);

  const catchIndex = cpp.indexOf("catch (const jayess::thrown_value& jayess_error)");
  const bindingIndex = cpp.indexOf("error = jayess::exception_to_value(jayess_error);", catchIndex);
  const yieldIndex = cpp.indexOf("jayess::generator_yield", bindingIndex);
  const resumeIndex = cpp.indexOf("case ", yieldIndex);
  const afterResumeIndex = cpp.indexOf("(value = jayess::add(value, jayess::value(static_cast<double>(1))));", resumeIndex);
  assert.ok(catchIndex < bindingIndex);
  assert.ok(bindingIndex < yieldIndex);
  assert.ok(yieldIndex < resumeIndex);
  assert.ok(resumeIndex < afterResumeIndex);
});

test("transpile emits generator-local destructuring through shared helpers", () => {
  const cpp = transpile("function* run(pair, record) { var [first, second] = pair; var { name } = record; yield first; yield second; return name; }", {
    moduleName: "generator_destructuring_case"
  });

  assert.match(cpp, /jayess::destructure_index\(jayess_destructure_\d+, jayess::value\(static_cast<double>\(0\)\)\);/);
  assert.match(cpp, /jayess::destructure_property\(jayess_destructure_\d+, "name"\);/);
  assert.match(cpp, /jayess::generator_complete\(jayess_generator, name\);/);
});

test("transpile emits generator-local destructuring from yield-star completion", () => {
  const cpp = transpile(
    "function* run(source) { var [first, second] = yield* source; var { value } = yield* source; yield first; yield second; return value; }",
    { moduleName: "generator_yield_star_destructuring_case" }
  );

  assert.match(cpp, /if \(jayess::generator_is_completed\(jayess_delegate_\d+\)\) \{/);
  assert.match(cpp, /else \{\s+jayess::generator_yield\(jayess_generator, \d+, jayess_delegate_\d+_value\);/);
  assert.match(cpp, /jayess::destructure_index\(jayess_destructure_\d+, jayess::value\(static_cast<double>\(0\)\)\);/);
  assert.match(cpp, /jayess::destructure_property\(jayess_destructure_\d+, "value"\);/);
  assert.match(cpp, /jayess::generator_complete\(jayess_generator, value\);/);
});

test("transpile emits generator locals in stable identifier order", () => {
  const cpp = transpile(
    "function* run(flag) { var zebra = 1; if (flag) { var alpha = 2; } var middle = 3; yield middle; return zebra; }",
    { moduleName: "generator_local_order_case" }
  );

  const alphaIndex = cpp.indexOf("jayess::value alpha = 0.0;");
  const middleIndex = cpp.indexOf("jayess::value middle = 0.0;");
  const zebraIndex = cpp.indexOf("jayess::value zebra = 0.0;");

  assert.notEqual(alphaIndex, -1);
  assert.notEqual(middleIndex, -1);
  assert.notEqual(zebraIndex, -1);
  assert.ok(alphaIndex < middleIndex);
  assert.ok(middleIndex < zebraIndex);
});
