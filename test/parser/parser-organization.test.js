import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "../../src/parser/parse.js";
import { createSourceText } from "../../src/source/source-text.js";

test("parser helper split preserves binding pattern AST shapes", () => {
  const ast = parse(createSourceText(
    'var [head = 1, { value, nested: [left, ...rest] }] = values; const { "score": total = 0 } = data;'
  ));

  const arrayPattern = ast.body[0].declarations[0].id;
  assert.equal(arrayPattern.type, "ArrayPattern");
  assert.equal(arrayPattern.elements[0].type, "AssignmentPattern");
  assert.equal(arrayPattern.elements[1].type, "ObjectPattern");
  assert.equal(arrayPattern.elements[1].properties[1].value.type, "ArrayPattern");
  assert.equal(arrayPattern.elements[1].properties[1].value.elements[1].type, "RestElement");

  const objectPattern = ast.body[1].declarations[0].id;
  assert.equal(objectPattern.type, "ObjectPattern");
  assert.equal(objectPattern.properties[0].key.kind, "string");
  assert.equal(objectPattern.properties[0].value.type, "AssignmentPattern");
});

test("parser helper split preserves import and export AST shapes", () => {
  const ast = parse(createSourceText(`
    import value, { named as alias } from "pkg";
    export { alias as renamed };
    export * from "other";
    export default value;
  `));

  assert.equal(ast.body[0].type, "ImportDeclaration");
  assert.equal(ast.body[0].specifiers[0].kind, "default");
  assert.equal(ast.body[0].specifiers[1].imported, "named");
  assert.equal(ast.body[0].specifiers[1].local, "alias");
  assert.equal(ast.body[1].type, "ExportNamedDeclaration");
  assert.equal(ast.body[1].specifiers[0].exportedName, "renamed");
  assert.equal(ast.body[2].type, "ExportAllDeclaration");
  assert.equal(ast.body[3].type, "ExportDefaultDeclaration");
});

test("parser helper split preserves focused syntax diagnostics", () => {
  assert.throws(
    () => parse(createSourceText("var [head, , tail] = values;")),
    /Array destructuring elisions are not supported/
  );

  assert.throws(
    () => parse(createSourceText('export * "pkg";')),
    /Malformed export-all declaration: expected 'from' before the source string/
  );
});
