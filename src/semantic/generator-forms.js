export function containsYieldExpression(node) {
  if (node == null || typeof node !== "object") {
    return false;
  }
  if (node.type === "YieldExpression") {
    return true;
  }

  switch (node.type) {
    case "FunctionDeclaration":
    case "FunctionExpression":
    case "ArrowFunctionExpression":
    case "ClassDeclaration":
      return false;
    default:
      break;
  }

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      if (value.some((item) => containsYieldExpression(item))) {
        return true;
      }
      continue;
    }
    if (containsYieldExpression(value)) {
      return true;
    }
  }

  return false;
}

export function containsDelegatedYieldExpression(node) {
  if (node == null || typeof node !== "object") {
    return false;
  }
  if (node.type === "YieldExpression") {
    return node.delegate === true;
  }

  switch (node.type) {
    case "FunctionDeclaration":
    case "FunctionExpression":
    case "ArrowFunctionExpression":
    case "ClassDeclaration":
      return false;
    default:
      break;
  }

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      if (value.some((item) => containsDelegatedYieldExpression(item))) {
        return true;
      }
      continue;
    }
    if (containsDelegatedYieldExpression(value)) {
      return true;
    }
  }

  return false;
}

export function hasSpreadArgumentWithYield(args) {
  return args.some((arg) => arg.type === "SpreadElement" && containsYieldExpression(arg.argument));
}
