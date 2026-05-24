import { hasSpreadArgument } from "./emit-call.js";

export function renderArrayExpression(node, context, renderExpression) {
  if (!hasSpreadArgument(node.elements)) {
    return `jayess::make_array({${node.elements.map((element) => renderExpression(element, context)).join(", ")}})`;
  }

  const lines = ["([&]() -> jayess::value {"];
  lines.push("  std::vector<jayess::value> jayess_items;");
  for (const element of node.elements) {
    if (element.type === "SpreadElement") {
      lines.push(`  jayess::append_spread_values(jayess_items, ${renderExpression(element.argument, context)});`);
      continue;
    }
    lines.push(`  jayess_items.push_back(${renderExpression(element, context)});`);
  }
  lines.push("  return jayess::make_array(std::move(jayess_items));");
  lines.push("})()");
  return lines.join("\n");
}
