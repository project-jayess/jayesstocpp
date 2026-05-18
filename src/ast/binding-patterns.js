export function isBindingPattern(node) {
  return node?.type === "ArrayPattern" || node?.type === "ObjectPattern";
}

export function forEachBindingIdentifier(node, visitor) {
  if (node == null) {
    return;
  }

  if (node.type === "Identifier") {
    visitor(node);
    return;
  }

  if (node.type === "RestElement") {
    forEachBindingIdentifier(node.argument, visitor);
    return;
  }

  if (node.type === "AssignmentPattern") {
    forEachBindingIdentifier(node.left, visitor);
    return;
  }

  if (node.type === "ArrayPattern") {
    for (const element of node.elements) {
      forEachBindingIdentifier(element, visitor);
    }
    return;
  }

  if (node.type === "ObjectPattern") {
    for (const property of node.properties) {
      forEachBindingIdentifier(property.value, visitor);
    }
  }
}

export function collectBindingIdentifiers(node) {
  const identifiers = [];
  forEachBindingIdentifier(node, (identifier) => identifiers.push(identifier));
  return identifiers;
}
