import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "../../src/parser/parse.js";
import { createSourceText } from "../../src/source/source-text.js";
import { analyzeModule } from "../../src/semantic/analyze.js";
import { JayessError } from "../../src/diagnostics.js";

test("semantic analysis rejects const reassignment", () => {
  const sourceText = createSourceText("const x = 1; x = 2;");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    (error) => error instanceof JayessError && /Cannot reassign const/.test(error.diagnostics[0].message)
  );
});

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

test("semantic analysis enforces block scoped var", () => {
  const sourceText = createSourceText("if (1) { var x = 2; } x;");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Undefined identifier 'x'/
  );
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

test("semantic analysis rejects Node built-in imports inside Jayess source", () => {
  const sourceText = createSourceText('import { readFileSync } from "node:fs";');
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /jayess:fs/
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

test("semantic analysis accepts supported derived classes once inheritance lowering lands", () => {
  const sourceText = createSourceText("class Base {} class Child extends Base { constructor(value) { super(value); } method() { return super.name; } }");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
  assert.ok(
    !result.diagnostics.some((diagnostic) => /only inside derived constructors|only inside derived instance methods|only inside derived classes/.test(diagnostic.message))
  );
});

test("semantic analysis rejects derived classes whose base is not a Jayess class", () => {
  const sourceText = createSourceText("var Base = 1; class Child extends Base {}");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.ok(
    result.diagnostics.some((diagnostic) => /Base class 'Base' must resolve to a Jayess class/.test(diagnostic.message))
  );
});

test("semantic analysis rejects non-identifier base expressions in the first inheritance slice", () => {
  const sourceText = createSourceText("class Base {} function pickBase() { return Base; } class Child extends pickBase() {}");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.ok(
    result.diagnostics.some((diagnostic) => /only named Jayess class bases/.test(diagnostic.message))
  );
});

test("semantic analysis rejects super calls outside derived constructors", () => {
  const sourceText = createSourceText("class Base {} class Child extends Base { method() { super(); } }");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.ok(
    result.diagnostics.some((diagnostic) => /only inside derived constructors/.test(diagnostic.message))
  );
});

test("semantic analysis rejects super member lookups outside derived instance methods", () => {
  const sourceText = createSourceText("class Base {} class Child extends Base { constructor() { return super.name; } }");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.ok(
    result.diagnostics.some((diagnostic) => /only inside derived instance methods/.test(diagnostic.message))
  );
});

test("semantic analysis rejects bare super outside derived classes", () => {
  const sourceText = createSourceText("class Point { method() { return super; } }");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /only inside derived classes/
  );
});

test("semantic analysis accepts same-class private field access", () => {
  const sourceText = createSourceText("class Box { #value = 1; #copy = this.#value; read(other) { return other.#value; } write(other, next) { other.#value = next; other.#value++; return other.#value; } }");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis rejects private field access outside the declaring class", () => {
  const sourceText = createSourceText("var box = null; box.#value;");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Jayess private field access is only valid inside methods or field initializers of the declaring class/
  );
});

test("semantic analysis rejects private field access from a different class", () => {
  const sourceText = createSourceText("class Box { #value = 1; } class Reader { read(other) { return other.#value; } }");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Private field '#value' is not declared in class 'Reader'/
  );
});

test("semantic analysis rejects duplicate private field names in one class", () => {
  const sourceText = createSourceText("class Box { #value = 1; #value = 2; }");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Duplicate private field '#value' in class 'Box'/
  );
});

test("semantic analysis rejects generator function expressions outside the first slice", () => {
  const sourceText = createSourceText("var make = function* named(value) { yield value; };");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Jayess does not support generator function expressions yet; the first generator slice starts with generator declarations only/
  );
});

test("semantic analysis rejects break and continue outside loops", () => {
  const breakSource = createSourceText("break;");
  const continueSource = createSourceText("continue;");
  assert.throws(
    () => analyzeModule(parse(breakSource), breakSource),
    /break is only valid inside a loop or switch/
  );
  assert.throws(
    () => analyzeModule(parse(continueSource), continueSource),
    /continue is only valid inside a loop/
  );
});

test("semantic analysis scopes for-loop variables to the loop", () => {
  const sourceText = createSourceText("for (var i = 0; i < 1; i = i + 1) { i; } i;");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Undefined identifier 'i'/
  );
});

test("semantic analysis accepts do-while loops and loop control", () => {
  const sourceText = createSourceText("var total = 0; do { total += 1; if (total > 2) { break; } continue; } while (total < 5);");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis accepts switch statements with clause-local bindings", () => {
  const sourceText = createSourceText("function run(value) { switch (value) { case 1: var inside = 1; break; default: break; } }");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis keeps switch-clause bindings local", () => {
  const sourceText = createSourceText("switch (1) { case 1: var inside = 1; break; default: break; } inside;");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Undefined identifier 'inside'/
  );
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

test("semantic analysis accepts declaration destructuring", () => {
  const sourceText = createSourceText('var values = [1, 2]; var data = { name: "jayess", score: 3 }; var [left, right] = values; const { name, score: total } = data;');
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis accepts rest bindings in declaration destructuring", () => {
  const sourceText = createSourceText('var values = [1, 2, 3]; var data = { name: "jayess", score: 3, level: 4 }; var [head, ...tail] = values; const { name, ...rest } = data;');
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

test("semantic analysis accepts compound assignment for mutable bindings and members", () => {
  const sourceText = createSourceText("var total = 1; total += 2; total -= 1; var data = { value: 1, items: [2] }; data.value *= 3; data.items[0] /= 2;");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis rejects compound assignment on const bindings", () => {
  const sourceText = createSourceText("const total = 1; total += 2;");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Cannot update const 'total'/
  );
});

test("semantic analysis accepts update expressions for mutable bindings and members", () => {
  const sourceText = createSourceText("var total = 1; ++total; total--; var data = { value: 1, items: [2] }; ++data.value; data.items[0]--;");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis accepts supported composite built-ins", () => {
  const sourceText = createSourceText('var values = [1, 2]; var size = values.length; values.push(3); values.pop(); values.join("-"); var nameSize = "Jayess".length; "Jayess".slice(1, 3); "Jayess".substring(2); "Jayess".startsWith("Ja");');
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis accepts supported primitive toString built-ins", () => {
  const sourceText = createSourceText('var name = "Jayess".toString(); var count = (1).toString(); var enabled = true.toString(); var empty = null.toString();');
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis rejects unsupported composite built-ins on literals", () => {
  const sourceText = createSourceText('var size = [1, 2].length; [1, 2].map; "Jayess".trim; true.valueOf;');
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Unsupported built-in array property 'map'/
  );
});

test("semantic analysis rejects calling non-callable built-in length", () => {
  const sourceText = createSourceText('"Jayess".length();');
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /string property 'length' is not callable/
  );
});

test("semantic analysis rejects arguments for primitive toString built-ins", () => {
  const sourceText = createSourceText('(1).toString(10);');
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /number method 'toString' does not accept arguments/
  );
});

test("semantic analysis rejects invalid array and string built-in argument counts", () => {
  assert.throws(
    () => analyzeModule(parse(createSourceText("[1, 2].pop(1);")), createSourceText("[1, 2].pop(1);")),
    /array method 'pop' does not accept arguments/
  );
  assert.throws(
    () => analyzeModule(parse(createSourceText('[1, 2].join("-", "!");')), createSourceText('[1, 2].join("-", "!");')),
    /array method 'join' accepts at most one argument/
  );
  assert.throws(
    () => analyzeModule(parse(createSourceText('"Jayess".slice();')), createSourceText('"Jayess".slice();')),
    /string method 'slice' requires one or two arguments/
  );
  assert.throws(
    () => analyzeModule(parse(createSourceText('"Jayess".startsWith();')), createSourceText('"Jayess".startsWith();')),
    /string method 'startsWith' requires exactly one argument/
  );
});

test("semantic analysis rejects update expressions on const and invalid targets", () => {
  const constSource = createSourceText("const total = 1; ++total;");
  const invalidSource = createSourceText("var total = 1; ++(total + 1);");

  assert.throws(
    () => analyzeModule(parse(constSource), constSource),
    /Cannot update const 'total'/
  );
  assert.throws(
    () => analyzeModule(parse(invalidSource), invalidSource),
    /Jayess semantic analysis does not support '\+\+' on this update target/
  );
});

test("semantic analysis accepts member assignment for objects and arrays", () => {
  const sourceText = createSourceText('var data = { name: "jayess", values: [1, 2] }; data.name = "updated"; data.values[0] = 3;');
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis rejects unsupported assignment targets", () => {
  const sourceText = createSourceText("var data = 1; (data + 1) = 2;");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Jayess semantic analysis does not support '=' on this assignment target/
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

test("semantic analysis accepts class construction and method access", () => {
  const sourceText = createSourceText("class Point { constructor(x, y) { this.x = x; this.y = y; } sum() { return this.x + this.y; } } var point = new Point(1, 2); point.sum();");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });

  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis accepts class field initializers with this access", () => {
  const sourceText = createSourceText("class Point { x = 1; y = this.x; sum() { return this.y; } } var point = new Point(); point.sum();");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });

  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis accepts static class members", () => {
  const sourceText = createSourceText("class Point { static origin = 0; static make() { return new Point(); } x = Point.origin; } var point = Point.make(); point.x;");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });

  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis accepts computed class members and static initialization blocks", () => {
  const sourceText = createSourceText('var suffix = "Name"; class Point { static label = 1; ["field" + suffix] = Point.label; static { var ready = Point.label; } static ["make" + suffix]() { return new Point(); } }');
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });

  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis resolves computed class keys and static block bodies through class-side scopes", () => {
  const computedSource = createSourceText('var suffix = "Name"; class Point { [suffix + missing] = 1; }');
  const computedAst = parse(computedSource);
  assert.throws(
    () => analyzeModule(computedAst, computedSource),
    /Undefined identifier 'missing'/
  );

  const staticBlockSource = createSourceText("class Point { static { var ready = 1; } } ready;");
  const staticBlockAst = parse(staticBlockSource);
  assert.throws(
    () => analyzeModule(staticBlockAst, staticBlockSource),
    /Undefined identifier 'ready'/
  );
});

test("semantic analysis rejects this outside class methods", () => {
  const sourceText = createSourceText("this;");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Undefined identifier 'this'/
  );
});

test("semantic analysis rejects duplicate destructuring bindings and for-loop destructuring", () => {
  const duplicateSource = createSourceText("var values = [1, 2]; var [left, left] = values;");
  const duplicateAst = parse(duplicateSource);
  assert.throws(
    () => analyzeModule(duplicateAst, duplicateSource),
    /Duplicate declaration 'left'/
  );

  const forSource = createSourceText("var values = [1, 2]; for (var [left, right] = values; false; ) { }");
  const forAst = parse(forSource);
  assert.throws(
    () => analyzeModule(forAst, forSource),
    /Destructuring declarations are not yet supported in for-loop initializers/
  );
});

test("semantic analysis accepts try/catch/finally with catch-scoped bindings", () => {
  const sourceText = createSourceText("function run(values) { try { values.push(1); } catch (err) { return err.toString(); } finally { values.push(2); } }");
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis keeps catch bindings scoped to catch blocks", () => {
  const sourceText = createSourceText("function run(action) { try { action(); } catch (err) { var local = err; } return err; }");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Undefined identifier 'err'/
  );
});

test("semantic analysis rejects control-flow statements inside finally blocks", () => {
  const sourceText = createSourceText("function run() { try { return 1; } finally { return 2; } }");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Jayess does not yet support 'return' inside finally blocks/
  );
});

test("semantic analysis accepts throw statements", () => {
  const sourceText = createSourceText('function run(value) { throw value; }');
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis rejects undefined throw expressions", () => {
  const sourceText = createSourceText("function run() { throw missingValue; }");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Undefined identifier 'missingValue'/
  );
});
