export function renderAwaitExpression(argumentExpression) {
  return `([&]() -> jayess::value {
  jayess::value jayess_async_input = ${argumentExpression};
  return jayess::await_sync(jayess_async_input);
})()`;
}

export function emitAsyncCallableBody(node, context, lines, emitParameterInitialization, emitStatement, renderExpression, options = {}) {
  lines.push("  jayess::scope_cleanup_frame jayess_scope;");
  lines.push("  jayess::value jayess_async_result = jayess::make_pending_async();");
  options.beforeParameters?.(lines);
  for (const [index, param] of node.params.entries()) {
    emitParameterInitialization(param, index, context, lines);
  }
  lines.push("  try {");
  if (node.expressionBody) {
    lines.push(`    jayess::async_resolve(jayess_async_result, ${renderExpression(node.body, context)});`);
    lines.push("    return jayess_async_result;");
  } else {
    emitStatement(node.body, { ...context, asyncResultName: "jayess_async_result", inAsyncFunction: true }, lines, 2);
    lines.push("    jayess::async_resolve(jayess_async_result, jayess::value(std::monostate{}));");
    lines.push("    return jayess_async_result;");
  }
  lines.push("  } catch (const jayess::thrown_value& jayess_error) {");
  lines.push("    jayess::async_reject(jayess_async_result, jayess::exception_to_value(jayess_error));");
  lines.push("    return jayess_async_result;");
  lines.push("  } catch (const std::exception& jayess_error) {");
  lines.push("    jayess::async_reject(jayess_async_result, jayess::exception_to_value(jayess_error));");
  lines.push("    return jayess_async_result;");
  lines.push("  }");
}

export function renderAsyncCallableExpression(node, context, captureList, emitParameterInitialization, emitStatement, renderExpression) {
  const lines = [`jayess::make_callable([${captureList}](const std::vector<jayess::value>& jayess_args) -> jayess::value {`];
  emitAsyncCallableBody(node, context, lines, emitParameterInitialization, emitStatement, renderExpression);
  lines.push("})");
  return lines.join("\n");
}

export function emitAsyncFunction(node, context, lines, emitParameterInitialization, emitStatement) {
  lines.push(`jayess::value ${node.id.name}(const std::vector<jayess::value>& jayess_args) {`);
  emitAsyncCallableBody(node, context, lines, emitParameterInitialization, emitStatement, () => {
    throw new Error("Async function declarations should not use expression bodies");
  });
  lines.push("}");
}
