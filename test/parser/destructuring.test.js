import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "../../src/parser/parse.js";
import { createSourceText } from "../../src/source/source-text.js";

test("parser handles declaration destructuring patterns", () => {
  const ast = parse(
    createSourceText('var [left, right] = values; const { name, "score": total } = data;')
  );

  assert.equal(ast.body[0].declarations[0].id.type, "ArrayPattern");
  assert.equal(ast.body[0].declarations[0].id.elements[0].name, "left");
  assert.equal(ast.body[1].declarations[0].id.type, "ObjectPattern");
  assert.equal(ast.body[1].declarations[0].id.properties[0].value.name, "name");
  assert.equal(ast.body[1].declarations[0].id.properties[1].value.name, "total");
});

test("parser handles rest bindings in declaration destructuring", () => {
  const ast = parse(
    createSourceText("var [head, ...tail] = values; const { name, ...rest } = data;")
  );

  assert.equal(ast.body[0].declarations[0].id.elements[1].type, "RestElement");
  assert.equal(ast.body[0].declarations[0].id.elements[1].argument.name, "tail");
  assert.equal(ast.body[1].declarations[0].id.properties[1].type, "RestElement");
  assert.equal(ast.body[1].declarations[0].id.properties[1].argument.name, "rest");
});

test("parser handles nested declaration destructuring patterns", () => {
  const ast = parse(
    createSourceText('var [head, { value, nested: [left, right] }] = values; const { meta: { name }, "score": [first, ...rest] } = data;')
  );

  const firstPattern = ast.body[0].declarations[0].id;
  assert.equal(firstPattern.type, "ArrayPattern");
  assert.equal(firstPattern.elements[0].name, "head");
  assert.equal(firstPattern.elements[1].type, "ObjectPattern");
  assert.equal(firstPattern.elements[1].properties[0].value.name, "value");
  assert.equal(firstPattern.elements[1].properties[1].value.type, "ArrayPattern");
  assert.equal(firstPattern.elements[1].properties[1].value.elements[0].name, "left");
  assert.equal(firstPattern.elements[1].properties[1].value.elements[1].name, "right");

  const secondPattern = ast.body[1].declarations[0].id;
  assert.equal(secondPattern.type, "ObjectPattern");
  assert.equal(secondPattern.properties[0].value.type, "ObjectPattern");
  assert.equal(secondPattern.properties[0].value.properties[0].value.name, "name");
  assert.equal(secondPattern.properties[1].value.type, "ArrayPattern");
  assert.equal(secondPattern.properties[1].value.elements[0].name, "first");
  assert.equal(secondPattern.properties[1].value.elements[1].type, "RestElement");
  assert.equal(secondPattern.properties[1].value.elements[1].argument.name, "rest");
});

test("parser handles default values inside declaration destructuring patterns", () => {
  const ast = parse(
    createSourceText('var [head = 1, { value = 2, nested: [left = 3, right] = pair }] = values; const { meta: { name = "Jayess" } = info, "score": total = 0 } = data;')
  );

  const firstPattern = ast.body[0].declarations[0].id;
  assert.equal(firstPattern.elements[0].type, "AssignmentPattern");
  assert.equal(firstPattern.elements[0].left.name, "head");
  assert.equal(firstPattern.elements[0].right.kind, "number");
  assert.equal(firstPattern.elements[1].type, "ObjectPattern");
  assert.equal(firstPattern.elements[1].properties[0].value.type, "AssignmentPattern");
  assert.equal(firstPattern.elements[1].properties[0].value.left.name, "value");
  assert.equal(firstPattern.elements[1].properties[1].value.type, "AssignmentPattern");
  assert.equal(firstPattern.elements[1].properties[1].value.left.type, "ArrayPattern");
  assert.equal(firstPattern.elements[1].properties[1].value.left.elements[0].type, "AssignmentPattern");
  assert.equal(firstPattern.elements[1].properties[1].value.left.elements[0].left.name, "left");
  assert.equal(firstPattern.elements[1].properties[1].value.right.name, "pair");

  const secondPattern = ast.body[1].declarations[0].id;
  assert.equal(secondPattern.properties[0].value.type, "AssignmentPattern");
  assert.equal(secondPattern.properties[0].value.left.type, "ObjectPattern");
  assert.equal(secondPattern.properties[0].value.left.properties[0].value.type, "AssignmentPattern");
  assert.equal(secondPattern.properties[0].value.left.properties[0].value.left.name, "name");
  assert.equal(secondPattern.properties[0].value.right.name, "info");
  assert.equal(secondPattern.properties[1].value.type, "AssignmentPattern");
  assert.equal(secondPattern.properties[1].value.left.name, "total");
  assert.equal(secondPattern.properties[1].value.right.kind, "number");
});

test("parser handles assignment destructuring patterns", () => {
  const ast = parse(
    createSourceText('[head = 1, { value, nested: [left = 2, ...rest] } = fallback] = values; ({ meta: { name = "Jayess" } = info, "score": total = 0 } = data);')
  );

  const firstAssignment = ast.body[0].expression;
  assert.equal(firstAssignment.type, "AssignmentExpression");
  assert.equal(firstAssignment.operator, "=");
  assert.equal(firstAssignment.left.type, "ArrayPattern");
  assert.equal(firstAssignment.left.elements[0].type, "AssignmentPattern");
  assert.equal(firstAssignment.left.elements[0].left.name, "head");
  assert.equal(firstAssignment.left.elements[1].type, "AssignmentPattern");
  assert.equal(firstAssignment.left.elements[1].left.type, "ObjectPattern");
  assert.equal(firstAssignment.left.elements[1].left.properties[0].value.name, "value");
  assert.equal(firstAssignment.left.elements[1].left.properties[1].value.type, "ArrayPattern");
  assert.equal(firstAssignment.left.elements[1].left.properties[1].value.elements[0].type, "AssignmentPattern");
  assert.equal(firstAssignment.left.elements[1].left.properties[1].value.elements[0].left.name, "left");
  assert.equal(firstAssignment.left.elements[1].left.properties[1].value.elements[1].type, "RestElement");
  assert.equal(firstAssignment.left.elements[1].right.name, "fallback");

  const secondAssignment = ast.body[1].expression;
  assert.equal(secondAssignment.type, "AssignmentExpression");
  assert.equal(secondAssignment.operator, "=");
  assert.equal(secondAssignment.left.type, "ObjectPattern");
  assert.equal(secondAssignment.left.properties[0].value.type, "AssignmentPattern");
  assert.equal(secondAssignment.left.properties[0].value.left.type, "ObjectPattern");
  assert.equal(secondAssignment.left.properties[0].value.left.properties[0].value.type, "AssignmentPattern");
  assert.equal(secondAssignment.left.properties[0].value.left.properties[0].value.left.name, "name");
  assert.equal(secondAssignment.left.properties[0].value.right.name, "info");
  assert.equal(secondAssignment.left.properties[1].value.type, "AssignmentPattern");
  assert.equal(secondAssignment.left.properties[1].value.left.name, "total");
  assert.equal(secondAssignment.left.properties[1].value.right.kind, "number");
});

test("parser handles destructuring in for initializers", () => {
  const ast = parse(
    createSourceText('for (var [left = 1, { value, nested: [head, ...tail] }] = values; left; left = left - 1) { value; } for ({ meta: { name = "Jayess" } = info, "score": total = 0 } = data; total; total = total - 1) { name; }')
  );

  const firstLoop = ast.body[0];
  assert.equal(firstLoop.type, "ForStatement");
  assert.equal(firstLoop.init.type, "VariableDeclaration");
  assert.equal(firstLoop.init.declarations[0].id.type, "ArrayPattern");
  assert.equal(firstLoop.init.declarations[0].id.elements[0].type, "AssignmentPattern");
  assert.equal(firstLoop.init.declarations[0].id.elements[0].left.name, "left");
  assert.equal(firstLoop.init.declarations[0].id.elements[1].type, "ObjectPattern");
  assert.equal(firstLoop.init.declarations[0].id.elements[1].properties[0].value.name, "value");
  assert.equal(firstLoop.init.declarations[0].id.elements[1].properties[1].value.type, "ArrayPattern");
  assert.equal(firstLoop.init.declarations[0].id.elements[1].properties[1].value.elements[1].type, "RestElement");

  const secondLoop = ast.body[1];
  assert.equal(secondLoop.type, "ForStatement");
  assert.equal(secondLoop.init.type, "AssignmentExpression");
  assert.equal(secondLoop.init.left.type, "ObjectPattern");
  assert.equal(secondLoop.init.left.properties[0].value.type, "AssignmentPattern");
  assert.equal(secondLoop.init.left.properties[0].value.left.type, "ObjectPattern");
  assert.equal(secondLoop.init.left.properties[0].value.left.properties[0].value.type, "AssignmentPattern");
  assert.equal(secondLoop.init.left.properties[0].value.left.properties[0].value.left.name, "name");
  assert.equal(secondLoop.init.left.properties[1].value.type, "AssignmentPattern");
  assert.equal(secondLoop.init.left.properties[1].value.left.name, "total");
});

test("parser handles destructured parameters", () => {
  const ast = parse(
    createSourceText("function pick(fallback, [first, second = 2] = fallback, {name, meta: {id}}, ...[tail]) { return first; } var read = ({value}) => value;")
  );

  const fn = ast.body[0];
  assert.equal(fn.params[1].id.type, "ArrayPattern");
  assert.equal(fn.params[1].id.elements[1].type, "AssignmentPattern");
  assert.equal(fn.params[1].defaultValue.name, "fallback");
  assert.equal(fn.params[2].id.type, "ObjectPattern");
  assert.equal(fn.params[2].id.properties[1].value.type, "ObjectPattern");
  assert.equal(fn.params[3].rest, true);
  assert.equal(fn.params[3].id.type, "ArrayPattern");
  assert.equal(ast.body[1].declarations[0].init.params[0].id.type, "ObjectPattern");
});

test("parser handles array elisions in destructuring patterns", () => {
  const ast = parse(createSourceText("var [left, , right] = values; ([, value] = values); ({ name: target.value } = data);"));
  const declarationPattern = ast.body[0].declarations[0].id;
  const assignmentPattern = ast.body[1].expression.left;
  const memberPattern = ast.body[2].expression.left;

  assert.equal(declarationPattern.elements[0].name, "left");
  assert.equal(declarationPattern.elements[1], null);
  assert.equal(declarationPattern.elements[2].name, "right");
  assert.equal(assignmentPattern.elements[0], null);
  assert.equal(assignmentPattern.elements[1].name, "value");
  assert.equal(memberPattern.properties[0].value.type, "MemberExpression");
});

test("parser rejects unsupported destructuring forms clearly", () => {
  assert.throws(
    () => parse(createSourceText("var { value };")),
    /Destructuring declarations require an initializer/
  );
});
