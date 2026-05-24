export function renderTemplateLiteral(node, context, renderExpression) {
  const parts = [];

  for (let index = 0; index < node.segments.length; index += 1) {
    parts.push(`jayess::value(std::string(${JSON.stringify(node.segments[index])}))`);
    if (index < node.expressions.length) {
      parts.push(renderExpression(node.expressions[index], context));
    }
  }

  return `jayess::interpolate({${parts.join(", ")}})`;
}
