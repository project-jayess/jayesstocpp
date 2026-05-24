import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "../../src/parser/parse.js";
import { createSourceText } from "../../src/source/source-text.js";
import { analyzeModule } from "../../src/semantic/analyze.js";
import { JayessError } from "../../src/diagnostics.js";

test("semantic analysis records imports", () => {
  const sourceText = createSourceText('import "cpp:string";');
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText);
  assert.equal(result.imports[0].kind, "cpp-header");
});

test("semantic analysis supports recoverable diagnostics", () => {
  const sourceText = createSourceText("missingName;");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics[0].phase, "semantic");
});

test("semantic analysis rejects use before declaration", () => {
  const sourceText = createSourceText("x; var x = 1;");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Undefined identifier 'x'/
  );
});

test("semantic analysis allows shadowing across nested scopes", () => {
  const sourceText = createSourceText("var x = 1; if (1) { var x = 2; x; }");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis accepts named default-exported function declarations", () => {
  const sourceText = createSourceText("export default function add(a, b) { return a + b; } add(1, 2);");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
  assert.equal(result.exports[0].exportedName, "default");
});

test("semantic analysis accepts named default-exported class declarations", () => {
  const sourceText = createSourceText("export default class Point { sum() { return 1; } } var point = new Point(); point.sum();");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
  assert.equal(result.exports[0].exportedName, "default");
});

test("semantic analysis accepts anonymous default-exported functions without a local binding", () => {
  const sourceText = createSourceText("export default function(a, b) { return a + b; }");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
  assert.equal(result.exports[0].exportedName, "default");
});

test("semantic analysis accepts anonymous default-exported classes without a local binding", () => {
  const sourceText = createSourceText("export default class { sum() { return 1; } }");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
  assert.equal(result.exports[0].exportedName, "default");
});

test("semantic analysis records export all declarations without diagnostics", () => {
  const sourceText = createSourceText('export * from "./math.js";');
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
  assert.equal(result.exports[0].kind, "export-all");
});

test("semantic analysis records named re-exports without diagnostics", () => {
  const sourceText = createSourceText('export { add as sum } from "./math.js";');
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
  assert.equal(result.exports[0].exportedName, "sum");
});

test("semantic analysis rejects duplicate exported names", () => {
  const sourceText = createSourceText("var one = 1; var two = 2; export { one as value }; export { two as value };");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Duplicate export 'value'/
  );
});

test("semantic analysis rejects local export specifiers for undefined names", () => {
  const sourceText = createSourceText("export { missing as renamed };");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Cannot export undefined local binding 'missing'/
  );
});

test("semantic analysis rejects binding imports from C++ standard library headers", () => {
  const sourceText = createSourceText('import { vector } from "cpp:vector";');
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /do not provide Jayess bindings/
  );
});

test("semantic analysis rejects binding imports from native library artifacts", () => {
  const sourceText = createSourceText('import { add } from "./native/math.dll";');
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /cannot provide Jayess bindings/
  );
});

test("semantic analysis rejects await outside async functions", () => {
  const sourceText = createSourceText("var value = await work();");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /'await' is only valid inside async functions/
  );
});

test("semantic analysis keeps await scoped to the nearest async function", () => {
  const sourceText = createSourceText("async function outer(value) { function inner() { return await value; } return value; }");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.ok(result.diagnostics.some((diagnostic) => /'await' is only valid inside async functions/.test(diagnostic.message)));
});

test("semantic analysis accepts async declarations once lowering/runtime lands", () => {
  const sourceText = createSourceText("async function run(value) { return await value; }");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis accepts async function expressions and async arrows once lowering lands", () => {
  const sourceText = createSourceText("var declared = async function run(value) { return await value; }; var unary = async value => await value; var grouped = async (left, right = 1) => { return await left; };");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis keeps await scoped correctly inside async function expressions and async arrows", () => {
  const sourceText = createSourceText("var declared = async function run(value) { return await value; }; var grouped = async (value) => { function inner() { return await value; } return await value; };");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });

  assert.equal(
    result.diagnostics.filter((diagnostic) => /'await' is only valid inside async functions/.test(diagnostic.message)).length,
    1
  );
});

test("semantic analysis rejects yield outside generator functions", () => {
  const sourceText = createSourceText("yield value;");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /'yield' is only valid inside generator functions/
  );
});

test("semantic analysis keeps yield scoped to the nearest generator function", () => {
  const sourceText = createSourceText("function* outer(value) { function inner() { return yield value; } return value; }");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.ok(result.diagnostics.some((diagnostic) => /'yield' is only valid inside generator functions/.test(diagnostic.message)));
});

test("semantic analysis accepts generator declarations once lowering/runtime lands", () => {
  const sourceText = createSourceText("function* run(value) { yield value; }");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis accepts supported generator declarations with local state and delegated yield", () => {
  const sourceText = createSourceText("function* run(input) { var first = yield input; yield* input; return first; }");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis accepts generator function expressions once lowering lands", () => {
  const sourceText = createSourceText("var make = function* named(value) { yield value; };");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis accepts array and object read access", () => {
  const sourceText = createSourceText('var data = { name: "jayess", values: [1, 2] }; data.name; data["name"]; data.values[0];');
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis accepts array spread elements", () => {
  const sourceText = createSourceText("var prefix = [1]; var items = [2, 3]; var values = [...prefix, ...items, 4];");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis accepts object spread properties", () => {
  const sourceText = createSourceText('var base = { answer: 1 }; var data = { ...base, name: "jayess" };');
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis accepts boolean literals", () => {
  const sourceText = createSourceText("var enabled = true; if (enabled) { enabled = false; }");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis accepts null literals", () => {
  const sourceText = createSourceText("var value = null; if (value == null) { value = 1; }");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis accepts unary logical not", () => {
  const sourceText = createSourceText("var disabled = !false; if (!disabled) { disabled = true; }");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis accepts unary minus", () => {
  const sourceText = createSourceText("var value = -1; if (value < 0) { value = -value; }");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis accepts logical operators", () => {
  const sourceText = createSourceText("var result = false || true && true; if (result && !false) { result = null || true; }");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis accepts nullish coalescing", () => {
  const sourceText = createSourceText("var fallback = 2; var result = null ?? fallback; var nested = result ?? 3;");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis accepts optional chaining", () => {
  const sourceText = createSourceText("var data = { value: 1 }; var index = 0; var callback = function(left, right) { return left + right; }; var value = data?.value; var item = data?.[index]; var result = callback?.(value, item);");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis rejects undefined optional-chain receivers", () => {
  const sourceText = createSourceText("var value = missing?.prop;");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Undefined identifier 'missing'/
  );
});

test("semantic analysis accepts ternary expressions", () => {
  const sourceText = createSourceText("var result = true ? 1 : 2; var nested = result ? result : 3;");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis accepts strict equality operators", () => {
  const sourceText = createSourceText("var same = 1 === 1; var different = false !== null;");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis accepts modulo operator", () => {
  const sourceText = createSourceText("var remainder = 5 % 2; if (remainder == 1) { remainder = 4 % 3; }");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis accepts exponentiation operator", () => {
  const sourceText = createSourceText("var value = 2 ** 3 ** 2; if (value > 0) { value = value ** 1; }");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis accepts unary plus", () => {
  const sourceText = createSourceText("var value = +1; if (+value > 0) { value = +value; }");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis accepts template literal interpolations", () => {
  const sourceText = createSourceText("var name = \"Jayess\"; var message = `Hello ${name}!`;");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis accepts default parameters that reference earlier parameters", () => {
  const sourceText = createSourceText("function greet(name, title = `Mx. ${name}`) { return title; }");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis accepts rest parameters", () => {
  const sourceText = createSourceText("function collect(head, ...tail) { return tail; } var join = (...items) => items;");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis rejects default parameters that reference later parameters", () => {
  const sourceText = createSourceText("function greet(title = name, name = \"Jayess\") { return title; }");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Undefined identifier 'name'/
  );
});

test("semantic analysis accepts trailing commas in supported positions", () => {
  const sourceText = createSourceText('import { add, } from "./math.js"; function run(value, ) { var values = [value, 2,]; var data = { answer: add(values[0], values[1],), }; return data.answer; } export { run, };');
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis accepts spread arguments in call-like expressions", () => {
  const sourceText = createSourceText("function call(fn, items, callback, Point, coords) { fn(...items, 3); callback?.(...items); return new Point(...coords); }");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis resolves identifiers inside spread arguments", () => {
  const sourceText = createSourceText("function call(fn) { return fn(...items); }");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Undefined identifier 'items'/
  );
});

test("semantic analysis records captured bindings for function expressions", () => {
  const sourceText = createSourceText("function outer(x) { var make = function(y) { return x + y; }; return make; }");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  const functionExpression = ast.body[0].body.body[0].declarations[0].init;

  assert.equal(result.diagnostics.length, 0);
  assert.deepEqual(functionExpression.captures, ["x"]);
});

test("semantic analysis records captures for arrow functions with lexical this", () => {
  const sourceText = createSourceText("class Counter { value = 1; make(step) { return (delta = step) => this.value + delta; } }");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  const arrowFunction = ast.body[0].methods[1].body.body[0].argument;

  assert.equal(result.diagnostics.length, 0);
  assert.deepEqual(arrowFunction.captures, ["step", "this"]);
});

test("semantic analysis records captures for async function expressions and async arrows", () => {
  const sourceText = createSourceText("function outer(x) { var declared = async function run(y) { return await x + y; }; var grouped = async (delta = x) => await x + delta; return grouped; }");
  const ast = parse(sourceText);
  analyzeModule(ast, sourceText, { throwOnError: false });
  const functionExpression = ast.body[0].body.body[0].declarations[0].init;
  const arrowFunction = ast.body[0].body.body[1].declarations[0].init;

  assert.deepEqual(functionExpression.captures, ["x"]);
  assert.deepEqual(arrowFunction.captures, ["x"]);
});

test("semantic analysis rejects arguments inside arrow functions clearly", () => {
  const sourceText = createSourceText("var fn = () => arguments;");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Jayess arrow functions do not support 'arguments'; use named parameters instead/
  );
});

test("semantic analysis rejects undefined ternary branch bindings", () => {
  const sourceText = createSourceText("var known = 1; var result = true ? known : missingValue;");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Undefined identifier 'missingValue'/
  );
});

test("semantic analysis keeps named function expression self-binding local", () => {
  const sourceText = createSourceText("var make = function inner(x) { return inner(x); }; inner;");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Undefined identifier 'inner'/
  );
});
