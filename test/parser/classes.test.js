import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "../../src/parser/parse.js";
import { createSourceText } from "../../src/source/source-text.js";

test("parser handles derived classes and super expressions", () => {
  const ast = parse(
    createSourceText("class Child extends Base { constructor(value) { super(value); } method() { return super.name; } }")
  );

  const declaration = ast.body[0];
  assert.equal(declaration.type, "ClassDeclaration");
  assert.equal(declaration.id.name, "Child");
  assert.equal(declaration.base.type, "Identifier");
  assert.equal(declaration.base.name, "Base");
  assert.equal(declaration.methods[0].kind, "constructor");
  assert.equal(declaration.methods[0].body.body[0].expression.type, "CallExpression");
  assert.equal(declaration.methods[0].body.body[0].expression.callee.type, "SuperExpression");
  assert.equal(declaration.methods[1].body.body[0].argument.type, "MemberExpression");
  assert.equal(declaration.methods[1].body.body[0].argument.object.type, "SuperExpression");
  assert.equal(declaration.methods[1].body.body[0].argument.property.name, "name");
});

test("parser preserves computed super member calls", () => {
  const ast = parse(
    createSourceText("class Child extends Base { method(name) { return super[name](); } }")
  );

  const superMember = ast.body[0].methods[0].body.body[0].argument.callee;
  assert.equal(superMember.type, "MemberExpression");
  assert.equal(superMember.object.type, "SuperExpression");
  assert.equal(superMember.computed, true);
  assert.equal(superMember.property.name, "name");
});

test("parser handles private fields and private member access", () => {
  const ast = parse(
    createSourceText("class Point { #value = 1; value() { return this.#value; } }")
  );

  const declaration = ast.body[0];
  assert.equal(declaration.type, "ClassDeclaration");
  assert.equal(declaration.methods[0].type, "ClassFieldDefinition");
  assert.equal(declaration.methods[0].key.type, "PrivateIdentifier");
  assert.equal(declaration.methods[0].key.name, "value");
  assert.equal(declaration.methods[1].type, "MethodDefinition");
  assert.equal(declaration.methods[1].body.body[0].argument.type, "MemberExpression");
  assert.equal(declaration.methods[1].body.body[0].argument.object.type, "ThisExpression");
  assert.equal(declaration.methods[1].body.body[0].argument.property.type, "PrivateIdentifier");
  assert.equal(declaration.methods[1].body.body[0].argument.property.name, "value");
  assert.equal(declaration.methods[1].body.body[0].argument.computed, false);
});

test("parser handles private instance and static members", () => {
  const ast = parse(createSourceText("class Point { #value() { return 1; } static #count = 0; static #next() { return Point.#count; } }"));
  const declaration = ast.body[0];
  assert.equal(declaration.methods[0].type, "MethodDefinition");
  assert.equal(declaration.methods[0].key.type, "PrivateIdentifier");
  assert.equal(declaration.methods[0].key.name, "value");
  assert.equal(declaration.methods[1].type, "ClassFieldDefinition");
  assert.equal(declaration.methods[1].static, true);
  assert.equal(declaration.methods[1].key.name, "count");
  assert.equal(declaration.methods[2].type, "MethodDefinition");
  assert.equal(declaration.methods[2].static, true);
  assert.equal(declaration.methods[2].key.name, "next");
});

test("parser handles computed class members and static initialization blocks", () => {
  const ast = parse(
    createSourceText('class Point { ["x"]() { return 1; } static { var ready = 1; } static ["y"] = 2; }')
  );

  const declaration = ast.body[0];
  assert.equal(declaration.type, "ClassDeclaration");
  assert.equal(declaration.methods[0].type, "MethodDefinition");
  assert.equal(declaration.methods[0].computed, true);
  assert.equal(declaration.methods[0].static, false);
  assert.equal(declaration.methods[0].key.type, "Literal");
  assert.equal(declaration.methods[0].key.value, "x");

  assert.equal(declaration.methods[1].type, "StaticInitializationBlock");
  assert.equal(declaration.methods[1].static, true);
  assert.equal(declaration.methods[1].body.type, "BlockStatement");

  assert.equal(declaration.methods[2].type, "ClassFieldDefinition");
  assert.equal(declaration.methods[2].computed, true);
  assert.equal(declaration.methods[2].static, true);
  assert.equal(declaration.methods[2].key.type, "Literal");
  assert.equal(declaration.methods[2].key.value, "y");
});

test("parser rejects malformed computed class member syntax clearly", () => {
  assert.throws(
    () => parse(createSourceText("class Point { [name() { return 1; } }")),
    /Expected '\]' after computed class member name/
  );
});

test("parser handles class declarations and new expressions", () => {
  const ast = parse(
    createSourceText("class Point { constructor(x, y) { this.x = x; this.y = y; } sum() { return this.x + this.y; } } var point = new Point(1, 2); point.sum();")
  );

  assert.equal(ast.body[0].type, "ClassDeclaration");
  assert.equal(ast.body[0].methods[0].kind, "constructor");
  assert.equal(ast.body[0].methods[1].key.name, "sum");
  assert.equal(ast.body[1].declarations[0].init.type, "NewExpression");
});

test("parser handles class field declarations", () => {
  const ast = parse(
    createSourceText("class Point { x = 1; y; sum() { return this.x; } }")
  );

  assert.equal(ast.body[0].methods[0].type, "ClassFieldDefinition");
  assert.equal(ast.body[0].methods[0].key.name, "x");
  assert.equal(ast.body[0].methods[1].type, "ClassFieldDefinition");
  assert.equal(ast.body[0].methods[2].type, "MethodDefinition");
});

test("parser handles static class members", () => {
  const ast = parse(
    createSourceText("class Point { static origin = 0; static make() { return new Point(); } }")
  );

  assert.equal(ast.body[0].methods[0].type, "ClassFieldDefinition");
  assert.equal(ast.body[0].methods[0].static, true);
  assert.equal(ast.body[0].methods[1].type, "MethodDefinition");
  assert.equal(ast.body[0].methods[1].static, true);
});

test("parser handles default-exported class declarations", () => {
  const ast = parse(
    createSourceText("export default class Point { sum() { return 1; } }")
  );

  assert.equal(ast.body[0].type, "ExportDefaultDeclaration");
  assert.equal(ast.body[0].declaration.type, "ClassDeclaration");
});

test("parser handles anonymous default-exported classes", () => {
  const ast = parse(
    createSourceText("export default class { sum() { return 1; } }")
  );

  assert.equal(ast.body[0].type, "ExportDefaultDeclaration");
  assert.equal(ast.body[0].declaration.type, "ClassDeclaration");
  assert.equal(ast.body[0].declaration.id, null);
});
