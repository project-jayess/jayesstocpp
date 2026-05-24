import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "../../src/parser/parse.js";
import { createSourceText } from "../../src/source/source-text.js";

test("parser handles async function declarations and await expressions", () => {
  const ast = parse(
    createSourceText("async function run(value) { return await value; } export default async function load(item) { return await item; }")
  );

  assert.equal(ast.body[0].type, "FunctionDeclaration");
  assert.equal(ast.body[0].async, true);
  assert.equal(ast.body[0].body.body[0].argument.type, "AwaitExpression");
  assert.equal(ast.body[1].type, "ExportDefaultDeclaration");
  assert.equal(ast.body[1].declaration.type, "FunctionDeclaration");
  assert.equal(ast.body[1].declaration.async, true);
});

test("parser handles async function expressions and async arrow functions", () => {
  const ast = parse(
    createSourceText("var declared = async function run(value) { return await value; }; var unary = async value => await value; var grouped = async (left, right = 1) => { return await left; };")
  );

  assert.equal(ast.body[0].type, "VariableDeclaration");
  assert.equal(ast.body[0].declarations[0].init.type, "FunctionExpression");
  assert.equal(ast.body[0].declarations[0].init.async, true);
  assert.equal(ast.body[0].declarations[0].init.id.name, "run");
  assert.equal(ast.body[0].declarations[0].init.body.body[0].argument.type, "AwaitExpression");

  assert.equal(ast.body[1].declarations[0].init.type, "ArrowFunctionExpression");
  assert.equal(ast.body[1].declarations[0].init.async, true);
  assert.equal(ast.body[1].declarations[0].init.params[0].name, "value");
  assert.equal(ast.body[1].declarations[0].init.body.type, "AwaitExpression");

  assert.equal(ast.body[2].declarations[0].init.type, "ArrowFunctionExpression");
  assert.equal(ast.body[2].declarations[0].init.async, true);
  assert.equal(ast.body[2].declarations[0].init.params[1].defaultValue.kind, "number");
  assert.equal(ast.body[2].declarations[0].init.body.type, "BlockStatement");
});

test("parser handles async class methods and rejects async constructors", () => {
  const ast = parse(createSourceText("class Worker { async run(value) { return await value; } async() { return 1; } }"));
  const declaration = ast.body[0];

  assert.equal(declaration.methods[0].type, "MethodDefinition");
  assert.equal(declaration.methods[0].key.name, "run");
  assert.equal(declaration.methods[0].async, true);
  assert.equal(declaration.methods[0].body.body[0].argument.type, "AwaitExpression");
  assert.equal(declaration.methods[1].key.name, "async");
  assert.equal(declaration.methods[1].async, false);

  assert.throws(
    () => parse(createSourceText("class Worker { async constructor(value) { return await value; } }")),
    /Jayess does not support async constructors/
  );
});

test("parser handles generator declarations, generator expressions, and yield forms", () => {
  const ast = parse(
    createSourceText("function* run(items) { yield items; return yield* items; } var make = function* named() { yield value; };")
  );

  assert.equal(ast.body[0].type, "FunctionDeclaration");
  assert.equal(ast.body[0].generator, true);
  assert.equal(ast.body[0].body.body[0].expression.type, "YieldExpression");
  assert.equal(ast.body[0].body.body[0].expression.delegate, false);
  assert.equal(ast.body[0].body.body[1].argument.type, "YieldExpression");
  assert.equal(ast.body[0].body.body[1].argument.delegate, true);
  assert.equal(ast.body[1].declarations[0].init.type, "FunctionExpression");
  assert.equal(ast.body[1].declarations[0].init.generator, true);
});

test("parser handles supported generator declaration state flow", () => {
  const ast = parse(
    createSourceText("function* run(input) { var first = yield input; yield* input; return first; }")
  );

  const declaration = ast.body[0];
  assert.equal(declaration.type, "FunctionDeclaration");
  assert.equal(declaration.generator, true);
  assert.equal(declaration.body.body[0].type, "VariableDeclaration");
  assert.equal(declaration.body.body[0].declarations[0].init.type, "YieldExpression");
  assert.equal(declaration.body.body[0].declarations[0].init.delegate, false);
  assert.equal(declaration.body.body[1].type, "ExpressionStatement");
  assert.equal(declaration.body.body[1].expression.type, "YieldExpression");
  assert.equal(declaration.body.body[1].expression.delegate, true);
  assert.equal(declaration.body.body[2].type, "ReturnStatement");
});

test("parser handles generator class methods", () => {
  const ast = parse(createSourceText("class Point { *items(value) { yield value; return yield* value; } static *all(value) { yield value; } }"));
  const declaration = ast.body[0];

  assert.equal(declaration.methods[0].type, "MethodDefinition");
  assert.equal(declaration.methods[0].key.name, "items");
  assert.equal(declaration.methods[0].generator, true);
  assert.equal(declaration.methods[0].static, false);
  assert.equal(declaration.methods[0].body.body[0].expression.type, "YieldExpression");
  assert.equal(declaration.methods[0].body.body[1].argument.delegate, true);
  assert.equal(declaration.methods[1].key.name, "all");
  assert.equal(declaration.methods[1].generator, true);
  assert.equal(declaration.methods[1].static, true);

  assert.throws(
    () => parse(createSourceText("class Point { *constructor() { yield 1; } }")),
    /Jayess does not support generator constructors/
  );
});
