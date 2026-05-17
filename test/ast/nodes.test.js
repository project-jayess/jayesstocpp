import test from "node:test";
import assert from "node:assert/strict";
import {
  blockStatement,
  callExpression,
  classDeclaration,
  classFieldDefinition,
  identifier,
  memberExpression,
  methodDefinition,
  privateIdentifier,
  staticInitializationBlock,
  superExpression
} from "../../src/ast/nodes.js";

test("class declaration nodes carry an optional base class slot", () => {
  const node = classDeclaration(
    identifier("Child", 0, 5),
    identifier("Base", 14, 18),
    [],
    0,
    20,
    false
  );

  assert.equal(node.type, "ClassDeclaration");
  assert.equal(node.id.name, "Child");
  assert.equal(node.base.name, "Base");
});

test("super expression nodes can participate in constructor calls and member lookups", () => {
  const superNode = superExpression(0, 5);
  const superCall = callExpression(superNode, [], 0, 7);
  const superMember = memberExpression(superNode, identifier("method", 6, 12), 0, 12, false);

  assert.equal(superNode.type, "SuperExpression");
  assert.equal(superCall.callee.type, "SuperExpression");
  assert.equal(superMember.object.type, "SuperExpression");
  assert.equal(superMember.property.name, "method");
});

test("private field declaration nodes use private identifiers as keys", () => {
  const key = privateIdentifier("value", 6, 12);
  const field = classFieldDefinition(key, null, 6, 12, false);

  assert.equal(key.type, "PrivateIdentifier");
  assert.equal(key.name, "value");
  assert.equal(field.type, "ClassFieldDefinition");
  assert.equal(field.key.type, "PrivateIdentifier");
  assert.equal(field.key.name, "value");
});

test("private member access nodes reuse member-expression shape with private identifiers", () => {
  const object = identifier("this", 0, 4);
  const property = privateIdentifier("value", 5, 11);
  const access = memberExpression(object, property, 0, 11, false);

  assert.equal(access.type, "MemberExpression");
  assert.equal(access.object.name, "this");
  assert.equal(access.property.type, "PrivateIdentifier");
  assert.equal(access.property.name, "value");
  assert.equal(access.computed, false);
});

test("computed class field and method nodes carry an explicit computed flag", () => {
  const computedKey = identifier("nameExpr", 1, 9);
  const field = classFieldDefinition(computedKey, null, 0, 10, false, true);
  const methodBody = blockStatement([], 11, 13);
  const method = methodDefinition(computedKey, [], methodBody, 0, 13, "method", true, true);

  assert.equal(field.type, "ClassFieldDefinition");
  assert.equal(field.computed, true);
  assert.equal(field.static, false);
  assert.equal(field.key.name, "nameExpr");

  assert.equal(method.type, "MethodDefinition");
  assert.equal(method.computed, true);
  assert.equal(method.static, true);
  assert.equal(method.key.name, "nameExpr");
});

test("static initialization block nodes carry their block body and static marker", () => {
  const body = blockStatement([], 8, 10);
  const block = staticInitializationBlock(body, 1, 10);

  assert.equal(block.type, "StaticInitializationBlock");
  assert.equal(block.static, true);
  assert.equal(block.body.type, "BlockStatement");
});
