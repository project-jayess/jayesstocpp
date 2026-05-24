import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "../../src/parser/parse.js";
import { createSourceText } from "../../src/source/source-text.js";
import { analyzeModule } from "../../src/semantic/analyze.js";

function analyze(source, options = { throwOnError: false }) {
  const sourceText = createSourceText(source);
  const ast = parse(sourceText);
  return { sourceText, ast, result: analyzeModule(ast, sourceText, options) };
}

test("semantic analysis accepts supported derived classes once inheritance lowering lands", () => {
  const { result } = analyze("class Base {} class Child extends Base { constructor(value) { super(value); } method() { return super.name; } }");
  assert.equal(result.diagnostics.length, 0);
  assert.ok(!result.diagnostics.some((diagnostic) => /only inside derived constructors|only inside derived instance methods|only inside derived classes/.test(diagnostic.message)));
});

test("semantic analysis rejects derived classes whose base is not a Jayess class", () => {
  const { result } = analyze("var Base = 1; class Child extends Base {}");
  assert.ok(result.diagnostics.some((diagnostic) => /Base class 'Base' must resolve to a Jayess class/.test(diagnostic.message)));
});

test("semantic analysis rejects non-identifier base expressions in the first inheritance slice", () => {
  const { result } = analyze("class Base {} function pickBase() { return Base; } class Child extends pickBase() {}");
  assert.ok(result.diagnostics.some((diagnostic) => /only named Jayess class bases/.test(diagnostic.message)));
});

test("semantic analysis rejects invalid super usage", () => {
  assert.ok(analyze("class Base {} class Child extends Base { method() { super(); } }").result.diagnostics.some((diagnostic) => /only inside derived constructors/.test(diagnostic.message)));
  assert.ok(analyze("class Base {} class Child extends Base { constructor() { return super.name; } }").result.diagnostics.some((diagnostic) => /only inside derived instance methods/.test(diagnostic.message)));
  assert.ok(analyze("class Base {} class Child extends Base { method() { super.name = 1; } }").result.diagnostics.some((diagnostic) => /does not support assigning to 'super' properties/.test(diagnostic.message)));
  assert.ok(analyze("class Base {} class Child extends Base { method() { super.count++; } }").result.diagnostics.some((diagnostic) => /does not support updating 'super' properties/.test(diagnostic.message)));

  const sourceText = createSourceText("class Point { method() { return super; } }");
  const ast = parse(sourceText);
  assert.throws(() => analyzeModule(ast, sourceText), /Bare 'super' expressions are not supported/);
});

test("semantic analysis accepts supported super access forms", () => {
  assert.equal(analyze("class Base { static read() { return 1; } } class Child extends Base { static read() { return super.read(); } }").result.diagnostics.length, 0);
  assert.equal(analyze("class Base { static value = 1; } class Child extends Base { static read() { return super.value; } }").result.diagnostics.length, 0);
  assert.equal(analyze("class Base { read() { return 1; } } class Child extends Base { read(name) { return super[name](); } }").result.diagnostics.length, 0);
  assert.equal(analyze('class Base { static read() { return 1; } } class Child extends Base { static read(name) { return super[name](); } }').result.diagnostics.length, 0);
  assert.equal(analyze('class Base { read() { return 1; } } class Child extends Base { read(name) { return super[name]; } }').result.diagnostics.length, 0);
  assert.equal(analyze('class Base { static value = 1; } class Child extends Base { static read(name) { return super[name]; } }').result.diagnostics.length, 0);
});

test("semantic analysis validates private members", () => {
  assert.equal(analyze("class Box { #value = 1; #copy = this.#value; read(other) { return other.#value; } write(other, next) { other.#value = next; other.#value++; return other.#value; } }").result.diagnostics.length, 0);
  assert.equal(analyze("class Box { #value() { return 1; } }").result.diagnostics.length, 0);
  assert.equal(analyze("class Box { #value() { return 1; } call(other) { return other.#value(); } }").result.diagnostics.length, 0);

  assert.throws(() => analyzeModule(parse(createSourceText("var box = null; box.#value;")), createSourceText("var box = null; box.#value;")), /Jayess private member access is only valid inside methods or field initializers of the declaring class/);
  assert.throws(() => analyzeModule(parse(createSourceText("class Box { #value = 1; } class Reader { read(other) { return other.#value; } }")), createSourceText("class Box { #value = 1; } class Reader { read(other) { return other.#value; } }")), /Private member '#value' is not declared in class 'Reader'/);
  assert.throws(() => analyzeModule(parse(createSourceText("class Box { #value = 1; #value = 2; }")), createSourceText("class Box { #value = 1; #value = 2; }")), /Duplicate private field '#value' conflicts with existing private field in class 'Box'/);
  assert.throws(() => analyzeModule(parse(createSourceText("class Box { #value = 1; #value() { return 2; } }")), createSourceText("class Box { #value = 1; #value() { return 2; } }")), /Duplicate private method '#value' conflicts with existing private field in class 'Box'/);
  assert.ok(analyze("class Base { #value() { return 1; } } class Child extends Base { read(other) { return other.#value(); } }").result.diagnostics.some((diagnostic) => /Private member '#value' is not declared in class 'Child'/.test(diagnostic.message)));
  assert.ok(analyze("class Box { static #value = 1; read() { return this.#value; } }").result.diagnostics.some((diagnostic) => /Private static member '#value' must be accessed through the declaring class/.test(diagnostic.message)));
  assert.ok(analyze("class Box { #value = 1; static read() { return this.#value; } }").result.diagnostics.some((diagnostic) => /Private instance member '#value' must be accessed through an instance/.test(diagnostic.message)));
});

test("semantic analysis accepts class construction and member forms", () => {
  assert.equal(analyze("class Point { constructor(x, y) { this.x = x; this.y = y; } sum() { return this.x + this.y; } } var point = new Point(1, 2); point.sum();").result.diagnostics.length, 0);
  assert.equal(analyze("class Point { x = 1; y = this.x; sum() { return this.y; } } var point = new Point(); point.sum();").result.diagnostics.length, 0);
  assert.equal(analyze("class Point { static origin = 0; static make() { return new Point(); } x = Point.origin; } var point = Point.make(); point.x;").result.diagnostics.length, 0);
  assert.equal(analyze('var suffix = "Name"; class Point { static label = 1; ["field" + suffix] = Point.label; static { var ready = Point.label; } static ["make" + suffix]() { return new Point(); } }').result.diagnostics.length, 0);
});

test("semantic analysis resolves class-side scopes", () => {
  const computedSource = createSourceText('var suffix = "Name"; class Point { [suffix + missing] = 1; }');
  const computedAst = parse(computedSource);
  assert.throws(() => analyzeModule(computedAst, computedSource), /Undefined identifier 'missing'/);

  const staticBlockSource = createSourceText("class Point { static { var ready = 1; } } ready;");
  const staticBlockAst = parse(staticBlockSource);
  assert.throws(() => analyzeModule(staticBlockAst, staticBlockSource), /Undefined identifier 'ready'/);

  const thisSource = createSourceText("this;");
  const thisAst = parse(thisSource);
  assert.throws(() => analyzeModule(thisAst, thisSource), /Undefined identifier 'this'/);
});
