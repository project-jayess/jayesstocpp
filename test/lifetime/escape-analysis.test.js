import test from "node:test";
import assert from "node:assert/strict";
import { analyzeEscapes } from "../../src/lifetime/analyze-escapes.js";
import { parse } from "../../src/parser/parse.js";
import { createSourceText } from "../../src/source/source-text.js";
import { analyzeModule } from "../../src/semantic/analyze.js";

test("escape analysis marks returned identifiers as escaping", () => {
  const ast = parse(createSourceText("function run(x) { return x; }"));
  const result = analyzeEscapes(ast);
  assert.equal(result.escaping.has("x"), true);
});

test("escape analysis marks exported bindings as escaping", () => {
  const ast = parse(createSourceText("export var answer = 42;"));
  const result = analyzeEscapes(ast);
  assert.equal(result.escaping.has("answer"), true);
});

test("escape analysis leaves local-only bindings non-escaping", () => {
  const ast = parse(createSourceText("var local = 1;"));
  const result = analyzeEscapes(ast);
  assert.equal(result.escaping.has("local"), false);
});

test("escape analysis marks identifiers retained inside returned containers as escaping", () => {
  const ast = parse(createSourceText('function run(x, y) { return { value: x, items: [y] }; }'));
  const result = analyzeEscapes(ast);
  assert.equal(result.escaping.has("x"), true);
  assert.equal(result.escaping.has("y"), true);
});

test("escape analysis marks identifiers retained through returned array spread as escaping", () => {
  const ast = parse(createSourceText("function run(items) { return [...items, 1]; }"));
  const result = analyzeEscapes(ast);
  assert.equal(result.escaping.has("items"), true);
});

test("escape analysis marks identifiers retained through returned object spread as escaping", () => {
  const ast = parse(createSourceText("function run(base) { return { ...base, answer: 1 }; }"));
  const result = analyzeEscapes(ast);
  assert.equal(result.escaping.has("base"), true);
});

test("escape analysis marks captured closure values as escaping", () => {
  const sourceText = createSourceText("function outer(x) { return function(y) { return x + y; }; }");
  const ast = parse(sourceText);
  ast.body[0].body.body[0].argument.captures = ["x"];
  const result = analyzeEscapes(ast);
  assert.equal(result.escaping.has("x"), true);
});

test("escape analysis marks closure captures of block-scoped var bindings as escaping", () => {
  const sourceText = createSourceText("function outer() { if (true) { var x = 1; return function() { return x; }; } return null; }");
  const ast = parse(sourceText);
  analyzeModule(ast, sourceText, { throwOnError: false });
  const result = analyzeEscapes(ast);
  assert.equal(result.escaping.has("x"), true);
});

test("escape analysis marks named default-exported declarations as escaping", () => {
  const ast = parse(createSourceText("export default function add(a, b) { return a + b; }"));
  const result = analyzeEscapes(ast);
  assert.equal(result.escaping.has("add"), true);
});

test("escape analysis marks values assigned into members as escaping", () => {
  const ast = parse(createSourceText("function run(x, y) { var data = { items: [0] }; data.value = x; data.items[0] = y; return 0; }"));
  const result = analyzeEscapes(ast);
  assert.equal(result.escaping.has("x"), true);
  assert.equal(result.escaping.has("y"), true);
});

test("escape analysis marks captures from named function expressions as escaping", () => {
  const sourceText = createSourceText("function outer(x) { var make = function inner(y) { return x + y; }; return make; }");
  const ast = parse(sourceText);
  analyzeModule(ast, sourceText, { throwOnError: false });
  const result = analyzeEscapes(ast);
  assert.equal(result.escaping.has("x"), true);
});

test("escape analysis marks captures from arrow functions as escaping", () => {
  const sourceText = createSourceText("class Counter { value = 1; make(step) { return (delta = step) => this.value + delta; } }");
  const ast = parse(sourceText);
  analyzeModule(ast, sourceText, { throwOnError: false });
  const result = analyzeEscapes(ast);
  assert.equal(result.escaping.has("step"), true);
  assert.equal(result.escaping.has("this"), true);
});

test("escape analysis marks captures from async function expressions as escaping", () => {
  const sourceText = createSourceText("function outer(x) { var declared = async function run(y) { return await x + y; }; return declared; }");
  const ast = parse(sourceText);
  analyzeModule(ast, sourceText, { throwOnError: false });
  const result = analyzeEscapes(ast);
  assert.equal(result.escaping.has("x"), true);
});

test("escape analysis marks captures from async arrows as escaping", () => {
  const sourceText = createSourceText("function outer(x) { var grouped = async (delta = x) => await x + delta; return grouped; }");
  const ast = parse(sourceText);
  analyzeModule(ast, sourceText, { throwOnError: false });
  const result = analyzeEscapes(ast);
  assert.equal(result.escaping.has("x"), true);
});

test("escape analysis marks generator captures that outlive the defining scope", () => {
  const sourceText = createSourceText("function outer(x) { var make = function* run(y) { yield x + y; }; return make; }");
  const ast = parse(sourceText);
  analyzeModule(ast, sourceText, { throwOnError: false });
  const result = analyzeEscapes(ast);
  assert.equal(result.escaping.has("x"), true);
});

test("escape analysis marks async captures that settle after the defining scope", () => {
  const sourceText = createSourceText("function outer(x) { return async function run() { return await x; }; }");
  const ast = parse(sourceText);
  analyzeModule(ast, sourceText, { throwOnError: false });
  const result = analyzeEscapes(ast);
  assert.equal(result.escaping.has("x"), true);
});

test("escape analysis marks class method closure context values as escaping", () => {
  const sourceText = createSourceText("function build(secret) { class Box { static #seed = secret; #value = secret; read() { return this.#value + Box.#seed; } } return Box; }");
  const ast = parse(sourceText);
  analyzeModule(ast, sourceText, { throwOnError: false });
  const result = analyzeEscapes(ast);
  assert.equal(result.escaping.has("secret"), true);
  assert.equal(result.escaping.has("Box"), true);
});

test("escape analysis marks thread worker handoff values as escaping", () => {
  const sourceText = createSourceText("function run(x) { var worker = () => x; var handle = spawn(worker, [x]); return handle; }");
  const ast = parse(sourceText);
  analyzeModule(ast, sourceText, { throwOnError: false });
  const result = analyzeEscapes(ast);
  assert.equal(result.escaping.has("worker"), true);
  assert.equal(result.escaping.has("x"), true);
});

test("escape analysis marks module-exported closures and classes as escaping", () => {
  const sourceText = createSourceText("export var make = function(value) { return () => value; }; export class Box { value = 1; }");
  const ast = parse(sourceText);
  analyzeModule(ast, sourceText, { throwOnError: false });
  const result = analyzeEscapes(ast);
  assert.equal(result.escaping.has("make"), true);
  assert.equal(result.escaping.has("Box"), true);
});

test("escape analysis marks module exports exposing initializer-scope values as escaping", () => {
  const sourceText = createSourceText("var value = 1; export var read = function() { return value; };");
  const ast = parse(sourceText);
  analyzeModule(ast, sourceText, { throwOnError: false });
  const result = analyzeEscapes(ast);
  assert.equal(result.escaping.has("read"), true);
  assert.equal(result.escaping.has("value"), true);
});

test("escape analysis marks class field initializer values as escaping", () => {
  const sourceText = createSourceText("function build(x) { class Box { value = x; } return new Box(); }");
  const ast = parse(sourceText);
  const result = analyzeEscapes(ast);
  assert.equal(result.escaping.has("x"), true);
});

test("escape analysis marks returned logical operands as escaping", () => {
  const ast = parse(createSourceText("function run(left, right) { return left || right; }"));
  const result = analyzeEscapes(ast);
  assert.equal(result.escaping.has("left"), true);
  assert.equal(result.escaping.has("right"), true);
});

test("escape analysis walks template-literal interpolation expressions without marking identifiers as retained", () => {
  const ast = parse(createSourceText("function run(name) { return `Hello ${name}!`; }"));
  const result = analyzeEscapes(ast);
  assert.equal(result.escaping.has("name"), false);
});

test("escape analysis marks values pushed into arrays as escaping", () => {
  const ast = parse(createSourceText("function run(x) { var items = []; items.push(x); return 0; }"));
  const result = analyzeEscapes(ast);
  assert.equal(result.escaping.has("x"), true);
});

test("escape analysis marks thrown identifiers as escaping", () => {
  const ast = parse(createSourceText("function run(errorValue) { throw errorValue; }"));
  const result = analyzeEscapes(ast);
  assert.equal(result.escaping.has("errorValue"), true);
});
