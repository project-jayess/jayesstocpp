export function isDeclarationPruningShape(ast) {
  return declarationPruningFallbackReason(ast) == null;
}

export function declarationPruningFallbackReason(ast) {
  for (const statement of ast.body) {
    if (!isDeclarationOnlyTopLevelStatement(statement)) {
      return "top-level-side-effect";
    }
  }
  return null;
}

function isDeclarationOnlyTopLevelStatement(statement) {
  switch (statement.type) {
    case "ImportDeclaration":
    case "FunctionDeclaration":
    case "ClassDeclaration":
    case "VariableDeclaration":
    case "ExportAllDeclaration":
      return true;
    case "ExportNamedDeclaration":
      return statement.declaration == null || isDeclarationOnlyTopLevelStatement(statement.declaration);
    case "ExportDefaultDeclaration":
      return (
        statement.declaration.type === "FunctionDeclaration" ||
        statement.declaration.type === "ClassDeclaration"
      );
    default:
      return false;
  }
}
