function renderObjectKey(node) {
  if (node.type === "Identifier") {
    return JSON.stringify(node.name);
  }
  return JSON.stringify(node.value);
}

function hasObjectSpreadProperty(properties) {
  return properties.some((property) => property.type === "SpreadElement");
}

export function renderObjectExpression(node, context, renderExpression) {
  if (!hasObjectSpreadProperty(node.properties)) {
    const fields = node.properties.map((property) => `{${renderObjectKey(property.key)}, ${renderExpression(property.value, context)}}`).join(", ");
    return `jayess::make_object(std::vector<std::pair<std::string, jayess::value>>{${fields}})`;
  }

  const lines = ["([&]() -> jayess::value {"];
  lines.push("  std::vector<std::pair<std::string, jayess::value>> jayess_fields;");
  for (const property of node.properties) {
    if (property.type === "SpreadElement") {
      lines.push(`  jayess::append_object_spread_fields(jayess_fields, ${renderExpression(property.argument, context)});`);
      continue;
    }
    lines.push(`  jayess_fields.push_back({${renderObjectKey(property.key)}, ${renderExpression(property.value, context)}});`);
  }
  lines.push("  return jayess::make_object(std::move(jayess_fields));");
  lines.push("})()");
  return lines.join("\n");
}
