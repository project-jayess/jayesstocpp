import { collectBindingIdentifiers } from "../ast/binding-patterns.js";

function sorted(values) {
  return [...values].filter(Boolean).sort();
}

function collectExpressionIdentifiers(node, names) {
  if (node == null) {
    return;
  }

  switch (node.type) {
    case "Identifier":
      names.add(node.name);
      return;
    case "ThisExpression":
      names.add("this");
      return;
    case "FunctionExpression":
    case "ArrowFunctionExpression":
      for (const capture of node.captures ?? []) {
        names.add(capture);
      }
      return;
    case "Literal":
      return;
    default:
      break;
  }

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const child of value) {
        if (child?.type != null) {
          collectExpressionIdentifiers(child, names);
        }
      }
      continue;
    }
    if (value?.type != null) {
      collectExpressionIdentifiers(value, names);
    }
  }
}

function collectDeclaredBindings(declaration, names) {
  if (declaration == null) {
    return;
  }

  if (declaration.type === "VariableDeclaration") {
    for (const item of declaration.declarations) {
      for (const identifier of collectBindingIdentifiers(item.id)) {
        names.add(identifier.name);
      }
    }
    return;
  }

  if ((declaration.type === "FunctionDeclaration" || declaration.type === "ClassDeclaration") && declaration.id != null) {
    names.add(declaration.id.name);
  }
}

function collectExportedBindings(node, names) {
  if (node.type === "ExportNamedDeclaration") {
    collectDeclaredBindings(node.declaration, names);
    for (const specifier of node.specifiers ?? []) {
      names.add(specifier.local?.name ?? specifier.exported?.name);
    }
    return;
  }

  if (node.type === "ExportDefaultDeclaration") {
    if (node.declaration?.id != null) {
      names.add(node.declaration.id.name);
    } else {
      collectExpressionIdentifiers(node.declaration, names);
    }
  }
}

function walk(node, state, parent = null) {
  if (node == null) {
    return;
  }

  switch (node.type) {
    case "Program":
    case "BlockStatement":
      for (const statement of node.body) {
        walk(statement, state, node);
      }
      return;
    case "VariableDeclaration":
      collectDeclaredBindings(node, state.localBindings);
      if (parent?.type === "Program") {
        collectDeclaredBindings(node, state.moduleStateBindings);
        for (const declaration of node.declarations) {
          collectExpressionIdentifiers(declaration.init, state.storedBindings);
        }
      }
      for (const declaration of node.declarations) {
        walk(declaration.init, state, node);
      }
      return;
    case "FunctionDeclaration":
      collectDeclaredBindings(node, state.localBindings);
      if (parent?.type === "Program") {
        collectDeclaredBindings(node, state.moduleStateBindings);
      }
      for (const param of node.params) {
        for (const identifier of collectBindingIdentifiers(param)) {
          state.localBindings.add(identifier.name);
        }
      }
      walk(node.body, state, node);
      return;
    case "ClassDeclaration":
      collectDeclaredBindings(node, state.localBindings);
      if (parent?.type === "Program") {
        collectDeclaredBindings(node, state.moduleStateBindings);
      }
      for (const method of node.methods ?? []) {
        walk(method.body ?? method.init, state, node);
      }
      return;
    case "FunctionExpression":
    case "ArrowFunctionExpression":
      for (const capture of node.captures ?? []) {
        state.capturedBindings.add(capture);
      }
      for (const param of node.params) {
        for (const identifier of collectBindingIdentifiers(param)) {
          state.localBindings.add(identifier.name);
        }
      }
      walk(node.body, state, node);
      return;
    case "ReturnStatement":
      collectExpressionIdentifiers(node.argument, state.returnedValues);
      walk(node.argument, state, node);
      return;
    case "ThrowStatement":
      collectExpressionIdentifiers(node.argument, state.thrownValues);
      walk(node.argument, state, node);
      return;
    case "AssignmentExpression":
      if (node.left.type === "MemberExpression") {
        collectExpressionIdentifiers(node.right, state.storedBindings);
      }
      walk(node.left, state, node);
      walk(node.right, state, node);
      return;
    case "CallExpression":
    case "OptionalCallExpression":
      if (node.callee.type === "MemberExpression" && !node.callee.computed && node.callee.property.name === "push") {
        for (const argument of node.arguments) {
          collectExpressionIdentifiers(argument, state.storedBindings);
        }
      }
      break;
    case "ExportNamedDeclaration":
    case "ExportDefaultDeclaration":
      collectExportedBindings(node, state.exportedValues);
      walk(node.declaration, state, node);
      return;
    default:
      break;
  }

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const child of value) {
        if (child?.type != null) {
          walk(child, state, node);
        }
      }
      continue;
    }
    if (value?.type != null) {
      walk(value, state, node);
    }
  }
}

export function createModuleLifetimeMetadata(ast, lifetime) {
  const state = {
    localBindings: new Set(),
    capturedBindings: new Set(),
    returnedValues: new Set(),
    thrownValues: new Set(),
    exportedValues: new Set(),
    storedBindings: new Set(),
    moduleStateBindings: new Set()
  };

  walk(ast, state);

  return {
    kind: "jayess-module-lifetime",
    localBindings: sorted(state.localBindings),
    capturedBindings: sorted(state.capturedBindings),
    returnedValues: sorted(state.returnedValues),
    thrownValues: sorted(state.thrownValues),
    exportedValues: sorted(state.exportedValues),
    storedBindings: sorted(state.storedBindings),
    moduleStateBindings: sorted(state.moduleStateBindings),
    escapingBindings: sorted(lifetime?.escaping ?? []),
    fallback: {
      strategy: "broad-runtime-value-ownership",
      reason: "unsupported lifetime shapes preserve current generated C++ ownership behavior"
    }
  };
}
