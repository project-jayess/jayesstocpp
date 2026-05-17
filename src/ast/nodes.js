function withRange(type, start, end, fields = {}) {
  return { type, start, end, ...fields };
}

export function program(body, start, end) {
  return withRange("Program", start, end, { body });
}

export function identifier(name, start, end) {
  return withRange("Identifier", start, end, { name });
}

export function privateIdentifier(name, start, end) {
  return withRange("PrivateIdentifier", start, end, { name });
}

export function parameter(id, defaultValue, start, end, rest = false) {
  return withRange("Parameter", start, end, {
    id,
    name: id.name,
    defaultValue,
    rest
  });
}

export function literal(kind, value, start, end) {
  return withRange("Literal", start, end, { kind, value });
}

export function templateLiteral(segments, expressions, start, end) {
  return withRange("TemplateLiteral", start, end, { segments, expressions });
}

export function spreadElement(argument, start, end) {
  return withRange("SpreadElement", start, end, { argument });
}

export function restElement(argument, start, end) {
  return withRange("RestElement", start, end, { argument });
}

export function arrayExpression(elements, start, end) {
  return withRange("ArrayExpression", start, end, { elements });
}

export function arrayPattern(elements, start, end) {
  return withRange("ArrayPattern", start, end, { elements });
}

export function objectExpression(properties, start, end) {
  return withRange("ObjectExpression", start, end, { properties });
}

export function objectProperty(key, value, start, end) {
  return withRange("ObjectProperty", start, end, { key, value });
}

export function objectPattern(properties, start, end) {
  return withRange("ObjectPattern", start, end, { properties });
}

export function bindingProperty(key, value, start, end) {
  return withRange("BindingProperty", start, end, { key, value });
}

export function classDeclaration(id, base, methods, start, end, exported = false) {
  return withRange("ClassDeclaration", start, end, { id, base, methods, exported });
}

export function methodDefinition(key, params, body, start, end, kind = "method", isStatic = false, computed = false) {
  return withRange("MethodDefinition", start, end, {
    key,
    params,
    body,
    kind,
    static: isStatic,
    computed
  });
}

export function classFieldDefinition(key, init, start, end, isStatic = false, computed = false) {
  return withRange("ClassFieldDefinition", start, end, {
    key,
    init,
    static: isStatic,
    computed
  });
}

export function staticInitializationBlock(body, start, end) {
  return withRange("StaticInitializationBlock", start, end, { body, static: true });
}

export function thisExpression(start, end) {
  return withRange("ThisExpression", start, end);
}

export function superExpression(start, end) {
  return withRange("SuperExpression", start, end);
}

export function variableDeclarator(id, init, start, end) {
  return withRange("VariableDeclarator", start, end, { id, init });
}

export function variableDeclaration(kind, declarations, start, end, exported = false) {
  return withRange("VariableDeclaration", start, end, { kind, declarations, exported });
}

export function blockStatement(body, start, end) {
  return withRange("BlockStatement", start, end, { body });
}

export function expressionStatement(expression, start, end) {
  return withRange("ExpressionStatement", start, end, { expression });
}

export function returnStatement(argument, start, end) {
  return withRange("ReturnStatement", start, end, { argument });
}

export function throwStatement(argument, start, end) {
  return withRange("ThrowStatement", start, end, { argument });
}

export function functionDeclaration(id, params, body, start, end, exported = false, isAsync = false, isGenerator = false) {
  return withRange("FunctionDeclaration", start, end, { id, params, body, exported, async: isAsync, generator: isGenerator });
}

export function functionExpression(params, body, start, end, captures = [], id = null, isAsync = false, isGenerator = false) {
  return withRange("FunctionExpression", start, end, { params, body, captures, id, async: isAsync, generator: isGenerator });
}

export function arrowFunctionExpression(params, body, expressionBody, start, end, captures = [], isAsync = false) {
  return withRange("ArrowFunctionExpression", start, end, {
    params,
    body,
    expressionBody,
    captures,
    async: isAsync
  });
}

export function awaitExpression(argument, start, end) {
  return withRange("AwaitExpression", start, end, { argument });
}

export function yieldExpression(argument, delegate, start, end) {
  return withRange("YieldExpression", start, end, { argument, delegate });
}

export function callExpression(callee, args, start, end) {
  return withRange("CallExpression", start, end, { callee, arguments: args });
}

export function binaryExpression(operator, left, right, start, end) {
  return withRange("BinaryExpression", start, end, { operator, left, right });
}

export function unaryExpression(operator, argument, start, end) {
  return withRange("UnaryExpression", start, end, { operator, argument });
}

export function conditionalExpression(test, consequent, alternate, start, end) {
  return withRange("ConditionalExpression", start, end, { test, consequent, alternate });
}

export function updateExpression(operator, argument, prefix, start, end) {
  return withRange("UpdateExpression", start, end, { operator, argument, prefix });
}

export function assignmentExpression(left, operator, right, start, end) {
  return withRange("AssignmentExpression", start, end, { left, operator, right });
}

export function memberExpression(object, property, start, end, computed = false) {
  return withRange("MemberExpression", start, end, { object, property, computed });
}

export function optionalMemberExpression(object, property, start, end, computed = false) {
  return withRange("OptionalMemberExpression", start, end, { object, property, computed });
}

export function optionalCallExpression(callee, args, start, end) {
  return withRange("OptionalCallExpression", start, end, { callee, arguments: args });
}

export function newExpression(callee, args, start, end) {
  return withRange("NewExpression", start, end, { callee, arguments: args });
}

export function ifStatement(test, consequent, alternate, start, end) {
  return withRange("IfStatement", start, end, { test, consequent, alternate });
}

export function whileStatement(test, body, start, end) {
  return withRange("WhileStatement", start, end, { test, body });
}

export function doWhileStatement(body, test, start, end) {
  return withRange("DoWhileStatement", start, end, { body, test });
}

export function forStatement(init, test, update, body, start, end) {
  return withRange("ForStatement", start, end, { init, test, update, body });
}

export function breakStatement(start, end) {
  return withRange("BreakStatement", start, end);
}

export function continueStatement(start, end) {
  return withRange("ContinueStatement", start, end);
}

export function switchCase(test, consequent, start, end) {
  return withRange("SwitchCase", start, end, { test, consequent });
}

export function switchStatement(discriminant, cases, start, end) {
  return withRange("SwitchStatement", start, end, { discriminant, cases });
}

export function catchClause(param, body, start, end) {
  return withRange("CatchClause", start, end, { param, body });
}

export function tryStatement(block, handler, finalizer, start, end) {
  return withRange("TryStatement", start, end, { block, handler, finalizer });
}

export function importDeclaration(specifiers, source, start, end) {
  return withRange("ImportDeclaration", start, end, { specifiers, source });
}

export function importSpecifier(imported, local, kind, start, end) {
  return withRange("ImportSpecifier", start, end, { imported, local, kind });
}

export function exportNamedDeclaration(declaration, specifiers, source, start, end) {
  return withRange("ExportNamedDeclaration", start, end, { declaration, specifiers, source });
}

export function exportDefaultDeclaration(declaration, start, end) {
  return withRange("ExportDefaultDeclaration", start, end, { declaration });
}

export function exportAllDeclaration(source, start, end) {
  return withRange("ExportAllDeclaration", start, end, { source });
}
