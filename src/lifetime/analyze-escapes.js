export function analyzeEscapes(ast) {
  const escaping = new Set();

  function markEscapingValue(node) {
    if (node == null) {
      return;
    }

    switch (node.type) {
      case "Identifier":
        escaping.add(node.name);
        return;
      case "SpreadElement":
        markEscapingValue(node.argument);
        return;
      case "BinaryExpression":
        if (node.operator === "&&" || node.operator === "||") {
          markEscapingValue(node.left);
          markEscapingValue(node.right);
        }
        return;
      case "ArrayExpression":
        for (const element of node.elements) {
          markEscapingValue(element);
        }
        return;
      case "ObjectExpression":
        for (const property of node.properties) {
          if (property.type === "SpreadElement") {
            markEscapingValue(property.argument);
            continue;
          }
          markEscapingValue(property.value);
        }
        return;
      case "MemberExpression":
        markEscapingValue(node.object);
        if (node.computed) {
          markEscapingValue(node.property);
        }
        return;
      default:
        return;
    }
  }

  function walk(node) {
    if (node == null) {
      return;
    }

    switch (node.type) {
      case "Program":
      case "BlockStatement":
        for (const statement of node.body) {
          walk(statement);
        }
        return;
      case "ReturnStatement":
        markEscapingValue(node.argument);
        walk(node.argument);
        return;
      case "ThrowStatement":
        markEscapingValue(node.argument);
        walk(node.argument);
        return;
      case "ExportNamedDeclaration":
        if (node.declaration?.type === "VariableDeclaration") {
          for (const declaration of node.declaration.declarations) {
            escaping.add(declaration.id.name);
          }
        }
        if (node.declaration?.type === "FunctionDeclaration") {
          escaping.add(node.declaration.id.name);
        }
        if (node.declaration?.type === "ClassDeclaration") {
          escaping.add(node.declaration.id.name);
        }
        walk(node.declaration);
        return;
      case "ExportDefaultDeclaration":
        if (node.declaration?.type === "FunctionDeclaration") {
          escaping.add(node.declaration.id.name);
        }
        if (node.declaration?.type === "ClassDeclaration" && node.declaration.id != null) {
          escaping.add(node.declaration.id.name);
        }
        markEscapingValue(node.declaration);
        walk(node.declaration);
        return;
      case "FunctionDeclaration":
        for (const param of node.params) {
          walk(param.defaultValue);
        }
        walk(node.body);
        return;
      case "ClassDeclaration":
        for (const method of node.methods) {
          if (method.type === "ClassFieldDefinition") {
            markEscapingValue(method.init);
            walk(method.init);
            continue;
          }
          walk(method.body);
        }
        return;
      case "FunctionExpression":
      case "ArrowFunctionExpression":
        for (const capture of node.captures ?? []) {
          escaping.add(capture);
        }
        for (const param of node.params) {
          walk(param.defaultValue);
        }
        if (node.expressionBody) {
          walk(node.body);
        } else {
          walk(node.body);
        }
        return;
      case "VariableDeclaration":
        for (const declaration of node.declarations) {
          walk(declaration.init);
        }
        return;
      case "ExpressionStatement":
        walk(node.expression);
        return;
      case "AssignmentExpression":
        if (node.left.type === "MemberExpression") {
          markEscapingValue(node.right);
        }
        walk(node.left);
        walk(node.right);
        return;
      case "BinaryExpression":
        walk(node.left);
        walk(node.right);
        return;
      case "ConditionalExpression":
        walk(node.test);
        walk(node.consequent);
        walk(node.alternate);
        return;
      case "UnaryExpression":
      case "AwaitExpression":
        walk(node.argument);
        return;
      case "UpdateExpression":
        walk(node.argument);
        return;
      case "CallExpression":
      case "OptionalCallExpression":
        if (
          node.callee.type === "MemberExpression"
          && !node.callee.computed
          && node.callee.property.name === "push"
        ) {
          for (const argument of node.arguments) {
            markEscapingValue(argument);
          }
        }
        if (node.callee.type === "Identifier" && node.callee.name === "spawn") {
          for (const argument of node.arguments) {
            markEscapingValue(argument);
          }
        }
        walk(node.callee);
        for (const argument of node.arguments) {
          walk(argument);
        }
        return;
      case "NewExpression":
        walk(node.callee);
        for (const argument of node.arguments) {
          walk(argument);
        }
        return;
      case "ArrayExpression":
        for (const element of node.elements) {
          walk(element);
        }
        return;
      case "ObjectExpression":
        for (const property of node.properties) {
          if (property.type === "SpreadElement") {
            walk(property.argument);
            continue;
          }
          walk(property.value);
        }
        return;
      case "TemplateLiteral":
        for (const expression of node.expressions) {
          walk(expression);
        }
        return;
      case "SpreadElement":
        walk(node.argument);
        return;
      case "MemberExpression":
      case "OptionalMemberExpression":
        walk(node.object);
        if (node.computed) {
          walk(node.property);
        }
        return;
      case "IfStatement":
        walk(node.test);
        walk(node.consequent);
        walk(node.alternate);
        return;
      case "SwitchStatement":
        walk(node.discriminant);
        for (const switchCaseNode of node.cases) {
          for (const statement of switchCaseNode.consequent) {
            walk(statement);
          }
        }
        return;
      case "TryStatement":
        walk(node.block);
        if (node.handler != null) {
          walk(node.handler.body);
        }
        walk(node.finalizer);
        return;
      case "WhileStatement":
        walk(node.test);
        walk(node.body);
        return;
      case "DoWhileStatement":
        walk(node.body);
        walk(node.test);
        return;
      case "ForStatement":
        walk(node.init);
        walk(node.test);
        walk(node.update);
        walk(node.body);
        return;
      default:
        return;
    }
  }

  walk(ast);
  return { escaping };
}
