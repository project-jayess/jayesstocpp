import { isBindingPattern } from "../ast/binding-patterns.js";

export function renderVariableDeclaration(node, context, helpers) {
  return node.declarations
    .map((declaration) => {
      const init = declaration.init == null ? helpers.renderNullValue() : helpers.renderExpression(declaration.init, context);
      return `jayess::value ${declaration.id.name} = ${init}`;
    })
    .join(", ");
}

export function emitVariableDeclarationStatement(node, context, lines, indent, declarePatternBindings, helpers) {
  const plainDeclarations = node.declarations.filter((declaration) => !isBindingPattern(declaration.id));
  if (plainDeclarations.length > 0) {
    lines.push(`${indent}${renderVariableDeclaration({ ...node, declarations: plainDeclarations }, context, helpers)};`);
  }

  for (const declaration of node.declarations) {
    if (!isBindingPattern(declaration.id)) {
      continue;
    }
    const tempName = helpers.nextDestructureTempName(context);
    const init = helpers.renderExpression(declaration.init, context);
    lines.push(`${indent}jayess::value ${tempName} = ${init};`);
    helpers.emitDestructuringAssignments(declaration.id, tempName, context, lines, indent, declarePatternBindings);
  }
}
