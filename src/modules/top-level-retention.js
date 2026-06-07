import { collectBindingIdentifiers } from "../ast/binding-patterns.js";

function declarationNames(statement) {
  switch (statement.type) {
    case "FunctionDeclaration":
    case "ClassDeclaration":
      return statement.id == null ? [] : [statement.id.name];
    case "VariableDeclaration":
      return statement.declarations.flatMap((declaration) =>
        collectBindingIdentifiers(declaration.id).map((identifier) => identifier.name)
      );
    default:
      return [];
  }
}

export function shouldRetainTopLevelStatement(statement, retainedDeclarationNames) {
  if (retainedDeclarationNames == null) {
    return true;
  }

  if (statement.type === "ImportDeclaration") {
    return false;
  }

  if (statement.type === "ExportNamedDeclaration") {
    if (statement.declaration == null) {
      return true;
    }
    return shouldRetainTopLevelStatement(statement.declaration, retainedDeclarationNames);
  }

  if (statement.type === "ExportDefaultDeclaration") {
    return retainedDeclarationNames.has("__default_export__");
  }

  if (statement.type === "ExportAllDeclaration") {
    return true;
  }

  const names = declarationNames(statement);
  return names.length === 0 || names.some((name) => retainedDeclarationNames.has(name));
}
