import { isBindingPattern } from "../ast/binding-patterns.js";
import { renderBinary } from "./emit-operators.js";
import { emitDestructuringAssignments } from "./emit-destructuring.js";
import {
  isPrivateFieldKey,
  isPrivateStaticAccessTarget,
  renderPrivateFieldReadFromExpressions,
  renderPrivateFieldWriteFromExpressions,
  renderPrivateStaticFieldReadFromExpression,
  renderPrivateStaticFieldWriteFromExpression
} from "./emit-private.js";

function compoundBinaryOperator(operator) {
  const mapping = {
    "+=": "+",
    "-=": "-",
    "*=": "*",
    "/=": "/",
    "%=": "%",
    "**=": "**"
  };
  return mapping[operator];
}

function renderCompoundAssignment(node, context, callbacks) {
  const binaryOperator = compoundBinaryOperator(node.operator);
  const right = callbacks.renderExpression(node.right, context);

  if (node.left.type === "MemberExpression") {
    if (node.left.computed) {
      return `([&]() -> jayess::value {
  jayess::value jayess_object = ${callbacks.renderExpression(node.left.object, context)};
  jayess::value jayess_key = ${callbacks.renderExpression(node.left.property, context)};
  jayess::value jayess_next = ${renderBinary(binaryOperator, `jayess::get_index(jayess_object, jayess_key)`, right)};
  return jayess::set_index(jayess_object, jayess_key, jayess_next);
})()`;
    }

    if (isPrivateFieldKey(node.left.property)) {
      const classExpr = context.classSelfAlias;
      if (isPrivateStaticAccessTarget(node.left.object, context)) {
        return `([&]() -> jayess::value {
  jayess::value jayess_next = ${renderBinary(binaryOperator, renderPrivateStaticFieldReadFromExpression(classExpr, node.left.property.name), right)};
  return ${renderPrivateStaticFieldWriteFromExpression(classExpr, node.left.property.name, "jayess_next")};
})()`;
      }
      return `([&]() -> jayess::value {
  jayess::value jayess_object = ${callbacks.renderExpression(node.left.object, context)};
  jayess::value jayess_next = ${renderBinary(binaryOperator, renderPrivateFieldReadFromExpressions("jayess_object", classExpr, node.left.property.name), right)};
  return ${renderPrivateFieldWriteFromExpressions("jayess_object", classExpr, node.left.property.name, "jayess_next")};
})()`;
    }

    return `([&]() -> jayess::value {
  jayess::value jayess_object = ${callbacks.renderExpression(node.left.object, context)};
  jayess::value jayess_next = ${renderBinary(binaryOperator, `jayess::get_property(jayess_object, ${JSON.stringify(node.left.property.name)})`, right)};
  return jayess::set_property(jayess_object, ${JSON.stringify(node.left.property.name)}, jayess_next);
})()`;
  }

  const left = callbacks.renderExpression(node.left, context);
  return `(${left} = ${renderBinary(binaryOperator, left, right)})`;
}

function renderDestructuringAssignment(node, context, callbacks) {
  const tempName = callbacks.nextTempName(context);
  const lines = ["([&]() -> jayess::value {"];
  lines.push(`  jayess::value ${tempName} = ${callbacks.renderExpression(node.right, context)};`);
  emitDestructuringAssignments(node.left, tempName, context, lines, "  ", {
    declareBindings: false,
    nextTempName: callbacks.nextTempName,
    renderExpression: callbacks.renderExpression
  });
  lines.push(`  return ${tempName};`);
  lines.push("})()");
  return lines.join("\n");
}

function renderMemberAssignment(node, context, callbacks) {
  const object = callbacks.renderExpression(node.left.object, context);
  const assigned = callbacks.renderExpression(node.right, context);
  if (node.left.computed) {
    return `jayess::set_index(${object}, ${callbacks.renderExpression(node.left.property, context)}, ${assigned})`;
  }
  if (isPrivateFieldKey(node.left.property)) {
    if (isPrivateStaticAccessTarget(node.left.object, context)) {
      return renderPrivateStaticFieldWriteFromExpression(context.classSelfAlias, node.left.property.name, assigned);
    }
    return renderPrivateFieldWriteFromExpressions(object, context.classSelfAlias, node.left.property.name, assigned);
  }
  return `jayess::set_property(${object}, ${JSON.stringify(node.left.property.name)}, ${assigned})`;
}

export function renderAssignmentExpression(node, context, callbacks) {
  if (node.operator !== "=") {
    return renderCompoundAssignment(node, context, callbacks);
  }
  if (isBindingPattern(node.left)) {
    return renderDestructuringAssignment(node, context, callbacks);
  }
  if (node.left.type === "MemberExpression") {
    return renderMemberAssignment(node, context, callbacks);
  }
  return `(${callbacks.renderExpression(node.left, context)} = ${callbacks.renderExpression(node.right, context)})`;
}
