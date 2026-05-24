import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "../../src/parser/parse.js";
import { createSourceText } from "../../src/source/source-text.js";

test("parser builds imports exports and functions", () => {
  const ast = parse(
    createSourceText(`
      import { add } from "./math.js";
      export function run(a, b) { return add(a, b); }
    `)
  );

  assert.equal(ast.body[0].type, "ImportDeclaration");
  assert.equal(ast.body[1].type, "ExportNamedDeclaration");
  assert.equal(ast.body[1].declaration.type, "FunctionDeclaration");
});

test("parser handles re-exports", () => {
  const ast = parse(
    createSourceText('export { add as sum } from "./math.js"; export { add as localSum }; export * from "./other.js";')
  );

  assert.equal(ast.body[0].type, "ExportNamedDeclaration");
  assert.equal(ast.body[0].source, "./math.js");
  assert.equal(ast.body[1].type, "ExportNamedDeclaration");
  assert.equal(ast.body[1].source, null);
  assert.equal(ast.body[2].type, "ExportAllDeclaration");
});

test("parser handles namespace imports and member access", () => {
  const ast = parse(
    createSourceText('import * as math from "./math.js"; math.add(1, 2);')
  );

  assert.equal(ast.body[0].type, "ImportDeclaration");
  assert.equal(ast.body[0].specifiers[0].kind, "namespace");
  assert.equal(ast.body[1].expression.callee.type, "MemberExpression");
});

test("parser handles anonymous default-exported functions", () => {
  const ast = parse(
    createSourceText("export default function(a, b) { return a + b; }")
  );

  assert.equal(ast.body[0].type, "ExportDefaultDeclaration");
  assert.equal(ast.body[0].declaration.type, "FunctionExpression");
});

test("parser reports malformed input", () => {
  assert.throws(
    () => parse(createSourceText("function add(a, b { return a + b; }")),
    /Expected '\)' after parameters/
  );
});
