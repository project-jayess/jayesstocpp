import { isBindingPattern } from "../ast/binding-patterns.js";
import { emitDestructuringAssignments } from "./emit-destructuring.js";

function renderArgumentSource(param, index, argsName) {
  if (param.rest) {
    return `jayess::rest_arguments(${argsName}, ${index})`;
  }
  return `jayess::argument_at(${argsName}, ${index})`;
}

export function emitParameterInitialization(param, index, context, lines, options) {
  const {
    argsName = "jayess_args",
    indent = "  ",
    nextTempName,
    renderExpression
  } = options;

  if (!isBindingPattern(param.id)) {
    lines.push(`${indent}jayess::value ${param.name} = ${renderArgumentSource(param, index, argsName)};`);
    if (param.defaultValue != null) {
      lines.push(`${indent}if (!jayess::has_argument(${argsName}, ${index})) {`);
      lines.push(`${indent}  ${param.name} = ${renderExpression(param.defaultValue, context)};`);
      lines.push(`${indent}}`);
    }
    return;
  }

  const sourceName = nextTempName(context);
  lines.push(`${indent}jayess::value ${sourceName} = ${renderArgumentSource(param, index, argsName)};`);
  if (param.defaultValue != null) {
    lines.push(`${indent}if (!jayess::has_argument(${argsName}, ${index})) {`);
    lines.push(`${indent}  ${sourceName} = ${renderExpression(param.defaultValue, context)};`);
    lines.push(`${indent}}`);
  }
  emitDestructuringAssignments(param.id, sourceName, context, lines, indent, {
    declareBindings: true,
    nextTempName,
    renderExpression
  });
}
