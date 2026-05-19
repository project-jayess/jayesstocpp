import test from "node:test";
import assert from "node:assert/strict";
import { transpile } from "../../src/api/transpile.js";
import { JayessError } from "../../src/diagnostics.js";

test("transpile returns deterministic cpp", () => {
  const source = "function add(a, b) { return a + b; }";
  const first = transpile(source, { moduleName: "sample" });
  const second = transpile(source, { moduleName: "sample" });
  assert.equal(first, second);
  assert.match(first, /jayess::add/);
});

test("transpile rejects built-in Jayess modules in string mode without explicit resolution support", () => {
  assert.throws(
    () => transpile('import { now } from "jayess:date"; function run() { return now(); }', { moduleName: "builtin_date_case" }),
    (error) => error instanceof JayessError && /transpile\(\) string mode does not resolve them by default/.test(error.diagnostics[0].message)
  );
});

test("transpile rejects flagged regex imports in string mode without explicit resolution support", () => {
  assert.throws(
    () => transpile('import { create } from "jayess:regex"; function run() { return create("hello", "i"); }', { moduleName: "builtin_regex_case" }),
    (error) => error instanceof JayessError && /transpile\(\) string mode does not resolve them by default/.test(error.diagnostics[0].message)
  );
});

test("transpile rejects built-in Jayess string modules in string mode without explicit resolution support", () => {
  assert.throws(
    () => transpile('import { trim } from "jayess:string"; function run() { return trim(" Jayess "); }', { moduleName: "builtin_string_case" }),
    (error) => error instanceof JayessError && /transpile\(\) string mode does not resolve them by default/.test(error.diagnostics[0].message)
  );
});

test("transpile rejects built-in Jayess array modules in string mode without explicit resolution support", () => {
  assert.throws(
    () => transpile('import { slice } from "jayess:array"; function run(items) { return slice(items, 0); }', { moduleName: "builtin_array_case" }),
    (error) => error instanceof JayessError && /transpile\(\) string mode does not resolve them by default/.test(error.diagnostics[0].message)
  );
});

test("transpile rejects built-in Jayess thread modules in string mode without explicit resolution support", () => {
  assert.throws(
    () => transpile('import { currentId } from "jayess:thread"; function run() { return currentId(); }', { moduleName: "builtin_thread_case" }),
    (error) => error instanceof JayessError && /transpile\(\) string mode does not resolve them by default/.test(error.diagnostics[0].message)
  );
});

test("transpile rejects built-in Jayess math modules in string mode without explicit resolution support", () => {
  assert.throws(
    () => transpile('import { sqrt } from "jayess:math"; function run() { return sqrt(9); }', { moduleName: "builtin_math_case" }),
    (error) => error instanceof JayessError && /transpile\(\) string mode does not resolve them by default/.test(error.diagnostics[0].message)
  );
});

test("transpile rejects built-in Jayess iterator modules in string mode without explicit resolution support", () => {
  assert.throws(
    () => transpile('import { next } from "jayess:iter"; function run(generator) { return next(generator); }', { moduleName: "builtin_iter_case" }),
    (error) => error instanceof JayessError && /transpile\(\) string mode does not resolve them by default/.test(error.diagnostics[0].message)
  );
});

test("transpile rejects built-in Jayess path modules in string mode without explicit resolution support", () => {
  assert.throws(
    () => transpile('import { join } from "jayess:path"; function run(root) { return join(root, "main.js"); }', { moduleName: "builtin_path_case" }),
    (error) => error instanceof JayessError && /transpile\(\) string mode does not resolve them by default/.test(error.diagnostics[0].message)
  );
});

test("transpile rejects built-in Jayess filesystem modules in string mode without explicit resolution support", () => {
  assert.throws(
    () => transpile('import { exists } from "jayess:fs"; function run(path) { return exists(path); }', { moduleName: "builtin_fs_case" }),
    (error) => error instanceof JayessError && /transpile\(\) string mode does not resolve them by default/.test(error.diagnostics[0].message)
  );
});

test("transpile rejects built-in Jayess system modules in string mode without explicit resolution support", () => {
  assert.throws(
    () => transpile('import { cwd } from "jayess:process"; function run() { return cwd(); }', { moduleName: "builtin_process_case" }),
    (error) => error instanceof JayessError && /transpile\(\) string mode does not resolve them by default/.test(error.diagnostics[0].message)
  );
});

test("transpile rejects let", () => {
  assert.throws(
    () => transpile("let x = 1;"),
    (error) => error instanceof JayessError && /does not support 'let'/.test(error.diagnostics[0].message)
  );
});

test("transpile emits runtime call helper for function invocation", () => {
  const cpp = transpile("function add(a, b) { return a + b; } add(1, 2);", { moduleName: "call_helper_case" });
  assert.match(cpp, /jayess::call\(add, jayess::value\(static_cast<double>\(1\)\), jayess::value\(static_cast<double>\(2\)\)\)/);
});

test("transpile emits composite value helpers for arrays and objects", () => {
  const cpp = transpile('var data = { name: "jayess", items: [1, 2] }; data.items[0];', { moduleName: "composite_case" });
  assert.match(cpp, /jayess::make_object/);
  assert.match(cpp, /jayess::make_array/);
  assert.match(cpp, /jayess::get_index/);
});

test("transpile emits array spread through explicit vector assembly", () => {
  const cpp = transpile("function run(prefix, items) { return [...prefix, ...items, 4]; }", { moduleName: "array_spread_case" });
  assert.match(cpp, /std::vector<jayess::value> jayess_items;/);
  assert.match(cpp, /jayess::append_spread_values\(jayess_items, prefix\);/);
  assert.match(cpp, /jayess::append_spread_values\(jayess_items, items\);/);
  assert.match(cpp, /jayess_items\.push_back\(jayess::value\(static_cast<double>\(4\)\)\);/);
});

test("transpile emits object spread through explicit field-vector assembly", () => {
  const cpp = transpile('function run(base) { return { ...base, name: "jayess" }; }', { moduleName: "object_spread_case" });
  assert.match(cpp, /std::vector<std::pair<std::string, jayess::value>> jayess_fields;/);
  assert.match(cpp, /jayess::append_object_spread_fields\(jayess_fields, base\);/);
  assert.match(cpp, /jayess_fields\.push_back\(\{"name", jayess::value\(std::string\("jayess"\)\)\}\);/);
});

test("transpile emits declaration destructuring through focused runtime helpers", () => {
  const cpp = transpile('function run(values, data) { var [left, right] = values; const { name, score: total } = data; return left + right + total; }', { moduleName: "destructure_case" });
  assert.match(cpp, /jayess_destructure_0/);
  assert.match(cpp, /jayess::destructure_index\(jayess_destructure_0, jayess::value\(static_cast<double>\(0\)\)\)/);
  assert.match(cpp, /jayess::destructure_property\(jayess_destructure_[0-9]+, "name"\)/);
  assert.match(cpp, /jayess::destructure_property\(jayess_destructure_[0-9]+, "score"\)/);
});

test("transpile emits rest bindings through focused destructuring helpers", () => {
  const cpp = transpile("function run(values, data) { var [head, ...tail] = values; const { name, ...rest } = data; return tail; }", { moduleName: "destructure_rest_case" });
  assert.match(cpp, /jayess::destructure_rest_array\(jayess_destructure_0, 1\)/);
  assert.match(cpp, /jayess::destructure_rest_object\(jayess_destructure_[0-9]+, \{"name"\}\)/);
});

test("transpile emits nested, defaulted, assignment, and for-loop destructuring through focused helpers", () => {
  const cpp = transpile('function run(values, data, fallback, pair, info) { var [head = 1, { value, nested: [left = 2, ...tail] } = fallback] = values; var name = null; var total = null; ({ meta: { name = "Jayess" } = info, score: total = 0 } = data); for (var [current, ...rest] = values; current; current = current - 1) { value = current; } return left + total; }', { moduleName: "destructure_expanded_case" });
  assert.match(cpp, /if \(jayess::is_null\(jayess_destructure_/);
  assert.match(cpp, /jayess::destructure_property\(jayess_destructure_[0-9]+, "nested"\)/);
  assert.match(cpp, /jayess::destructure_rest_array\(jayess_destructure_[0-9]+, 1\)/);
  assert.match(cpp, /\(\[&\]\(\) -> jayess::value \{/);
  assert.match(cpp, /return jayess_destructure_[0-9]+;/);
  assert.match(cpp, /\{\s+jayess::value jayess_destructure_[0-9]+ = values;/s);
  assert.match(cpp, /for \(; jayess::truthy\(current\); \(current = jayess::subtract/);
});

test("transpile emits boolean literals", () => {
  const cpp = transpile("var enabled = true; if (false) { enabled = false; }", { moduleName: "boolean_case" });
  assert.match(cpp, /jayess::value\(true\)/);
  assert.match(cpp, /jayess::value\(false\)/);
});

test("transpile emits null literals", () => {
  const cpp = transpile("var value = null;", { moduleName: "null_case" });
  assert.match(cpp, /jayess::value\(std::monostate\{\}\)/);
});

test("transpile emits Jayess null for implicit function completion and uninitialized vars", () => {
  const cpp = transpile("var value; function run() { value; }", { moduleName: "null_fallthrough_case" });
  assert.match(cpp, /jayess::value value = jayess::value\(std::monostate\{\}\);/);
  assert.match(cpp, /return jayess::value\(std::monostate\{\}\);/);
});

test("transpile emits plain member and index reads through null-returning runtime helpers", () => {
  const cpp = transpile("function run(data, index) { return data.value ?? data[index]; }", { moduleName: "null_lookup_case" });
  assert.match(cpp, /jayess::get_property\(data, "value"\)/);
  assert.match(cpp, /jayess::get_index\(data, index\)/);
});

test("transpile emits unary logical not", () => {
  const cpp = transpile("var disabled = !false;", { moduleName: "unary_not_case" });
  assert.match(cpp, /jayess::value\(!jayess::truthy\(jayess::value\(false\)\)\)/);
});

test("transpile emits unary minus", () => {
  const cpp = transpile("var value = -1;", { moduleName: "unary_minus_case" });
  assert.match(cpp, /jayess::subtract\(jayess::value\(static_cast<double>\(0\)\), jayess::value\(static_cast<double>\(1\)\)\)/);
});

test("transpile emits logical operators through short-circuit helpers", () => {
  const cpp = transpile("function run(left, right, backup) { return left || right && backup; }", { moduleName: "logical_case" });
  assert.match(cpp, /\(\[&\]\(\) -> jayess::value/);
  assert.match(cpp, /jayess::truthy\(jayess_left\)/);
});

test("transpile emits nullish coalescing through a single-evaluation helper", () => {
  const cpp = transpile("function run(left, right) { return left ?? right; }", { moduleName: "nullish_case" });
  assert.match(cpp, /jayess_left = left/);
  assert.match(cpp, /if \(!jayess::is_null\(jayess_left\)\)/);
  assert.match(cpp, /return right;/);
});

test("transpile emits optional chaining through null guards", () => {
  const cpp = transpile("function run(data, index, callback) { return callback?.(data?.value, data?.[index]); }", { moduleName: "optional_chain_case" });
  assert.match(cpp, /if \(jayess::is_null\(jayess_object\)\)/);
  assert.match(cpp, /return jayess::get_property\(jayess_object, "value"\);/);
  assert.match(cpp, /return jayess::get_index\(jayess_object, jayess_key\);/);
  assert.match(cpp, /if \(jayess::is_null\(jayess_callee\)\)/);
});

test("transpile emits ternary expressions through a single-evaluation helper", () => {
  const cpp = transpile("function run(flag, left, right) { return flag ? left + 1 : right + 2; }", { moduleName: "ternary_case" });
  assert.match(cpp, /jayess_condition = flag/);
  assert.match(cpp, /if \(jayess::truthy\(jayess_condition\)\)/);
  assert.match(cpp, /return jayess::add\(left, jayess::value\(static_cast<double>\(1\)\)\);/);
  assert.match(cpp, /return jayess::add\(right, jayess::value\(static_cast<double>\(2\)\)\);/);
});

test("transpile emits switch statements through chained equality checks", () => {
  const cpp = transpile("function run(value) { switch (value) { case 1: return 1; case 2: return 2; default: return 3; } }", { moduleName: "switch_case" });
  assert.match(cpp, /jayess::value jayess_switch_value = value;/);
  assert.match(cpp, /if \(std::get<bool>\(jayess::equal\(jayess_switch_value, jayess::value\(static_cast<double>\(1\)\)\)\)\) \{/);
  assert.match(cpp, /else if \(std::get<bool>\(jayess::equal\(jayess_switch_value, jayess::value\(static_cast<double>\(2\)\)\)\)\) \{/);
  assert.match(cpp, /jayess_switch_end_/);
});

test("transpile emits try/catch/finally through exception helpers and a finally guard", () => {
  const cpp = transpile("function run(values) { try { values.push(1); } catch (err) { return err.toString(); } finally { values.push(2); } }", { moduleName: "try_case" });
  assert.match(cpp, /jayess::finally_guard jayess_finally/);
  assert.match(cpp, /catch \(const jayess::thrown_value& jayess_error\)/);
  assert.match(cpp, /try \{/);
  assert.match(cpp, /catch \(const std::exception& jayess_error\)/);
  assert.match(cpp, /jayess::value err = jayess::exception_to_value\(jayess_error\);/);
});

test("transpile emits throw statements through the runtime exception carrier", () => {
  const cpp = transpile("function run(value) { throw value; }", { moduleName: "throw_case" });
  assert.match(cpp, /jayess::throw_value\(value\);/);
});

test("transpile emits async functions through Jayess async handles and await helpers", () => {
  const cpp = transpile("async function run(value) { var next = await value; return next; }", { moduleName: "async_case" });
  assert.match(cpp, /jayess::value jayess_async_result = jayess::make_pending_async\(\);/);
  assert.match(cpp, /jayess::value jayess_async_input = value;/);
  assert.match(cpp, /return jayess::await_sync\(jayess_async_input\);/);
  assert.match(cpp, /jayess::async_resolve\(jayess_async_result, next\);/);
  assert.match(cpp, /jayess::async_reject\(jayess_async_result, jayess::exception_to_value\(jayess_error\)\);/);
});

test("transpile emits async function expressions and async arrows through the shared async callable path", () => {
  const cpp = transpile(
    "function build(step) { var declared = async function run(value) { return await value + step; }; var arrow = async (value = step) => await value + step; return [declared, arrow]; }",
    { moduleName: "async_expression_case" }
  );
  assert.match(cpp, /jayess::make_callable\(\[step\]\(const std::vector<jayess::value>& jayess_args\) -> jayess::value \{/);
  assert.match(cpp, /jayess::value jayess_async_result = jayess::make_pending_async\(\);/);
  assert.match(cpp, /jayess::value jayess_async_input = value;/);
  assert.match(cpp, /return jayess::await_sync\(jayess_async_input\);/);
  assert.match(cpp, /jayess::async_resolve\(jayess_async_result, jayess::add\(/);
  assert.match(cpp, /if \(!jayess::has_argument\(jayess_args, 0\)\) \{\s*value = step;/);
});

test("transpile emits async class methods through Jayess async handles", () => {
  const cpp = transpile("class Worker { async run(value) { return await value; } }", { moduleName: "async_method_case" });

  assert.match(cpp, /jayess::define_class_method\(class_value, "run", jayess::make_callable/);
  assert.match(cpp, /jayess::value this_value = jayess::argument_at\(jayess_args, 0\);/);
  assert.match(cpp, /jayess::value jayess_async_result = jayess::make_pending_async\(\);/);
  assert.match(cpp, /jayess::value value = jayess::argument_at\(jayess_args, 1\);/);
  assert.match(cpp, /return jayess::await_sync\(jayess_async_input\);/);
  assert.match(cpp, /jayess::async_resolve\(jayess_async_result, \(\[&\]\(\) -> jayess::value \{/);
});

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

test("transpile locks current truthiness and equality helper usage", () => {
  const cpp = transpile("function run(value, a, b) { if (value) { return a == b; } return a === b; }", { moduleName: "semantics_case" });
  assert.match(cpp, /if \(jayess::truthy\(value\)\)/);
  assert.match(cpp, /return jayess::equal\(a, b\);/);
});

test("transpile emits strict equality operators through equality helpers", () => {
  const cpp = transpile("function run(a, b) { return a === b; } function diff(a, b) { return a !== b; }", { moduleName: "strict_equality_case" });
  assert.match(cpp, /jayess::equal\(a, b\)/);
  assert.match(cpp, /jayess::not_equal\(a, b\)/);
});

test("transpile emits modulo through the numeric runtime helper", () => {
  const cpp = transpile("function run(a, b) { return a % b; }", { moduleName: "modulo_case" });
  assert.match(cpp, /jayess::modulo\(a, b\)/);
});

test("transpile emits exponentiation through the numeric runtime helper", () => {
  const cpp = transpile("function run(a, b) { return a ** b; }", { moduleName: "power_case" });
  assert.match(cpp, /jayess::power\(a, b\)/);
});

test("transpile emits unary plus through the numeric runtime helper", () => {
  const cpp = transpile("function run(a) { return +a; }", { moduleName: "positive_case" });
  assert.match(cpp, /jayess::positive\(a\)/);
});

test("transpile emits template literals through the interpolation helper", () => {
  const cpp = transpile("function run(name) { return `Hello ${name}!`; }", { moduleName: "template_case" });
  assert.match(cpp, /jayess::interpolate\(\{/);
  assert.match(cpp, /jayess::value\(std::string\("Hello "\)\)/);
});

test("transpile emits default parameter checks for omitted arguments", () => {
  const cpp = transpile("function greet(name, title = `Mx. ${name}`) { return title; }", { moduleName: "default_param_case" });
  assert.match(cpp, /jayess::has_argument\(jayess_args, 1\)/);
  assert.match(cpp, /title = jayess::interpolate/);
});

test("transpile emits rest parameters through the runtime argument-slice helper", () => {
  const cpp = transpile("function collect(head, ...tail) { return tail; }", { moduleName: "rest_param_case" });
  assert.match(cpp, /jayess::value tail = jayess::rest_arguments\(jayess_args, 1\);/);
});

test("transpile accepts trailing commas in supported positions", () => {
  const cpp = transpile("function run(value, ) { var values = [value, 2,]; var data = { answer: value, }; return run(values[0],); }", { moduleName: "trailing_comma_case" });
  assert.match(cpp, /jayess::value run\(const std::vector<jayess::value>& jayess_args\)/);
  assert.match(cpp, /jayess::make_array/);
  assert.match(cpp, /jayess::make_object/);
});

test("transpile emits spread calls through explicit argument-vector helpers", () => {
  const cpp = transpile("function run(fn, items) { return fn(...items, 3); }", { moduleName: "spread_call_case" });
  assert.match(cpp, /std::vector<jayess::value> jayess_args;/);
  assert.match(cpp, /jayess::append_spread_values\(jayess_args, items\);/);
  assert.match(cpp, /jayess_args\.push_back\(jayess::value\(static_cast<double>\(3\)\)\);/);
  assert.match(cpp, /jayess::call_with_args\(jayess_callee, std::move\(jayess_args\)\)/);
});

test("transpile emits compound assignment through arithmetic helpers", () => {
  const cpp = transpile("function run(total, data, index) { total += 2; data.value *= 3; data[index] **= 2; return total; }", { moduleName: "compound_assignment_case" });
  assert.match(cpp, /total = jayess::add\(total, jayess::value\(static_cast<double>\(2\)\)\)/);
  assert.match(cpp, /jayess::set_property\(jayess_object, "value", jayess_next\)/);
  assert.match(cpp, /jayess::set_index\(jayess_object, jayess_key, jayess_next\)/);
});

test("transpile emits prefix and postfix update expressions", () => {
  const cpp = transpile("function run(total, data, index) { ++total; data.value--; return data[index]++; }", { moduleName: "update_expression_case" });
  assert.match(cpp, /total = jayess::add\(total, jayess::value\(static_cast<double>\(1\)\)\)/);
  assert.match(cpp, /return jayess_before;/);
  assert.match(cpp, /jayess::set_property\(jayess_object, "value", jayess_next\)/);
  assert.match(cpp, /jayess::set_index\(jayess_object, jayess_key, jayess_next\)/);
});

test("transpile emits composite built-ins through focused runtime helpers", () => {
  const cpp = transpile('function run(values) { var size = values.length; values.push(3); return "Jayess".length; }', { moduleName: "composite_builtins_case" });
  assert.match(cpp, /jayess::get_length\(values\)/);
  assert.match(cpp, /jayess::array_push\(jayess_object, std::move\(jayess_args\)\)/);
  assert.match(cpp, /jayess::get_length\(jayess::value\(std::string\("Jayess"\)\)\)/);
});

test("transpile emits primitive toString built-ins through focused runtime helpers", () => {
  const cpp = transpile('function run() { return (1).toString(); }', { moduleName: "primitive_tostring_case" });
  assert.match(cpp, /return jayess::to_string_value\(jayess_object\);/);
});

test("transpile emits array and string method built-ins through focused runtime helpers", () => {
  const cpp = transpile('function run(values, text) { var last = values.pop(); var joined = values.join("-"); var found = values.includes(2); var sliced = text.slice(1, 3); var sub = text.substring(2); var hasMid = text.includes("aye"); var firstIndex = text.indexOf("ye"); var hasSuffix = text.endsWith("ss"); return text.startsWith("Ja"); }', { moduleName: "array_string_methods_case" });
  assert.match(cpp, /return jayess::array_pop\(jayess_object\);/);
  assert.match(cpp, /return jayess::array_join\(jayess_object, jayess_args\);/);
  assert.match(cpp, /return jayess::array_includes\(jayess_object, jayess_args\);/);
  assert.match(cpp, /return jayess::string_slice\(jayess_object, jayess_args\);/);
  assert.match(cpp, /return jayess::string_substring\(jayess_object, jayess_args\);/);
  assert.match(cpp, /return jayess::string_includes\(jayess_object, jayess_args\);/);
  assert.match(cpp, /return jayess::string_index_of\(jayess_object, jayess_args\);/);
  assert.match(cpp, /return jayess::string_ends_with\(jayess_object, jayess_args\);/);
  assert.match(cpp, /return jayess::string_starts_with\(jayess_object, jayess_args\);/);
});

test("transpile emits member assignment helpers for objects and arrays", () => {
  const cpp = transpile('var data = { name: "jayess", items: [1, 2] }; data.name = "updated"; data.items[0] = 3;', { moduleName: "member_assignment_case" });
  assert.match(cpp, /jayess::set_property\(data, "name", jayess::value\(std::string\("updated"\)\)\)/);
  assert.match(cpp, /jayess::set_index\(jayess::get_property\(data, "items"\), jayess::value\(static_cast<double>\(0\)\), jayess::value\(static_cast<double>\(3\)\)\)/);
});

test("transpile emits private fields through dedicated private-storage helpers", () => {
  const cpp = transpile("class Box { #value = 1; read(other) { return other.#value; } write(other, next) { other.#value = next; other.#value += 1; return other.#value++; } }", { moduleName: "private_field_case" });
  assert.match(cpp, /jayess::set_private_field\(this_value, class_value, "value", jayess::value\(static_cast<double>\(1\)\)\)/);
  assert.match(cpp, /jayess::get_private_field\(other, class_value, "value"\)/);
  assert.match(cpp, /jayess::set_private_field\(other, class_value, "value", next\)/);
  assert.match(cpp, /jayess::set_private_field\(jayess_object, class_value, "value", jayess_next\)/);
  assert.doesNotMatch(cpp, /jayess::get_property\(other, "value"\)/);
});

test("transpile emits private instance methods through hidden private callables", () => {
  const cpp = transpile("class Box { #value() { return 1; } call(other) { return other.#value(); } }", { moduleName: "private_method_case" });
  assert.match(cpp, /jayess::set_private_field\(this_value, class_value, "value", jayess::make_callable/);
  assert.match(cpp, /return jayess::call\(jayess::get_private_field\(other, class_value, "value"\)\);/);
  assert.doesNotMatch(cpp, /jayess::define_class_method\(class_value, "value"/);
});

test("transpile emits private static members through hidden class storage", () => {
  const cpp = transpile("class Box { static #value = 1; static #read() { return Box.#value; } static read() { return Box.#read(); } }", { moduleName: "private_static_case" });
  assert.match(cpp, /jayess::set_private_static_field\(class_value, "value", jayess::value\(static_cast<double>\(1\)\)\)/);
  assert.match(cpp, /jayess::set_private_static_field\(class_value, "read", jayess::make_callable/);
  assert.match(cpp, /return jayess::get_private_static_field\(class_value, "value"\);/);
  assert.match(cpp, /return jayess::call\(jayess::get_private_static_field\(class_value, "read"\)\);/);
  assert.doesNotMatch(cpp, /jayess::define_class_method\(class_value, "read"/);
});

test("transpile emits callable closures with captured bindings", () => {
  const cpp = transpile("function outer(x) { return function(y) { return x + y; }; }", { moduleName: "closure_case" });
  assert.match(cpp, /jayess::make_callable/);
  assert.match(cpp, /\[x\]\(const std::vector<jayess::value>& jayess_args\)/);
});

test("transpile emits arrow functions with implicit returns and lexical this capture", () => {
  const cpp = transpile("class Counter { value = 1; make(step) { return (delta = step) => this.value + delta; } }", { moduleName: "arrow_case" });
  assert.match(cpp, /\[step, this_value\]\(const std::vector<jayess::value>& jayess_args\)/);
  assert.match(cpp, /return jayess::add\(jayess::get_property\(this_value, "value"\), delta\);/);
});

test("transpile emits class factory helpers for class declarations", () => {
  const cpp = transpile("class Point { constructor(x, y) { this.x = x; this.y = y; } sum() { return this.x + this.y; } }", { moduleName: "class_case" });
  assert.match(cpp, /jayess::define_class_method\(class_value, "sum"/);
  assert.match(cpp, /jayess::set_class_constructor\(class_value, jayess::make_callable/);
  assert.match(cpp, /jayess::set_property\(this_value, "x", x\)/);
});

test("transpile emits inheritance helpers for derived classes", () => {
  const cpp = transpile("class Base { constructor(value) { this.value = value; } name() { return this.value; } } class Child extends Base { constructor(value) { super(value); this.extra = value; } read() { return super.name(); } }", { moduleName: "inheritance_case" });
  assert.match(cpp, /jayess::set_base_class\(class_value, base_class\)/);
  assert.match(cpp, /jayess::call_class_constructor\(jayess::get_base_class\(class_value\), this_value, \{value\}\)/);
  assert.match(cpp, /jayess::bind_method\(this_value, jayess::find_class_method\(jayess::get_base_class\(class_value\), "name"\)\)/);
  assert.match(cpp, /jayess::set_instance_class\(this_value, class_value\)/);
});

test("transpile emits derived constructor ordering as base call then derived fields then remaining body", () => {
  const cpp = transpile(
    "class Base { constructor(value) { this.base = value; } } class Child extends Base { derived = 1; constructor(value) { super(value); this.after = value; } }",
    { moduleName: "inheritance_order_case" }
  );

  const superIndex = cpp.indexOf("jayess::call_class_constructor(jayess::get_base_class(class_value), this_value, {value})");
  const fieldIndex = cpp.indexOf('jayess::set_property(this_value, "derived", jayess::value(static_cast<double>(1)))');
  const bodyIndex = cpp.indexOf('jayess::set_property(this_value, "after", value)');

  assert.notEqual(superIndex, -1);
  assert.notEqual(fieldIndex, -1);
  assert.notEqual(bodyIndex, -1);
  assert.ok(superIndex < fieldIndex);
  assert.ok(fieldIndex < bodyIndex);
});

test("transpile inherits instance methods through class-chain dispatch", () => {
  const cpp = transpile(
    "class Base { name() { return 1; } } class Child extends Base {} function run() { var child = new Child(); return child.name(); }",
    { moduleName: "inheritance_dispatch_case" }
  );

  assert.match(cpp, /jayess::define_class_method\(class_value, "name"/);
  assert.match(cpp, /return jayess::call\(jayess::get_property\(child, "name"\)\)/);
});

test("transpile emits static inheritance through class-side property lookup", () => {
  const cpp = transpile(
    "class Base { static label = 1; static read() { return Base.label; } } class Child extends Base { static label = 2; } class Grandchild extends Child {} function run() { return Grandchild.read() + Grandchild.label; }",
    { moduleName: "static_inheritance_case" }
  );

  assert.match(cpp, /jayess::set_base_class\(class_value, base_class\)/);
  assert.match(cpp, /jayess::set_property\(class_value, "label", jayess::value\(static_cast<double>\(1\)\)\)/);
  assert.match(cpp, /jayess::set_property\(class_value, "read", jayess::make_callable/);
  assert.match(cpp, /jayess::set_property\(class_value, "label", jayess::value\(static_cast<double>\(2\)\)\)/);
  assert.match(cpp, /return jayess::add\(jayess::call\(jayess::get_property\(Grandchild, "read"\)\), jayess::get_property\(Grandchild, "label"\)\);/);
});

test("transpile rejects derived constructors whose super call is not the first statement", () => {
  assert.throws(
    () => transpile(
      "class Base { constructor(value) { this.value = value; } } class Child extends Base { constructor(value) { this.before = value; super(value); } }",
      { moduleName: "invalid_super_order_case" }
    ),
    /Derived constructors currently require 'super\(\.\.\.\)' as their first statement/
  );
});

test("transpile emits class field initializers in the class factory", () => {
  const cpp = transpile("class Point { x = 1; y = 2; }", { moduleName: "class_field_case" });
  assert.match(cpp, /jayess::set_property\(this_value, "x", jayess::value\(static_cast<double>\(1\)\)\)/);
  assert.match(cpp, /jayess::set_property\(this_value, "y", jayess::value\(static_cast<double>\(2\)\)\)/);
});

test("transpile emits static class members on the class value", () => {
  const cpp = transpile("class Point { static origin = 0; static make() { return new Point(); } }", { moduleName: "static_class_case" });
  assert.match(cpp, /auto class_wrapper = std::make_shared<jayess::callable_value>\(\);/);
  assert.match(cpp, /jayess::set_class_constructor\(class_value, jayess::make_callable/);
  assert.match(cpp, /jayess::set_property\(class_value, "origin", jayess::value\(static_cast<double>\(0\)\)\)/);
  assert.match(cpp, /jayess::set_property\(class_value, "make", jayess::make_callable/);
});

test("transpile emits computed class members through dynamic key helpers", () => {
  const cpp = transpile('class Point { ["name"]() { return 1; } ["field"] = 2; static ["origin"] = 3; static ["make"]() { return new Point(); } }', { moduleName: "computed_class_case" });
  assert.match(cpp, /jayess::value jayess_computed_key_0 = jayess::value\(std::string\("name"\)\);/);
  assert.match(cpp, /jayess::define_dynamic_class_method\(class_value, jayess_computed_key_0,/);
  assert.match(cpp, /jayess::set_index\(this_value, jayess_computed_key_1, jayess::value\(static_cast<double>\(2\)\)\)/);
  assert.match(cpp, /jayess::set_index\(class_value, jayess_computed_key_2, jayess::value\(static_cast<double>\(3\)\)\)/);
  assert.match(cpp, /jayess::set_index\(class_value, jayess_computed_key_3, jayess::make_callable/);
});

test("transpile preserves static class-side source order across static fields and blocks", () => {
  const cpp = transpile(
    'class Point { static first = 1; static { Point.second = Point.first; } static third = Point.second; }',
    { moduleName: "static_block_order_case" }
  );

  const firstIndex = cpp.indexOf('jayess::set_property(class_value, "first", jayess::value(static_cast<double>(1)))');
  const blockIndex = cpp.indexOf('jayess::set_property(class_value, "second", jayess::get_property(class_value, "first"))');
  const thirdIndex = cpp.indexOf('jayess::set_property(class_value, "third", jayess::get_property(class_value, "second"))');

  assert.notEqual(firstIndex, -1);
  assert.notEqual(blockIndex, -1);
  assert.notEqual(thirdIndex, -1);
  assert.ok(firstIndex < blockIndex);
  assert.ok(blockIndex < thirdIndex);
});

test("transpile emits scope cleanup frames in generated functions", () => {
  const cpp = transpile("function add(a, b) { return a + b; }", { moduleName: "cleanup_case" });
  assert.match(cpp, /jayess::scope_cleanup_frame jayess_scope;/);
});
