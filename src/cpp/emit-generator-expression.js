import { renderBinary } from "./emit-operators.js";
import { containsYieldExpression, emitDirectYield } from "./emit-generator-core.js";

function emitGeneratorYieldExpression(node, context, lines, renderExpression, loweringContext) {
  if (node.delegate) {
    throw new Error("Generator expression lowering currently supports only direct yield expressions");
  }

  const tempName = loweringContext.allocateExpressionTemp();
  emitDirectYield(
    node.argument,
    context,
    lines,
    renderExpression,
    loweringContext,
    [`      ${tempName} = jayess::generator_take_sent(jayess_generator);`]
  );
  return tempName;
}

export function emitStableGeneratorExpressionValue(node, context, lines, renderExpression, loweringContext) {
  if (containsYieldExpression(node)) {
    return emitGeneratorExpressionValue(node, context, lines, renderExpression, loweringContext);
  }

  const tempName = loweringContext.allocateExpressionTemp();
  lines.push(`      ${tempName} = ${renderExpression(node, context)};`);
  return tempName;
}

function emitGeneratorCallExpression(node, context, lines, renderExpression, loweringContext) {
  if (node.arguments.some((argument) => argument.type === "SpreadElement")) {
    throw new Error("Generator expression lowering does not support spread call arguments containing yield yet");
  }

  const callee = emitStableGeneratorExpressionValue(node.callee, context, lines, renderExpression, loweringContext);
  const args = node.arguments.map((argument) => emitStableGeneratorExpressionValue(argument, context, lines, renderExpression, loweringContext));
  return `jayess::call(${callee}${args.length > 0 ? `, ${args.join(", ")}` : ""})`;
}

function emitGeneratorAssignmentExpression(node, context, lines, renderExpression, loweringContext) {
  if (node.operator !== "=" || containsYieldExpression(node.left)) {
    throw new Error("Generator expression lowering supports only simple assignments with yield on the right-hand side");
  }

  const assigned = emitGeneratorExpressionValue(node.right, context, lines, renderExpression, loweringContext);
  if (node.left.type === "Identifier") {
    return `(${node.left.name} = ${assigned})`;
  }

  if (node.left.type === "MemberExpression") {
    const object = emitStableGeneratorExpressionValue(node.left.object, context, lines, renderExpression, loweringContext);
    if (node.left.computed) {
      const key = emitStableGeneratorExpressionValue(node.left.property, context, lines, renderExpression, loweringContext);
      return `jayess::set_index(${object}, ${key}, ${assigned})`;
    }
    return `jayess::set_property(${object}, ${JSON.stringify(node.left.property.name)}, ${assigned})`;
  }

  throw new Error("Generator expression lowering supports identifier and public member assignment targets");
}

function renderGeneratorObjectKey(node) {
  if (node.type === "Identifier") {
    return JSON.stringify(node.name);
  }
  return JSON.stringify(node.value);
}

function emitGeneratorArrayExpression(node, context, lines, renderExpression, loweringContext) {
  if (node.elements.some((element) => element.type === "SpreadElement")) {
    throw new Error("Generator expression lowering does not support array spread elements in expression-yield arrays yet");
  }

  const values = node.elements.map((element) => {
    return emitStableGeneratorExpressionValue(element, context, lines, renderExpression, loweringContext);
  });
  return `jayess::make_array({${values.join(", ")}})`;
}

function emitGeneratorObjectExpression(node, context, lines, renderExpression, loweringContext) {
  if (node.properties.some((property) => property.type === "SpreadElement")) {
    throw new Error("Generator expression lowering does not support object spread properties in expression-yield objects yet");
  }

  const fields = node.properties.map((property) => {
    const value = emitStableGeneratorExpressionValue(property.value, context, lines, renderExpression, loweringContext);
    return `{${renderGeneratorObjectKey(property.key)}, ${value}}`;
  });
  return `jayess::make_object(std::vector<std::pair<std::string, jayess::value>>{${fields.join(", ")}})`;
}

function emitGeneratorConditionalExpression(node, context, lines, renderExpression, loweringContext) {
  const result = loweringContext.allocateExpressionTemp();
  const test = emitStableGeneratorExpressionValue(node.test, context, lines, renderExpression, loweringContext);
  lines.push(`      if (jayess::truthy(${test})) {`);
  lines.push(`        ${result} = ${emitGeneratorExpressionValue(node.consequent, context, lines, renderExpression, loweringContext)};`);
  lines.push("      } else {");
  lines.push(`        ${result} = ${emitGeneratorExpressionValue(node.alternate, context, lines, renderExpression, loweringContext)};`);
  lines.push("      }");
  return result;
}

function emitGeneratorShortCircuitExpression(node, context, lines, renderExpression, loweringContext) {
  const result = loweringContext.allocateExpressionTemp();
  const left = emitStableGeneratorExpressionValue(node.left, context, lines, renderExpression, loweringContext);
  const conditionByOperator = {
    "&&": `!jayess::truthy(${left})`,
    "||": `jayess::truthy(${left})`,
    "??": `!jayess::is_null(${left})`
  };
  const condition = conditionByOperator[node.operator];

  lines.push(`      if (${condition}) {`);
  lines.push(`        ${result} = ${left};`);
  lines.push("      } else {");
  lines.push(`        ${result} = ${emitGeneratorExpressionValue(node.right, context, lines, renderExpression, loweringContext)};`);
  lines.push("      }");
  return result;
}

export function emitGeneratorExpressionValue(node, context, lines, renderExpression, loweringContext) {
  if (!containsYieldExpression(node)) {
    return renderExpression(node, context);
  }

  switch (node.type) {
    case "YieldExpression":
      return emitGeneratorYieldExpression(node, context, lines, renderExpression, loweringContext);
    case "BinaryExpression": {
      if (node.operator === "&&" || node.operator === "||" || node.operator === "??") {
        return emitGeneratorShortCircuitExpression(node, context, lines, renderExpression, loweringContext);
      }
      const left = containsYieldExpression(node.right)
        ? emitStableGeneratorExpressionValue(node.left, context, lines, renderExpression, loweringContext)
        : emitGeneratorExpressionValue(node.left, context, lines, renderExpression, loweringContext);
      const right = emitGeneratorExpressionValue(node.right, context, lines, renderExpression, loweringContext);
      return renderBinary(node.operator, left, right);
    }
    case "CallExpression":
      return emitGeneratorCallExpression(node, context, lines, renderExpression, loweringContext);
    case "AssignmentExpression":
      return emitGeneratorAssignmentExpression(node, context, lines, renderExpression, loweringContext);
    case "ArrayExpression":
      return emitGeneratorArrayExpression(node, context, lines, renderExpression, loweringContext);
    case "ObjectExpression":
      return emitGeneratorObjectExpression(node, context, lines, renderExpression, loweringContext);
    case "ConditionalExpression":
      return emitGeneratorConditionalExpression(node, context, lines, renderExpression, loweringContext);
    default:
      throw new Error("Generator lowering currently supports selected expression-yield positions only");
  }
}
