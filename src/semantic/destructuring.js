export function walkDestructuringPattern(node, context) {
  const {
    activeScope,
    currentClass,
    currentMethod,
    declarationMode,
    functionNode,
    functionScope,
    inAsyncFunction,
    inGeneratorFunction,
    loopDepth,
    resolveIdentifier,
    switchDepth,
    walk
  } = context;

  if (node == null) {
    return;
  }

  if (node.type === "Identifier") {
    if (!declarationMode) {
      const binding = resolveIdentifier(node, activeScope, functionScope, functionNode);
      if (binding?.kind === "const") {
        context.diagnostics.push(context.createSemanticDiagnostic(context.sourceText, node, `Cannot reassign const '${node.name}'`));
      }
    }
    return;
  }

  if (node.type === "MemberExpression") {
    if (declarationMode) {
      context.diagnostics.push(
        context.createSemanticDiagnostic(
          context.sourceText,
          node,
          "Member destructuring targets are only valid in assignment destructuring"
        )
      );
      return;
    }
    walk(
      node.object,
      activeScope,
      loopDepth,
      switchDepth,
      functionScope,
      functionNode,
      inAsyncFunction,
      inGeneratorFunction,
      currentClass,
      currentMethod
    );
    if (node.computed) {
      walk(
        node.property,
        activeScope,
        loopDepth,
        switchDepth,
        functionScope,
        functionNode,
        inAsyncFunction,
        inGeneratorFunction,
        currentClass,
        currentMethod
      );
    }
    return;
  }

  if (node.type === "RestElement") {
    walkDestructuringPattern(node.argument, context);
    return;
  }

  if (node.type === "AssignmentPattern") {
    walk(
      node.right,
      activeScope,
      loopDepth,
      switchDepth,
      functionScope,
      functionNode,
      inAsyncFunction,
      inGeneratorFunction,
      currentClass,
      currentMethod
    );
    walkDestructuringPattern(node.left, context);
    return;
  }

  if (node.type === "ArrayPattern") {
    for (const element of node.elements) {
      walkDestructuringPattern(element, context);
    }
    return;
  }

  if (node.type === "ObjectPattern") {
    for (const property of node.properties) {
      if (property.type === "RestElement") {
        walkDestructuringPattern(property, context);
        continue;
      }
      walkDestructuringPattern(property.value, context);
    }
    return;
  }

  context.diagnostics.push(
    context.createSemanticDiagnostic(
      context.sourceText,
      node,
      "Unsupported destructuring target; expected an identifier, member target in assignment destructuring, nested pattern, default, or final rest binding"
    )
  );
}
