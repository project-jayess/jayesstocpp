import { renderBinary } from "./emit-operators.js";
import {
  isPrivateFieldKey,
  isPrivateStaticAccessTarget,
  renderPrivateFieldReadFromExpressions,
  renderPrivateFieldWriteFromExpressions,
  renderPrivateStaticFieldReadFromExpression,
  renderPrivateStaticFieldWriteFromExpression
} from "./emit-private.js";

function renderUpdateDelta(operator) {
  if (operator === "++") {
    return `jayess::value(static_cast<double>(1))`;
  }
  return `jayess::value(static_cast<double>(1))`;
}

function renderUpdatedValue(operator, currentValue) {
  if (operator === "++") {
    return renderBinary("+", currentValue, renderUpdateDelta(operator));
  }
  return renderBinary("-", currentValue, renderUpdateDelta(operator));
}

export function renderUpdateExpression(node, context, renderExpression) {
  if (node.argument.type === "MemberExpression") {
    if (node.argument.computed) {
      return `([&]() -> jayess::value {
  jayess::value jayess_object = ${renderExpression(node.argument.object, context)};
  jayess::value jayess_key = ${renderExpression(node.argument.property, context)};
  jayess::value jayess_before = jayess::get_index(jayess_object, jayess_key);
  jayess::value jayess_next = ${renderUpdatedValue(node.operator, "jayess_before")};
  jayess::set_index(jayess_object, jayess_key, jayess_next);
  return ${node.prefix ? "jayess_next" : "jayess_before"};
})()`;
    }

    if (isPrivateFieldKey(node.argument.property)) {
      const classExpr = context.classSelfAlias;
      if (isPrivateStaticAccessTarget(node.argument.object, context)) {
        return `([&]() -> jayess::value {
  jayess::value jayess_before = ${renderPrivateStaticFieldReadFromExpression(classExpr, node.argument.property.name)};
  jayess::value jayess_next = ${renderUpdatedValue(node.operator, "jayess_before")};
  ${renderPrivateStaticFieldWriteFromExpression(classExpr, node.argument.property.name, "jayess_next")};
  return ${node.prefix ? "jayess_next" : "jayess_before"};
})()`;
      }
      return `([&]() -> jayess::value {
  jayess::value jayess_object = ${renderExpression(node.argument.object, context)};
  jayess::value jayess_before = ${renderPrivateFieldReadFromExpressions("jayess_object", classExpr, node.argument.property.name)};
  jayess::value jayess_next = ${renderUpdatedValue(node.operator, "jayess_before")};
  ${renderPrivateFieldWriteFromExpressions("jayess_object", classExpr, node.argument.property.name, "jayess_next")};
  return ${node.prefix ? "jayess_next" : "jayess_before"};
})()`;
    }

    return `([&]() -> jayess::value {
  jayess::value jayess_object = ${renderExpression(node.argument.object, context)};
  jayess::value jayess_before = jayess::get_property(jayess_object, ${JSON.stringify(node.argument.property.name)});
  jayess::value jayess_next = ${renderUpdatedValue(node.operator, "jayess_before")};
  jayess::set_property(jayess_object, ${JSON.stringify(node.argument.property.name)}, jayess_next);
  return ${node.prefix ? "jayess_next" : "jayess_before"};
})()`;
  }

  const argument = renderExpression(node.argument, context);
  const nextValue = renderUpdatedValue(node.operator, argument);
  if (node.prefix) {
    return `(${argument} = ${nextValue})`;
  }
  return `([&]() -> jayess::value {
  jayess::value jayess_before = ${argument};
  ${argument} = ${nextValue};
  return jayess_before;
})()`;
}
