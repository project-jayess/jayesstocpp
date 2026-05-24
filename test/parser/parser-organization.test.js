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
  const ast = parse(createSourceText("var [head, , tail] = values;"));
  assert.equal(ast.body[0].declarations[0].id.elements[1], null);

  assert.throws(
    () => parse(createSourceText('export * "pkg";')),
    /Malformed export-all declaration: expected 'from' before the source string/
  );
});

test("parser class helper split preserves class member AST shapes", () => {
  const ast = parse(createSourceText(`
    class Example extends Base {
      static { touch(); }
      static value = 1;
      #secret = 2;
      *items(seed) { yield seed; }
      async read(name = "x", ...rest) { return rest; }
      [computed]() { return this.#secret; }
    }
  `));

  const body = ast.body[0].methods;
  assert.equal(body[0].type, "StaticInitializationBlock");
  assert.equal(body[1].type, "ClassFieldDefinition");
  assert.equal(body[1].static, true);
  assert.equal(body[2].key.type, "PrivateIdentifier");
  assert.equal(body[3].generator, true);
  assert.equal(body[4].async, true);
  assert.equal(body[4].params[0].defaultValue.kind, "string");
  assert.equal(body[4].params[1].rest, true);
  assert.equal(body[5].computed, true);
});

test("parser function helper split preserves parameter AST shapes", () => {
  const ast = parse(createSourceText(`
    function fn(first, second = 2, ...rest) { return rest; }
    const arrow = (value = 1, ...others) => others;
  `));

  const fn = ast.body[0];
  assert.equal(fn.params[0].name, "first");
  assert.equal(fn.params[1].defaultValue.value, 2);
  assert.equal(fn.params[2].rest, true);

  const arrow = ast.body[1].declarations[0].init;
  assert.equal(arrow.params[0].defaultValue.value, 1);
  assert.equal(arrow.params[1].rest, true);
});

test("parser expression helper split preserves precedence and call AST shapes", () => {
  const ast = parse(createSourceText(`
    var value = target?.items?.(first, ...rest) ?? fallback ? left ** right ** third : new Box(seed);
  `));

  const expression = ast.body[0].declarations[0].init;
  assert.equal(expression.type, "ConditionalExpression");
  assert.equal(expression.test.type, "BinaryExpression");
  assert.equal(expression.test.operator, "??");
  assert.equal(expression.test.left.type, "OptionalCallExpression");
  assert.equal(expression.test.left.callee.type, "OptionalMemberExpression");
  assert.equal(expression.test.left.callee.property.name, "items");
  assert.equal(expression.test.left.arguments[1].type, "SpreadElement");
  assert.equal(expression.consequent.type, "BinaryExpression");
  assert.equal(expression.consequent.operator, "**");
  assert.equal(expression.consequent.right.operator, "**");
  assert.equal(expression.alternate.type, "NewExpression");
});

test("parser statement helper split preserves control-flow AST shapes", () => {
  const ast = parse(createSourceText(`
    while (ready) {
      try {
        if (next) { continue; }
        throw problem;
      } catch (error) {
        break;
      } finally {
        cleanup();
      }
    }
  `));

  const loop = ast.body[0];
  assert.equal(loop.type, "WhileStatement");
  const body = loop.body.body;
  assert.equal(body[0].type, "TryStatement");
  assert.equal(body[0].block.body[0].type, "IfStatement");
  assert.equal(body[0].block.body[0].consequent.body[0].type, "ContinueStatement");
  assert.equal(body[0].block.body[1].type, "ThrowStatement");
  assert.equal(body[0].handler.body.body[0].type, "BreakStatement");
  assert.equal(body[0].finalizer.body[0].type, "ExpressionStatement");
});
