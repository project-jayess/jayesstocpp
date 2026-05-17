export function renderAwaitExpression(argumentExpression) {
  return `([&]() -> jayess::value {
  jayess::value jayess_async_input = ${argumentExpression};
  return jayess::await_sync(jayess_async_input);
})()`;
}

export function emitAsyncFunction(node, context, lines, emitParameterInitialization, emitStatement) {
  lines.push(`jayess::value ${node.id.name}(const std::vector<jayess::value>& jayess_args) {`);
  lines.push("  jayess::scope_cleanup_frame jayess_scope;");
  lines.push("  jayess::value jayess_async_result = jayess::make_pending_async();");
  for (const [index, param] of node.params.entries()) {
    emitParameterInitialization(param, index, context, lines);
  }
  lines.push("  try {");
  emitStatement(node.body, { ...context, asyncResultName: "jayess_async_result", inAsyncFunction: true }, lines, 2);
  lines.push("    jayess::async_resolve(jayess_async_result, jayess::value(std::monostate{}));");
  lines.push("    return jayess_async_result;");
  lines.push("  } catch (const jayess::thrown_value& jayess_error) {");
  lines.push("    jayess::async_reject(jayess_async_result, jayess::exception_to_value(jayess_error));");
  lines.push("    return jayess_async_result;");
  lines.push("  } catch (const std::exception& jayess_error) {");
  lines.push("    jayess::async_reject(jayess_async_result, jayess::exception_to_value(jayess_error));");
  lines.push("    return jayess_async_result;");
  lines.push("  }");
  lines.push("}");
}
