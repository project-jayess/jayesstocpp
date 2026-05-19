export function renderLiteral(node) {
  if (node.kind === "null") {
    return "jayess::value(std::monostate{})";
  }
  if (node.kind === "number") {
    return `jayess::value(static_cast<double>(${Number(node.value)}))`;
  }
  if (node.kind === "boolean") {
    return `jayess::value(${node.value ? "true" : "false"})`;
  }
  return `jayess::value(std::string(${JSON.stringify(node.value)}))`;
}
