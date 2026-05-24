import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "../../src/parser/parse.js";
import { createSourceText } from "../../src/source/source-text.js";
import { analyzeModule } from "../../src/semantic/analyze.js";

function analyze(source) {
  const sourceText = createSourceText(source);
  const ast = parse(sourceText);
  return analyzeModule(ast, sourceText, { throwOnError: false });
}

test("semantic analysis accepts declaration destructuring", () => {
  const result = analyze('var values = [1, 2]; var data = { name: "jayess", score: 3 }; var [left, right] = values; const { name, score: total } = data;');
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis accepts array elisions in destructuring", () => {
  const result = analyze("var values = [1, 2, 3]; var [first, , third] = values; function pick([, value]) { return value; } ([, third] = values);");
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis accepts member targets in assignment destructuring", () => {
  const result = analyze("var values = [1, 2]; var target = { value: 0 }; [target.value, target[\"other\"]] = values;");
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis reports unsupported destructuring target shapes", () => {
  const sourceText = createSourceText("var values = [1]; [value] = values;");
  const ast = parse(sourceText);
  ast.body[1].expression.left.elements[0] = ast.body[0].declarations[0].init.elements[0];

  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.match(result.diagnostics[0].message, /Unsupported destructuring target/);
});

test("semantic analysis accepts rest bindings in declaration destructuring", () => {
  const result = analyze('var values = [1, 2, 3]; var data = { name: "jayess", score: 3, level: 4 }; var [head, ...tail] = values; const { name, ...rest } = data;');
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis accepts destructured parameters", () => {
  const result = analyze("function pick(prefix, [first, second = prefix], {name, meta: {id}}) { return first + second + name + id; } var read = ({value}) => value;");
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis rejects duplicate destructured parameter names", () => {
  const sourceText = createSourceText("function pick([value], {value}) { return value; }");
  const ast = parse(sourceText);
  assert.throws(() => analyzeModule(ast, sourceText), /Duplicate declaration 'value'/);
});

test("semantic analysis rejects duplicate destructuring bindings and accepts for-loop destructuring", () => {
  const duplicateSource = createSourceText("var values = [1, 2]; var [left, left] = values;");
  const duplicateAst = parse(duplicateSource);
  assert.throws(() => analyzeModule(duplicateAst, duplicateSource), /Duplicate declaration 'left'/);

  const result = analyze("var values = [1, 2]; for (var [left = 1, { right }] = values; left; left = left - 1) { right; }");
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis enforces destructuring default-value binding order", () => {
  const validResult = analyze("var values = [null, null]; var [left = 1, right = left] = values;");
  assert.equal(validResult.diagnostics.length, 0);

  const invalidSource = createSourceText("var values = [null, null]; var [left = right, right = 1] = values;");
  const invalidAst = parse(invalidSource);
  assert.throws(() => analyzeModule(invalidAst, invalidSource), /Undefined identifier 'right'/);
});

test("semantic analysis rejects const targets in destructuring assignment", () => {
  const sourceText = createSourceText("const left = 1; [left] = values;");
  const ast = parse(sourceText);
  assert.throws(() => analyzeModule(ast, sourceText), /Cannot reassign const 'left'/);
});
