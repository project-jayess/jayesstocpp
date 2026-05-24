import { toCppIdentifier } from "./cpp-identifiers.js";

function renderPatternKey(node) {
  if (node.type === "Identifier") {
    return JSON.stringify(node.name);
  }
  return JSON.stringify(node.value);
}

function collectObjectPatternKeys(pattern) {
  const keys = [];
  for (const property of pattern.properties) {
    if (property.type === "RestElement") {
      continue;
    }
    keys.push(renderPatternKey(property.key));
  }
  return keys;
}

export function emitDestructuringAssignments(pattern, sourceExpr, context, lines, indent, options) {
  const declareBindings = options.declareBindings ?? true;
  const declareTemps = options.declareTemps ?? true;
  const { nextTempName, renderExpression } = options;

  if (pattern.type === "Identifier") {
    const prefix = declareBindings ? "jayess::value " : "";
    lines.push(`${indent}${prefix}${toCppIdentifier(pattern.name)} = ${sourceExpr};`);
    return;
  }

  if (pattern.type === "MemberExpression") {
    const object = renderExpression(pattern.object, context);
    if (pattern.computed) {
      lines.push(`${indent}jayess::set_index(${object}, ${renderExpression(pattern.property, context)}, ${sourceExpr});`);
      return;
    }
    lines.push(`${indent}jayess::set_property(${object}, ${renderPatternKey(pattern.property)}, ${sourceExpr});`);
    return;
  }

  if (pattern.type === "AssignmentPattern") {
    const valueTemp = nextTempName(context);
    lines.push(`${indent}${declareTemps ? "jayess::value " : ""}${valueTemp} = ${sourceExpr};`);
    lines.push(`${indent}if (jayess::is_null(${valueTemp})) {`);
    lines.push(`${indent}  ${valueTemp} = ${renderExpression(pattern.right, context)};`);
    lines.push(`${indent}}`);
    emitDestructuringAssignments(pattern.left, valueTemp, context, lines, indent, options);
    return;
  }

  if (pattern.type === "ArrayPattern") {
    for (const [index, element] of pattern.elements.entries()) {
      if (element == null) {
        continue;
      }
      if (element.type === "RestElement") {
        const restTemp = nextTempName(context);
        lines.push(`${indent}${declareTemps ? "jayess::value " : ""}${restTemp} = jayess::destructure_rest_array(${sourceExpr}, ${index});`);
        emitDestructuringAssignments(element.argument, restTemp, context, lines, indent, options);
        continue;
      }
      const elementTemp = nextTempName(context);
      lines.push(
        `${indent}${declareTemps ? "jayess::value " : ""}${elementTemp} = jayess::destructure_index(${sourceExpr}, jayess::value(static_cast<double>(${index})));`
      );
      emitDestructuringAssignments(element, elementTemp, context, lines, indent, options);
    }
    return;
  }

  if (pattern.type === "ObjectPattern") {
    const excludedKeys = collectObjectPatternKeys(pattern);
    for (const property of pattern.properties) {
      if (property.type === "RestElement") {
        const restTemp = nextTempName(context);
        lines.push(`${indent}${declareTemps ? "jayess::value " : ""}${restTemp} = jayess::destructure_rest_object(${sourceExpr}, {${excludedKeys.join(", ")}});`);
        emitDestructuringAssignments(property.argument, restTemp, context, lines, indent, options);
        continue;
      }
      const propertyTemp = nextTempName(context);
      lines.push(
        `${indent}${declareTemps ? "jayess::value " : ""}${propertyTemp} = jayess::destructure_property(${sourceExpr}, ${renderPatternKey(property.key)});`
      );
      emitDestructuringAssignments(property.value, propertyTemp, context, lines, indent, options);
    }
  }
}
