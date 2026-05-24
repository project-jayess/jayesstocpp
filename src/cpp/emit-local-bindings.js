import { collectBindingIdentifiers } from "../ast/binding-patterns.js";
import { collectParameterBindingNames } from "../ast/parameters.js";

function localBindingSets(context) {
  return context.localBindingSets ?? [];
}

export function hasLocalBinding(context, name) {
  const bindingSets = localBindingSets(context);
  for (let index = bindingSets.length - 1; index >= 0; index -= 1) {
    if (bindingSets[index].has(name)) {
      return true;
    }
  }
  return false;
}

export function withLocalBindings(context, names) {
  if (names.length === 0) {
    return context;
  }
  return {
    ...context,
    localBindingSets: [...localBindingSets(context), new Set(names)]
  };
}

export function withParameterBindings(context, params, extraNames = []) {
  return withLocalBindings(context, [...collectParameterBindingNames(params), ...extraNames]);
}

export function withStatementBindings(context, statements) {
  const names = [];
  for (const statement of statements) {
    if (statement.type === "VariableDeclaration") {
      for (const declaration of statement.declarations) {
        for (const identifier of collectBindingIdentifiers(declaration.id)) {
          names.push(identifier.name);
        }
      }
      continue;
    }
    if (statement.type === "FunctionDeclaration" && statement.id != null) {
      names.push(statement.id.name);
      continue;
    }
    if (statement.type === "ClassDeclaration" && statement.id != null) {
      names.push(statement.id.name);
    }
  }
  return withLocalBindings(context, names);
}

export function withLoopInitializerBindings(context, initializer) {
  if (initializer?.type !== "VariableDeclaration") {
    return context;
  }
  const names = [];
  for (const declaration of initializer.declarations) {
    for (const identifier of collectBindingIdentifiers(declaration.id)) {
      names.push(identifier.name);
    }
  }
  return withLocalBindings(context, names);
}
