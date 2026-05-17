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

test("parser handles while and for loops", () => {
  const ast = parse(
    createSourceText("while (1) { break; } for (var i = 0; i < 3; i = i + 1) { continue; }")
  );

  assert.equal(ast.body[0].type, "WhileStatement");
  assert.equal(ast.body[0].body.type, "BlockStatement");
  assert.equal(ast.body[1].type, "ForStatement");
  assert.equal(ast.body[1].init.type, "VariableDeclaration");
  assert.equal(ast.body[1].body.type, "BlockStatement");
});

test("parser handles do-while loops", () => {
  const ast = parse(
    createSourceText("do { break; } while (1);")
  );

  assert.equal(ast.body[0].type, "DoWhileStatement");
  assert.equal(ast.body[0].body.type, "BlockStatement");
  assert.equal(ast.body[0].test.kind, "number");
});

test("parser handles switch statements with literal cases and default", () => {
  const ast = parse(
    createSourceText("switch (value) { case 1: var answer = 1; break; case true: return 2; default: value = 3; }")
  );

  assert.equal(ast.body[0].type, "SwitchStatement");
  assert.equal(ast.body[0].cases.length, 3);
  assert.equal(ast.body[0].cases[0].test.kind, "number");
  assert.equal(ast.body[0].cases[1].test.kind, "boolean");
  assert.equal(ast.body[0].cases[2].test, null);
});

test("parser handles try/catch/finally combinations", () => {
  const tryCatch = parse(createSourceText("try { value(); } catch (err) { return err; }"));
  assert.equal(tryCatch.body[0].type, "TryStatement");
  assert.equal(tryCatch.body[0].handler.param.name, "err");
  assert.equal(tryCatch.body[0].finalizer, null);

  const tryFinally = parse(createSourceText("try { value(); } finally { cleanup(); }"));
  assert.equal(tryFinally.body[0].type, "TryStatement");
  assert.equal(tryFinally.body[0].handler, null);
  assert.equal(tryFinally.body[0].finalizer.type, "BlockStatement");

  const tryCatchFinally = parse(createSourceText("try { value(); } catch { recover(); } finally { cleanup(); }"));
  assert.equal(tryCatchFinally.body[0].type, "TryStatement");
  assert.equal(tryCatchFinally.body[0].handler.param, null);
  assert.equal(tryCatchFinally.body[0].finalizer.type, "BlockStatement");
});

test("parser handles throw statements", () => {
  const ast = parse(createSourceText("throw value;"));
  assert.equal(ast.body[0].type, "ThrowStatement");
  assert.equal(ast.body[0].argument.type, "Identifier");
  assert.equal(ast.body[0].argument.name, "value");
});

test("parser rejects malformed do-while syntax clearly", () => {
  assert.throws(
    () => parse(createSourceText("do { break; };")),
    /Malformed do-while statement: expected 'while' after the body/
  );
});

test("parser rejects malformed switch clauses clearly", () => {
  assert.throws(
    () => parse(createSourceText("switch (value) { default: break; default: break; }")),
    /Switch statements may only contain one default clause/
  );

  assert.throws(
    () => parse(createSourceText("switch (value) { case item: break; }")),
    /Switch case labels in this slice must be literal values/
  );
});

test("parser rejects malformed try/catch/finally syntax clearly", () => {
  assert.throws(
    () => parse(createSourceText("try { value(); }")),
    /Try statements require a catch or finally clause/
  );

  assert.throws(
    () => parse(createSourceText("try { value(); } catch (1) { recover(); }")),
    /Catch bindings must be identifiers/
  );

  assert.throws(
    () => parse(createSourceText("try { value(); } finally cleanup();")),
    /Expected '\{' to start finally block/
  );
});

test("parser rejects malformed throw syntax clearly", () => {
  assert.throws(
    () => parse(createSourceText("throw;")),
    /Throw statements require an expression/
  );
});

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

test("parser rejects unsupported async expression forms clearly", () => {
  assert.throws(
    () => parse(createSourceText("var fn = async function run() { return 1; };")),
    /Jayess does not support async function expressions yet; the first async slice starts with async function declarations only/
  );

  assert.throws(
    () => parse(createSourceText("var fn = async value => value;")),
    /Jayess does not support async arrow functions yet; the first async slice starts with async function declarations only/
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

test("parser rejects unsupported generator forms clearly", () => {
  assert.throws(
    () => parse(createSourceText("class Point { *items() { yield 1; } }")),
    /Expected binding target|Expected identifier|Expected ';' after class field/
  );
});

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

test("parser rejects unsupported private class member forms clearly", () => {
  assert.throws(
    () => parse(createSourceText("class Point { #value() { return 1; } }")),
    /Jayess does not support private methods yet; the first private-member slice starts with private instance fields only/
  );

  assert.throws(
    () => parse(createSourceText("class Point { static #value = 1; }")),
    /Jayess does not support private static fields yet; the first private-member slice starts with private instance fields only/
  );
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

test("parser handles array and object literals with property access", () => {
  const ast = parse(
    createSourceText('var data = { name: "jayess", scores: [1, 2] }; data.scores[0];')
  );

  assert.equal(ast.body[0].declarations[0].init.type, "ObjectExpression");
  assert.equal(ast.body[0].declarations[0].init.properties[1].value.type, "ArrayExpression");
  assert.equal(ast.body[1].expression.type, "MemberExpression");
  assert.equal(ast.body[1].expression.computed, true);
});

test("parser handles array spread elements", () => {
  const ast = parse(
    createSourceText("var values = [0, ...items, last];")
  );

  assert.equal(ast.body[0].declarations[0].init.type, "ArrayExpression");
  assert.equal(ast.body[0].declarations[0].init.elements[1].type, "SpreadElement");
  assert.equal(ast.body[0].declarations[0].init.elements[1].argument.name, "items");
});

test("parser handles object spread properties", () => {
  const ast = parse(
    createSourceText('var data = { ...base, name: "jayess" };')
  );

  assert.equal(ast.body[0].declarations[0].init.type, "ObjectExpression");
  assert.equal(ast.body[0].declarations[0].init.properties[0].type, "SpreadElement");
  assert.equal(ast.body[0].declarations[0].init.properties[0].argument.name, "base");
});

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

test("parser handles boolean literals", () => {
  const ast = parse(
    createSourceText("var enabled = true; if (false) { enabled = false; }")
  );

  assert.equal(ast.body[0].declarations[0].init.type, "Literal");
  assert.equal(ast.body[0].declarations[0].init.kind, "boolean");
  assert.equal(ast.body[1].test.kind, "boolean");
});

test("parser handles null literals", () => {
  const ast = parse(
    createSourceText("var value = null;")
  );

  assert.equal(ast.body[0].declarations[0].init.type, "Literal");
  assert.equal(ast.body[0].declarations[0].init.kind, "null");
  assert.equal(ast.body[0].declarations[0].init.value, null);
});

test("parser handles unary logical not", () => {
  const ast = parse(
    createSourceText("var disabled = !true;")
  );

  assert.equal(ast.body[0].declarations[0].init.type, "UnaryExpression");
  assert.equal(ast.body[0].declarations[0].init.operator, "!");
  assert.equal(ast.body[0].declarations[0].init.argument.kind, "boolean");
});

test("parser handles unary minus", () => {
  const ast = parse(
    createSourceText("var value = -1;")
  );

  assert.equal(ast.body[0].declarations[0].init.type, "UnaryExpression");
  assert.equal(ast.body[0].declarations[0].init.operator, "-");
  assert.equal(ast.body[0].declarations[0].init.argument.kind, "number");
});

test("parser handles logical operators with precedence", () => {
  const ast = parse(
    createSourceText("var result = a || b && c;")
  );

  assert.equal(ast.body[0].declarations[0].init.type, "BinaryExpression");
  assert.equal(ast.body[0].declarations[0].init.operator, "||");
  assert.equal(ast.body[0].declarations[0].init.right.type, "BinaryExpression");
  assert.equal(ast.body[0].declarations[0].init.right.operator, "&&");
});

test("parser handles ternary expressions with precedence", () => {
  const ast = parse(
    createSourceText("var result = flag ? left : right || fallback ? one : two;")
  );

  assert.equal(ast.body[0].declarations[0].init.type, "ConditionalExpression");
  assert.equal(ast.body[0].declarations[0].init.test.name, "flag");
  assert.equal(ast.body[0].declarations[0].init.alternate.type, "ConditionalExpression");
  assert.equal(ast.body[0].declarations[0].init.alternate.test.operator, "||");
});

test("parser handles nullish coalescing with logical precedence", () => {
  const ast = parse(
    createSourceText("var result = left || middle ?? right && fallback;")
  );

  assert.equal(ast.body[0].declarations[0].init.type, "BinaryExpression");
  assert.equal(ast.body[0].declarations[0].init.operator, "??");
  assert.equal(ast.body[0].declarations[0].init.left.operator, "||");
  assert.equal(ast.body[0].declarations[0].init.right.operator, "&&");
});

test("parser handles optional chaining forms", () => {
  const ast = parse(
    createSourceText("var value = obj?.prop; var item = obj?.[index]; var result = fn?.(left, right);")
  );

  assert.equal(ast.body[0].declarations[0].init.type, "OptionalMemberExpression");
  assert.equal(ast.body[0].declarations[0].init.computed, false);
  assert.equal(ast.body[1].declarations[0].init.type, "OptionalMemberExpression");
  assert.equal(ast.body[1].declarations[0].init.computed, true);
  assert.equal(ast.body[2].declarations[0].init.type, "OptionalCallExpression");
});

test("parser handles strict equality operators", () => {
  const ast = parse(
    createSourceText("var same = a === b; var different = a !== b;")
  );

  assert.equal(ast.body[0].declarations[0].init.type, "BinaryExpression");
  assert.equal(ast.body[0].declarations[0].init.operator, "===");
  assert.equal(ast.body[1].declarations[0].init.type, "BinaryExpression");
  assert.equal(ast.body[1].declarations[0].init.operator, "!==");
});

test("parser handles modulo operator", () => {
  const ast = parse(
    createSourceText("var remainder = a % b;")
  );

  assert.equal(ast.body[0].declarations[0].init.type, "BinaryExpression");
  assert.equal(ast.body[0].declarations[0].init.operator, "%");
});

test("parser handles exponentiation with right associativity", () => {
  const ast = parse(
    createSourceText("var value = a ** b ** c;")
  );

  assert.equal(ast.body[0].declarations[0].init.type, "BinaryExpression");
  assert.equal(ast.body[0].declarations[0].init.operator, "**");
  assert.equal(ast.body[0].declarations[0].init.right.type, "BinaryExpression");
  assert.equal(ast.body[0].declarations[0].init.right.operator, "**");
});

test("parser handles unary plus", () => {
  const ast = parse(
    createSourceText("var value = +1;")
  );

  assert.equal(ast.body[0].declarations[0].init.type, "UnaryExpression");
  assert.equal(ast.body[0].declarations[0].init.operator, "+");
  assert.equal(ast.body[0].declarations[0].init.argument.kind, "number");
});

test("parser handles template literals with interpolation", () => {
  const ast = parse(
    createSourceText("var message = `Hello ${name}!`;")
  );

  assert.equal(ast.body[0].declarations[0].init.type, "TemplateLiteral");
  assert.deepEqual(ast.body[0].declarations[0].init.segments, ["Hello ", "!"]);
  assert.equal(ast.body[0].declarations[0].init.expressions[0].type, "Identifier");
  assert.equal(ast.body[0].declarations[0].init.expressions[0].name, "name");
});

test("parser handles default parameters", () => {
  const ast = parse(
    createSourceText("function greet(name, title = `Mx. ${name}`) { return title; }")
  );

  assert.equal(ast.body[0].type, "FunctionDeclaration");
  assert.equal(ast.body[0].params[0].type, "Parameter");
  assert.equal(ast.body[0].params[0].defaultValue, null);
  assert.equal(ast.body[0].params[1].type, "Parameter");
  assert.equal(ast.body[0].params[1].defaultValue.type, "TemplateLiteral");
});

test("parser handles rest parameters", () => {
  const ast = parse(
    createSourceText("function collect(head, ...tail) { return tail; } var join = (...items) => items;")
  );

  assert.equal(ast.body[0].params[1].type, "Parameter");
  assert.equal(ast.body[0].params[1].rest, true);
  assert.equal(ast.body[0].params[1].name, "tail");
  assert.equal(ast.body[1].declarations[0].init.params[0].rest, true);
});

test("parser handles trailing commas in supported positions", () => {
  const ast = parse(
    createSourceText('import { add, } from "./math.js"; export { add as sum, }; function run(value, ) { return add(value, 1,); } var values = [1, 2,]; var data = { name: "Jayess", };')
  );

  assert.equal(ast.body[0].type, "ImportDeclaration");
  assert.equal(ast.body[0].specifiers.length, 1);
  assert.equal(ast.body[1].type, "ExportNamedDeclaration");
  assert.equal(ast.body[2].type, "FunctionDeclaration");
  assert.equal(ast.body[2].params.length, 1);
  assert.equal(ast.body[3].declarations[0].init.type, "ArrayExpression");
  assert.equal(ast.body[4].declarations[0].init.type, "ObjectExpression");
});

test("parser handles spread arguments in call-like expressions", () => {
  const ast = parse(
    createSourceText("fn(...items, value); callback?.(...items); var point = new Point(...coords);")
  );

  assert.equal(ast.body[0].expression.arguments[0].type, "SpreadElement");
  assert.equal(ast.body[0].expression.arguments[0].argument.name, "items");
  assert.equal(ast.body[1].expression.type, "OptionalCallExpression");
  assert.equal(ast.body[1].expression.arguments[0].type, "SpreadElement");
  assert.equal(ast.body[2].declarations[0].init.type, "NewExpression");
  assert.equal(ast.body[2].declarations[0].init.arguments[0].type, "SpreadElement");
});

test("parser rejects malformed repeated commas", () => {
  assert.throws(
    () => parse(createSourceText("var values = [1,,2];")),
    /Jayess syntax does not support this expression form/
  );
});

test("parser rejects unsupported destructuring forms clearly", () => {
  assert.throws(
    () => parse(createSourceText("var [left, , right] = values;")),
    /Array destructuring elisions are not supported/
  );

  assert.throws(
    () => parse(createSourceText("var [{ value }] = items;")),
    /Nested destructuring patterns are not supported in this slice/
  );

  assert.throws(
    () => parse(createSourceText("var { value };")),
    /Destructuring declarations require an initializer/
  );
});

test("parser handles compound assignment operators", () => {
  const ast = parse(
    createSourceText("var total = 1; total += 2; total -= 3; total *= 4; total /= 5; total %= 6; total **= 7; data.value += 1; data[index] *= 2;")
  );

  assert.equal(ast.body[1].expression.type, "AssignmentExpression");
  assert.equal(ast.body[1].expression.operator, "+=");
  assert.equal(ast.body[6].expression.operator, "**=");
  assert.equal(ast.body[7].expression.left.type, "MemberExpression");
  assert.equal(ast.body[8].expression.left.computed, true);
});

test("parser handles prefix and postfix update expressions", () => {
  const ast = parse(
    createSourceText("var total = 1; ++total; total--; ++data.value; data[index]--;")
  );

  assert.equal(ast.body[1].expression.type, "UpdateExpression");
  assert.equal(ast.body[1].expression.operator, "++");
  assert.equal(ast.body[1].expression.prefix, true);
  assert.equal(ast.body[2].expression.operator, "--");
  assert.equal(ast.body[2].expression.prefix, false);
  assert.equal(ast.body[3].expression.argument.type, "MemberExpression");
  assert.equal(ast.body[4].expression.argument.computed, true);
});

test("parser handles composite built-in property and method access", () => {
  const ast = parse(
    createSourceText('var values = [1, 2]; var size = values.length; values.push(3); var nameSize = "Jayess".length; var text = (1).toString();')
  );

  assert.equal(ast.body[1].declarations[0].init.type, "MemberExpression");
  assert.equal(ast.body[1].declarations[0].init.property.name, "length");
  assert.equal(ast.body[2].expression.type, "CallExpression");
  assert.equal(ast.body[2].expression.callee.property.name, "push");
  assert.equal(ast.body[3].declarations[0].init.object.kind, "string");
  assert.equal(ast.body[4].declarations[0].init.callee.property.name, "toString");
});

test("parser handles anonymous function expressions", () => {
  const ast = parse(
    createSourceText("var make = function(x) { return function(y) { return x + y; }; };")
  );

  assert.equal(ast.body[0].declarations[0].init.type, "FunctionExpression");
  assert.equal(ast.body[0].declarations[0].init.body.body[0].argument.type, "FunctionExpression");
});

test("parser handles arrow functions", () => {
  const ast = parse(
    createSourceText("var zero = () => 0; var inc = value => value + 1; var add = (left, right = 1) => { return left + right; };")
  );

  assert.equal(ast.body[0].declarations[0].init.type, "ArrowFunctionExpression");
  assert.equal(ast.body[0].declarations[0].init.params.length, 0);
  assert.equal(ast.body[0].declarations[0].init.expressionBody, true);
  assert.equal(ast.body[1].declarations[0].init.type, "ArrowFunctionExpression");
  assert.equal(ast.body[1].declarations[0].init.params[0].name, "value");
  assert.equal(ast.body[2].declarations[0].init.expressionBody, false);
  assert.equal(ast.body[2].declarations[0].init.params[1].defaultValue.kind, "number");
});

test("parser handles named function expressions", () => {
  const ast = parse(
    createSourceText("var make = function inner(x) { return inner(x); };")
  );

  assert.equal(ast.body[0].declarations[0].init.type, "FunctionExpression");
  assert.equal(ast.body[0].declarations[0].init.id.name, "inner");
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

test("parser handles anonymous default-exported functions", () => {
  const ast = parse(
    createSourceText("export default function(a, b) { return a + b; }")
  );

  assert.equal(ast.body[0].type, "ExportDefaultDeclaration");
  assert.equal(ast.body[0].declaration.type, "FunctionExpression");
});

test("parser handles anonymous default-exported classes", () => {
  const ast = parse(
    createSourceText("export default class { sum() { return 1; } }")
  );

  assert.equal(ast.body[0].type, "ExportDefaultDeclaration");
  assert.equal(ast.body[0].declaration.type, "ClassDeclaration");
  assert.equal(ast.body[0].declaration.id, null);
});

test("parser reports malformed input", () => {
  assert.throws(
    () => parse(createSourceText("function add(a, b { return a + b; }")),
    /Expected '\)' after parameters/
  );
});

test("parser rejects tagged template literals clearly", () => {
  assert.throws(
    () => parse(createSourceText("tag`value`;")),
    /Jayess syntax does not support tagged template literals/
  );
});

test("parser rejects empty template interpolation clearly", () => {
  assert.throws(
    () => parse(createSourceText("var message = `Hello ${}`;")),
    /Jayess syntax does not support this expression form/
  );
});

test("parser rejects parenthesized arrow parameter expressions clearly", () => {
  assert.throws(
    () => parse(createSourceText("var fn = (value + 1) => value;")),
    /Arrow function parameters must be identifiers with optional defaults; parenthesized expressions are not valid parameter lists/
  );
});

test("parser rejects incomplete ternary expressions clearly", () => {
  assert.throws(
    () => parse(createSourceText("var value = flag ? left;")),
    /Expected ':' in ternary expression/
  );
});

test("parser rejects malformed optional chaining clearly", () => {
  assert.throws(
    () => parse(createSourceText("var value = obj?.;")),
    /Optional chaining must be followed by a property, index expression, or call/
  );
});

test("parser rejects unsupported spread and rest forms clearly", () => {
  assert.throws(
    () => parse(createSourceText("var [head, ...items, tail] = values;")),
    /Rest bindings must be the last element in an array destructuring pattern/
  );

  assert.throws(
    () => parse(createSourceText("const { name, ...rest, score } = data;")),
    /Rest bindings must be the last property in an object destructuring pattern/
  );

  assert.throws(
    () => parse(createSourceText("function run(...items = values) { return items; }")),
    /Rest parameters cannot have default values/
  );

  assert.throws(
    () => parse(createSourceText("function run(...items, tail) { return items; }")),
    /Rest parameters must be the last parameter/
  );
});
