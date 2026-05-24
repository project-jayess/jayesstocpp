export function hasSpreadArgument(args) {
  return args.some((arg) => arg.type === "SpreadElement");
}

export function pushRenderedCallArguments(argumentNodes, context, lines, options) {
  const {
    argsName = "jayess_args",
    indent = "  ",
    renderExpression
  } = options;

  for (const argument of argumentNodes) {
    if (argument.type === "SpreadElement") {
      lines.push(`${indent}jayess::append_spread_values(${argsName}, ${renderExpression(argument.argument, context)});`);
      continue;
    }
    lines.push(`${indent}${argsName}.push_back(${renderExpression(argument, context)});`);
  }
}

export function renderOptionalCallExpression(node, context, options) {
  const { renderExpression } = options;
  const calleeExpr = renderExpression(node.callee, context);
  const lines = ["([&]() -> jayess::value {", `  jayess::value jayess_callee = ${calleeExpr};`];
  lines.push("  if (jayess::is_null(jayess_callee)) {");
  lines.push("    return jayess::value(std::monostate{});");
  lines.push("  }");
  if (hasSpreadArgument(node.arguments)) {
    lines.push("  std::vector<jayess::value> jayess_args;");
    pushRenderedCallArguments(node.arguments, context, lines, options);
    lines.push("  return jayess::call_with_args(jayess_callee, std::move(jayess_args));");
    lines.push("})()");
    return lines.join("\n");
  }
  const argNames = [];
  for (const [index, argument] of node.arguments.entries()) {
    const argName = `jayess_arg_${index}`;
    argNames.push(argName);
    lines.push(`  jayess::value ${argName} = ${renderExpression(argument, context)};`);
  }
  const callArgs = ["jayess_callee", ...argNames].join(", ");
  lines.push(`  return jayess::call(${callArgs});`);
  lines.push("})()");
  return lines.join("\n");
}

export function renderCallLikeExpression(calleeNode, argumentNodes, context, options) {
  const { renderExpression, renderSuperConstructorCall } = options;
  if (calleeNode.type === "SuperExpression") {
    return renderSuperConstructorCall(argumentNodes, context, renderExpression, hasSpreadArgument, (args, activeContext, lines, indent = "  ", argsName = "jayess_args") => {
      pushRenderedCallArguments(args, activeContext, lines, {
        ...options,
        argsName,
        indent
      });
    });
  }
  if (!hasSpreadArgument(argumentNodes)) {
    return `jayess::call(${[renderExpression(calleeNode, context), ...argumentNodes.map((arg) => renderExpression(arg, context))].join(", ")})`;
  }

  const lines = ["([&]() -> jayess::value {"];
  lines.push(`  auto jayess_callee = ${renderExpression(calleeNode, context)};`);
  lines.push("  std::vector<jayess::value> jayess_args;");
  pushRenderedCallArguments(argumentNodes, context, lines, options);
  lines.push("  return jayess::call_with_args(jayess_callee, std::move(jayess_args));");
  lines.push("})()");
  return lines.join("\n");
}
