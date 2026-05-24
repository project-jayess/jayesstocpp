import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "../../src/parser/parse.js";
import { createSourceText } from "../../src/source/source-text.js";

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
    /Expected expression before ','/
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

test("parser rejects tagged template literals clearly", () => {
  assert.throws(
    () => parse(createSourceText("tag`value`;")),
    /Jayess syntax does not support tagged template literals/
  );
});

test("parser rejects empty template interpolation clearly", () => {
  assert.throws(
    () => parse(createSourceText("var message = `Hello ${}`;")),
    /Expected expression before ';'/
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

test("parser reports focused invalid expression starts", () => {
  assert.throws(
    () => parse(createSourceText("var value = ;")),
    /Expected expression before ';'/
  );

  assert.throws(
    () => parse(createSourceText("var value = ...items;")),
    /Spread syntax is only valid inside array literals/
  );

  assert.throws(
    () => parse(createSourceText("var value = => item;")),
    /Arrow function syntax requires a parameter list/
  );
});
