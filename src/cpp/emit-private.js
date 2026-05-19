function requirePrivateClassAlias(context, detail) {
  if (context.classSelfAlias == null) {
    throw new Error(`Private ${detail} requires a class context`);
  }
  return context.classSelfAlias;
}

export function isPrivateFieldKey(node) {
  return node?.type === "PrivateIdentifier";
}

export function isPrivateMemberExpression(node) {
  return node?.type === "MemberExpression" && !node.computed && isPrivateFieldKey(node.property);
}

export function renderPrivateFieldReadFromExpressions(objectExpr, classExpr, propertyName) {
  return `jayess::get_private_field(${objectExpr}, ${classExpr}, ${JSON.stringify(propertyName)})`;
}

export function renderPrivateFieldWriteFromExpressions(objectExpr, classExpr, propertyName, assignedExpr) {
  return `jayess::set_private_field(${objectExpr}, ${classExpr}, ${JSON.stringify(propertyName)}, ${assignedExpr})`;
}

export function isPrivateStaticAccessTarget(node, context) {
  if (node?.type === "Identifier" && context.classSelfName != null && node.name === context.classSelfName) {
    return true;
  }
  return node?.type === "ThisExpression" && context.thisAlias === context.classSelfAlias;
}

export function renderPrivateStaticFieldReadFromExpression(classExpr, propertyName) {
  return `jayess::get_private_static_field(${classExpr}, ${JSON.stringify(propertyName)})`;
}

export function renderPrivateStaticFieldWriteFromExpression(classExpr, propertyName, assignedExpr) {
  return `jayess::set_private_static_field(${classExpr}, ${JSON.stringify(propertyName)}, ${assignedExpr})`;
}

export function renderPrivateMemberExpression(node, context, renderExpression) {
  const classExpr = requirePrivateClassAlias(context, "member access");
  if (isPrivateStaticAccessTarget(node.object, context)) {
    return renderPrivateStaticFieldReadFromExpression(classExpr, node.property.name);
  }
  return renderPrivateFieldReadFromExpressions(renderExpression(node.object, context), classExpr, node.property.name);
}

export function renderPrivateFieldInitialization(field, assignedExpr, context, instanceExpr = "this_value") {
  const classExpr = requirePrivateClassAlias(context, "field initialization");
  return renderPrivateFieldWriteFromExpressions(instanceExpr, classExpr, field.key.name, assignedExpr);
}

export function renderPrivateStaticFieldInitialization(field, assignedExpr, context) {
  const classExpr = requirePrivateClassAlias(context, "static field initialization");
  return renderPrivateStaticFieldWriteFromExpression(classExpr, field.key.name, assignedExpr);
}
