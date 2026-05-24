export function renderSyncCallableClosure({
  captureList,
  params,
  parameterContext,
  bodyContext,
  emitParameter,
  emitBody,
  nullReturnExpression,
  beforeParameters,
  renderExpressionReturn
}) {
  const lines = [`jayess::make_callable([${captureList}](const std::vector<jayess::value>& jayess_args) -> jayess::value {`];
  lines.push("  jayess::scope_cleanup_frame jayess_scope;");

  beforeParameters?.(lines);

  for (const [index, param] of params.entries()) {
    emitParameter(param, index, parameterContext, lines);
  }

  if (renderExpressionReturn != null) {
    lines.push(`  return ${renderExpressionReturn(bodyContext)};`);
    lines.push("})");
    return lines.join("\n");
  }

  const bodyLines = [];
  emitBody(bodyContext, bodyLines);
  lines.push(...bodyLines);
  lines.push(`  return ${nullReturnExpression};`);
  lines.push("})");
  return lines.join("\n");
}
