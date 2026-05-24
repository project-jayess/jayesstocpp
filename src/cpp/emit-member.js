export function renderOptionalMemberExpression(node, context, options) {
  const { renderExpression } = options;
  const objectExpr = renderExpression(node.object, context);
  if (node.computed) {
    const propertyExpr = renderExpression(node.property, context);
    return `([&]() -> jayess::value {
  jayess::value jayess_object = ${objectExpr};
  if (jayess::is_null(jayess_object)) {
    return jayess::value(std::monostate{});
  }
  jayess::value jayess_key = ${propertyExpr};
  return jayess::get_index(jayess_object, jayess_key);
})()`;
  }

  return `([&]() -> jayess::value {
  jayess::value jayess_object = ${objectExpr};
  if (jayess::is_null(jayess_object)) {
    return jayess::value(std::monostate{});
  }
  return jayess::get_property(jayess_object, ${JSON.stringify(node.property.name)});
})()`;
}

export function renderMemberExpression(node, context, options) {
  const {
    isBuiltinLengthMember,
    isPrivateMemberExpression,
    renderExpression,
    renderPrivateMemberExpression,
    renderSuperMemberExpression
  } = options;

  if (node.object.type === "SuperExpression") {
    return renderSuperMemberExpression(node, context, renderExpression);
  }
  if (isPrivateMemberExpression(node)) {
    return renderPrivateMemberExpression(node, context, renderExpression);
  }
  if (!node.computed && node.object.type === "Identifier") {
    const imported = context.importBindings.get(node.object.name);
    if (imported?.importKind === "namespace") {
      const dependency = context.dependencies.get(imported.importSource);
      if (dependency != null) {
        return `${dependency.namespace}::${node.property.name}`;
      }
      return node.property.name;
    }
  }
  if (isBuiltinLengthMember(node)) {
    return `jayess::get_length(${renderExpression(node.object, context)})`;
  }
  if (node.computed) {
    return `jayess::get_index(${renderExpression(node.object, context)}, ${renderExpression(node.property, context)})`;
  }
  return `jayess::get_property(${renderExpression(node.object, context)}, ${JSON.stringify(node.property.name)})`;
}
