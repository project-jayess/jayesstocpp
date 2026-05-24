function isDirectYieldExpressionStatement(statement) {
  return statement?.type === "ExpressionStatement"
    && statement.expression.type === "YieldExpression"
    && !statement.expression.delegate;
}

export function canLowerFocusedGeneratorTryCatchYield(node, containsYieldExpression) {
  if (node.finalizer != null || node.handler == null || containsYieldExpression(node.handler.body)) {
    return false;
  }
  if (node.block.body.length === 0) {
    return false;
  }
  const lastStatement = node.block.body[node.block.body.length - 1];
  if (!isDirectYieldExpressionStatement(lastStatement)) {
    return false;
  }
  return !node.block.body.slice(0, -1).some((statement) => containsYieldExpression(statement));
}

export function canLowerMultiYieldGeneratorTryCatch(node, containsYieldExpression) {
  if (node.finalizer != null || node.handler == null || containsYieldExpression(node.handler.body)) {
    return false;
  }

  let directYieldCount = 0;
  for (const statement of node.block.body) {
    if (isDirectYieldExpressionStatement(statement)) {
      directYieldCount += 1;
      continue;
    }
    if (containsYieldExpression(statement)) {
      return false;
    }
  }

  return directYieldCount > 1;
}

export function canLowerFocusedGeneratorCatchBodyYield(node, containsYieldExpression) {
  if (node.finalizer != null || node.handler == null || containsYieldExpression(node.block)) {
    return false;
  }

  let directYieldCount = 0;
  for (const statement of node.handler.body.body) {
    if (isDirectYieldExpressionStatement(statement)) {
      directYieldCount += 1;
      continue;
    }
    if (containsYieldExpression(statement)) {
      return false;
    }
  }

  return directYieldCount === 1;
}

export function canLowerFocusedGeneratorTryFinallyYield(node, containsYieldExpression) {
  if (node.handler != null || node.finalizer == null || containsYieldExpression(node.finalizer)) {
    return false;
  }

  let directYieldCount = 0;
  for (const statement of node.block.body) {
    if (isDirectYieldExpressionStatement(statement)) {
      directYieldCount += 1;
      continue;
    }
    if (containsYieldExpression(statement)) {
      return false;
    }
  }

  return directYieldCount >= 1;
}
