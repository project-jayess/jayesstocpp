import { collectBindingIdentifiers, isBindingPattern } from "../ast/binding-patterns.js";
import { classifyImport } from "../modules/classify-import.js";
import { emitAsyncFunction, renderAsyncCallableExpression, renderAwaitExpression } from "./emit-async.js";
import { renderClassValue, renderSuperConstructorCall, renderSuperMemberExpression } from "./emit-class.js";
import { renderExportAllAlias, renderLocalExportAlias, renderReExportAlias } from "./export-alias.js";
import { emitGeneratorFunction, renderGeneratorCallableExpression } from "./emit-generator.js";
import { toModuleNamespace } from "./module-names.js";
import {
  isPrivateFieldKey,
  isPrivateMemberExpression,
  renderPrivateFieldReadFromExpressions,
  renderPrivateFieldWriteFromExpressions,
  renderPrivateMemberExpression
} from "./emit-private.js";

function renderLiteral(node) {
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

function renderNullValue() {
  return "jayess::value(std::monostate{})";
}

function renderObjectKey(node) {
  if (node.type === "Identifier") {
    return JSON.stringify(node.name);
  }
  return JSON.stringify(node.value);
}

function renderTemplateLiteral(node, context) {
  const parts = [];

  for (let index = 0; index < node.segments.length; index += 1) {
    parts.push(`jayess::value(std::string(${JSON.stringify(node.segments[index])}))`);
    if (index < node.expressions.length) {
      parts.push(renderExpression(node.expressions[index], context));
    }
  }

  return `jayess::interpolate({${parts.join(", ")}})`;
}

function isBuiltinLengthMember(node) {
  return node.type === "MemberExpression" && !node.computed && node.property.name === "length";
}

function isBuiltinArrayPushCall(node) {
  return node.type === "CallExpression"
    && node.callee.type === "MemberExpression"
    && !node.callee.computed
    && node.callee.property.name === "push";
}

function isBuiltinArrayPopCall(node) {
  return node.type === "CallExpression"
    && node.callee.type === "MemberExpression"
    && !node.callee.computed
    && node.callee.property.name === "pop";
}

function isBuiltinArrayJoinCall(node) {
  return node.type === "CallExpression"
    && node.callee.type === "MemberExpression"
    && !node.callee.computed
    && node.callee.property.name === "join";
}

function isBuiltinArrayIncludesCall(node) {
  return node.type === "CallExpression"
    && node.callee.type === "MemberExpression"
    && !node.callee.computed
    && node.callee.property.name === "includes";
}

function isBuiltinToStringCall(node) {
  return node.type === "CallExpression"
    && node.callee.type === "MemberExpression"
    && !node.callee.computed
    && node.callee.property.name === "toString"
    && node.arguments.length === 0;
}

function isBuiltinStringSliceCall(node) {
  return node.type === "CallExpression"
    && node.callee.type === "MemberExpression"
    && !node.callee.computed
    && node.callee.property.name === "slice";
}

function isBuiltinStringSubstringCall(node) {
  return node.type === "CallExpression"
    && node.callee.type === "MemberExpression"
    && !node.callee.computed
    && node.callee.property.name === "substring";
}

function isBuiltinStringStartsWithCall(node) {
  return node.type === "CallExpression"
    && node.callee.type === "MemberExpression"
    && !node.callee.computed
    && node.callee.property.name === "startsWith";
}

function getBuiltinStringMethodHelper(node) {
  if (node.type !== "CallExpression" || node.callee.type !== "MemberExpression" || node.callee.computed) {
    return null;
  }

  const helperByProperty = {
    slice: "string_slice",
    substring: "string_substring",
    startsWith: "string_starts_with",
    includes: "string_includes",
    indexOf: "string_index_of",
    endsWith: "string_ends_with"
  };

  const helperName = helperByProperty[node.callee.property.name];
  if (helperName == null) {
    return null;
  }

  return {
    helperName,
    propertyName: node.callee.property.name
  };
}

function hasSpreadArgument(args) {
  return args.some((arg) => arg.type === "SpreadElement");
}

function pushRenderedCallArguments(argumentNodes, context, lines, indent = "  ", argsName = "jayess_args") {
  for (const argument of argumentNodes) {
    if (argument.type === "SpreadElement") {
      lines.push(`${indent}jayess::append_spread_values(${argsName}, ${renderExpression(argument.argument, context)});`);
      continue;
    }
    lines.push(`${indent}${argsName}.push_back(${renderExpression(argument, context)});`);
  }
}

function renderArrayExpression(node, context) {
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

function hasObjectSpreadProperty(properties) {
  return properties.some((property) => property.type === "SpreadElement");
}

function renderObjectExpression(node, context) {
  if (!hasObjectSpreadProperty(node.properties)) {
    return `jayess::make_object({${node.properties.map((property) => `{${renderObjectKey(property.key)}, ${renderExpression(property.value, context)}}`).join(", ")}})`;
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

function renderArrayPushCall(node, context) {
  const lines = ["([&]() -> jayess::value {"];
  lines.push(`  jayess::value jayess_object = ${renderExpression(node.callee.object, context)};`);
  lines.push("  std::vector<jayess::value> jayess_args;");
  pushRenderedCallArguments(node.arguments, context, lines);
  lines.push("  if (std::holds_alternative<jayess::array_ptr>(jayess_object)) {");
  lines.push("    return jayess::array_push(jayess_object, std::move(jayess_args));");
  lines.push("  }");
  lines.push('  return jayess::call_with_args(jayess::get_property(jayess_object, "push"), std::move(jayess_args));');
  lines.push("})()");
  return lines.join("\n");
}

function renderArrayPopCall(node, context) {
  const lines = ["([&]() -> jayess::value {"];
  lines.push(`  jayess::value jayess_object = ${renderExpression(node.callee.object, context)};`);
  lines.push("  if (std::holds_alternative<jayess::array_ptr>(jayess_object)) {");
  lines.push("    return jayess::array_pop(jayess_object);");
  lines.push("  }");
  lines.push('  return jayess::call(jayess::get_property(jayess_object, "pop"));');
  lines.push("})()");
  return lines.join("\n");
}

function renderArrayJoinCall(node, context) {
  const lines = ["([&]() -> jayess::value {"];
  lines.push(`  jayess::value jayess_object = ${renderExpression(node.callee.object, context)};`);
  lines.push("  std::vector<jayess::value> jayess_args;");
  pushRenderedCallArguments(node.arguments, context, lines);
  lines.push("  if (std::holds_alternative<jayess::array_ptr>(jayess_object)) {");
  lines.push("    return jayess::array_join(jayess_object, jayess_args);");
  lines.push("  }");
  lines.push('  return jayess::call_with_args(jayess::get_property(jayess_object, "join"), std::move(jayess_args));');
  lines.push("})()");
  return lines.join("\n");
}

function renderIncludesCall(node, context) {
  const lines = ["([&]() -> jayess::value {"];
  lines.push(`  jayess::value jayess_object = ${renderExpression(node.callee.object, context)};`);
  lines.push("  std::vector<jayess::value> jayess_args;");
  pushRenderedCallArguments(node.arguments, context, lines);
  lines.push("  if (std::holds_alternative<jayess::array_ptr>(jayess_object)) {");
  lines.push("    return jayess::array_includes(jayess_object, jayess_args);");
  lines.push("  }");
  lines.push("  if (std::holds_alternative<std::string>(jayess_object)) {");
  lines.push("    return jayess::string_includes(jayess_object, jayess_args);");
  lines.push("  }");
  lines.push('  return jayess::call_with_args(jayess::get_property(jayess_object, "includes"), std::move(jayess_args));');
  lines.push("})()");
  return lines.join("\n");
}

function renderToStringCall(node, context) {
  const lines = ["([&]() -> jayess::value {"];
  lines.push(`  jayess::value jayess_object = ${renderExpression(node.callee.object, context)};`);
  lines.push("  if (std::holds_alternative<jayess::object_ptr>(jayess_object) || std::holds_alternative<jayess::callable_ptr>(jayess_object)) {");
  lines.push('    return jayess::call(jayess::get_property(jayess_object, "toString"));');
  lines.push("  }");
  lines.push("  return jayess::to_string_value(jayess_object);");
  lines.push("})()");
  return lines.join("\n");
}

function renderStringMethodCall(node, context, helperName, propertyName) {
  const lines = ["([&]() -> jayess::value {"];
  lines.push(`  jayess::value jayess_object = ${renderExpression(node.callee.object, context)};`);
  lines.push("  std::vector<jayess::value> jayess_args;");
  pushRenderedCallArguments(node.arguments, context, lines);
  lines.push("  if (std::holds_alternative<std::string>(jayess_object)) {");
  lines.push(`    return jayess::${helperName}(jayess_object, jayess_args);`);
  lines.push("  }");
  lines.push(`  return jayess::call_with_args(jayess::get_property(jayess_object, ${JSON.stringify(propertyName)}), std::move(jayess_args));`);
  lines.push("})()");
  return lines.join("\n");
}

function emitParameterInitialization(param, index, context, lines, indent = "  ", argsName = "jayess_args") {
  if (param.rest) {
    lines.push(`${indent}jayess::value ${param.name} = jayess::rest_arguments(${argsName}, ${index});`);
    return;
  }
  lines.push(`${indent}jayess::value ${param.name} = jayess::argument_at(${argsName}, ${index});`);
  if (param.defaultValue != null) {
    lines.push(`${indent}if (!jayess::has_argument(${argsName}, ${index})) {`);
    lines.push(`${indent}  ${param.name} = ${renderExpression(param.defaultValue, context)};`);
    lines.push(`${indent}}`);
  }
}

function renderBinary(operator, left, right) {
  if (operator === "&&") {
    return `([&]() -> jayess::value {
  jayess::value jayess_left = ${left};
  if (!jayess::truthy(jayess_left)) {
    return jayess_left;
  }
  return ${right};
})()`;
  }

  if (operator === "||") {
    return `([&]() -> jayess::value {
  jayess::value jayess_left = ${left};
  if (jayess::truthy(jayess_left)) {
    return jayess_left;
  }
  return ${right};
})()`;
  }

  if (operator === "??") {
    return `([&]() -> jayess::value {
  jayess::value jayess_left = ${left};
  if (!jayess::is_null(jayess_left)) {
    return jayess_left;
  }
  return ${right};
})()`;
  }

  const helpers = {
    "+": "add",
    "-": "subtract",
    "*": "multiply",
    "/": "divide",
    "%": "modulo",
    "**": "power",
    ">": "greater_than",
    "<": "less_than",
    ">=": "greater_than_equal",
    "<=": "less_than_equal",
    "==": "equal",
    "!=": "not_equal",
    "===": "equal",
    "!==": "not_equal"
  };
  return `jayess::${helpers[operator]}(${left}, ${right})`;
}

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

function renderCompoundAssignment(node, context) {
  const binaryOperator = compoundBinaryOperator(node.operator);
  const right = renderExpression(node.right, context);

  if (node.left.type === "MemberExpression") {
    if (node.left.computed) {
      return `([&]() -> jayess::value {
  jayess::value jayess_object = ${renderExpression(node.left.object, context)};
  jayess::value jayess_key = ${renderExpression(node.left.property, context)};
  jayess::value jayess_next = ${renderBinary(binaryOperator, `jayess::get_index(jayess_object, jayess_key)`, right)};
  return jayess::set_index(jayess_object, jayess_key, jayess_next);
})()`;
    }

    if (isPrivateFieldKey(node.left.property)) {
      const classExpr = context.classSelfAlias;
      return `([&]() -> jayess::value {
  jayess::value jayess_object = ${renderExpression(node.left.object, context)};
  jayess::value jayess_next = ${renderBinary(binaryOperator, renderPrivateFieldReadFromExpressions("jayess_object", classExpr, node.left.property.name), right)};
  return ${renderPrivateFieldWriteFromExpressions("jayess_object", classExpr, node.left.property.name, "jayess_next")};
})()`;
    }

    return `([&]() -> jayess::value {
  jayess::value jayess_object = ${renderExpression(node.left.object, context)};
  jayess::value jayess_next = ${renderBinary(binaryOperator, `jayess::get_property(jayess_object, ${JSON.stringify(node.left.property.name)})`, right)};
  return jayess::set_property(jayess_object, ${JSON.stringify(node.left.property.name)}, jayess_next);
})()`;
  }

  const left = renderExpression(node.left, context);
  return `(${left} = ${renderBinary(binaryOperator, left, right)})`;
}

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

function renderUpdateExpression(node, context) {
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

function renderUnary(operator, argument) {
  if (operator === "!") {
    return `jayess::value(!jayess::truthy(${argument}))`;
  }
  if (operator === "+") {
    return `jayess::positive(${argument})`;
  }
  if (operator === "-") {
    return `jayess::subtract(jayess::value(static_cast<double>(0)), ${argument})`;
  }
  throw new Error(`Unsupported unary operator '${operator}'`);
}

function renderIdentifier(node, context) {
  if (context.classSelfName != null && context.classSelfAlias != null && node.name === context.classSelfName) {
    return context.classSelfAlias;
  }
  const imported = context.importBindings.get(node.name);
  if (imported != null) {
    const dependency = context.dependencies.get(imported.importSource);
    const importedName = imported.importedName === "default" ? "__default_export__" : imported.importedName;
    if (imported.importKind === "namespace") {
      return node.name;
    }
    if (dependency != null) {
      return `${dependency.namespace}::${importedName}`;
    }
    return importedName;
  }
  return node.name;
}

function renderThisExpression(context) {
  if (context.thisAlias == null) {
    throw new Error("Unsupported this expression outside class methods");
  }
  return context.thisAlias;
}

function renderArrowCaptureName(name, context) {
  if (name === "this") {
    if (context.thisAlias == null) {
      throw new Error("Arrow function captured 'this' outside a lexical this scope");
    }
    return context.thisAlias;
  }
  return name;
}

function renderOptionalMemberExpression(node, context) {
  const objectExpr = renderExpression(node.object, context);
  if (node.computed) {
    const propertyExpr = renderExpression(node.property, context);
    return `([&]() -> jayess::value {
  jayess::value jayess_object = ${objectExpr};
  if (jayess::is_null(jayess_object)) {
    return jayess::value(std::monostate{});
  }
  jayess::value jayess_key = ${propertyExpr};
  return jayess::get_index(jayess_object, jayess_key);
})()`;
  }

  return `([&]() -> jayess::value {
  jayess::value jayess_object = ${objectExpr};
  if (jayess::is_null(jayess_object)) {
    return jayess::value(std::monostate{});
  }
  return jayess::get_property(jayess_object, ${JSON.stringify(node.property.name)});
})()`;
}

function renderOptionalCallExpression(node, context) {
  const calleeExpr = renderExpression(node.callee, context);
  const lines = ["([&]() -> jayess::value {", `  jayess::value jayess_callee = ${calleeExpr};`];
  lines.push("  if (jayess::is_null(jayess_callee)) {");
  lines.push("    return jayess::value(std::monostate{});");
  lines.push("  }");
  if (hasSpreadArgument(node.arguments)) {
    lines.push("  std::vector<jayess::value> jayess_args;");
    pushRenderedCallArguments(node.arguments, context, lines);
    lines.push("  return jayess::call_with_args(jayess_callee, std::move(jayess_args));");
    lines.push("})()");
    return lines.join("\n");
  }
  const argNames = [];
  for (const [index, argument] of node.arguments.entries()) {
    const argName = `jayess_arg_${index}`;
    argNames.push(argName);
    lines.push(`  jayess::value ${argName} = ${renderExpression(argument, context)};`);
  }
  const callArgs = ["jayess_callee", ...argNames].join(", ");
  lines.push(`  return jayess::call(${callArgs});`);
  lines.push("})()");
  return lines.join("\n");
}

function renderCallLikeExpression(calleeNode, argumentNodes, context) {
  if (calleeNode.type === "SuperExpression") {
    return renderSuperConstructorCall(argumentNodes, context, renderExpression, hasSpreadArgument, pushRenderedCallArguments);
  }
  if (!hasSpreadArgument(argumentNodes)) {
    return `jayess::call(${[renderExpression(calleeNode, context), ...argumentNodes.map((arg) => renderExpression(arg, context))].join(", ")})`;
  }

  const lines = ["([&]() -> jayess::value {"];
  lines.push(`  auto jayess_callee = ${renderExpression(calleeNode, context)};`);
  lines.push("  std::vector<jayess::value> jayess_args;");
  pushRenderedCallArguments(argumentNodes, context, lines);
  lines.push("  return jayess::call_with_args(jayess_callee, std::move(jayess_args));");
  lines.push("})()");
  return lines.join("\n");
}

function renderExpression(node, context) {
  switch (node.type) {
    case "Literal":
      return renderLiteral(node);
    case "Identifier":
      return renderIdentifier(node, context);
    case "ThisExpression":
      return renderThisExpression(context);
    case "SuperExpression":
      throw new Error("Bare super expressions are not supported in C++ emission");
    case "FunctionExpression":
      return renderClosureExpression(node, context);
    case "ArrowFunctionExpression":
      return renderArrowFunctionExpression(node, context);
    case "TemplateLiteral":
      return renderTemplateLiteral(node, context);
    case "ArrayExpression":
      return renderArrayExpression(node, context);
    case "ObjectExpression":
      return renderObjectExpression(node, context);
    case "MemberExpression": {
      if (node.object.type === "SuperExpression") {
        return renderSuperMemberExpression(node, context);
      }
      if (isPrivateMemberExpression(node)) {
        return renderPrivateMemberExpression(node, context, renderExpression);
      }
      if (!node.computed && node.object.type === "Identifier") {
        const imported = context.importBindings.get(node.object.name);
        if (imported?.importKind === "namespace") {
          const dependency = context.dependencies.get(imported.importSource);
          if (dependency != null) {
            return `${dependency.namespace}::${node.property.name}`;
          }
          return node.property.name;
        }
      }
      if (isBuiltinLengthMember(node)) {
        return `jayess::get_length(${renderExpression(node.object, context)})`;
      }
      if (node.computed) {
        return `jayess::get_index(${renderExpression(node.object, context)}, ${renderExpression(node.property, context)})`;
      }
      return `jayess::get_property(${renderExpression(node.object, context)}, ${JSON.stringify(node.property.name)})`;
    }
    case "OptionalMemberExpression":
      return renderOptionalMemberExpression(node, context);
    case "BinaryExpression":
      return renderBinary(
        node.operator,
        renderExpression(node.left, context),
        renderExpression(node.right, context)
      );
    case "ConditionalExpression":
      return `([&]() -> jayess::value {
  jayess::value jayess_condition = ${renderExpression(node.test, context)};
  if (jayess::truthy(jayess_condition)) {
    return ${renderExpression(node.consequent, context)};
  }
  return ${renderExpression(node.alternate, context)};
})()`;
    case "UnaryExpression":
      return renderUnary(node.operator, renderExpression(node.argument, context));
    case "AwaitExpression":
      return renderAwaitExpression(renderExpression(node.argument, context));
    case "UpdateExpression":
      return renderUpdateExpression(node, context);
    case "CallExpression":
      if (isBuiltinArrayPushCall(node)) {
        return renderArrayPushCall(node, context);
      }
      if (isBuiltinArrayPopCall(node)) {
        return renderArrayPopCall(node, context);
      }
      if (isBuiltinArrayJoinCall(node)) {
        return renderArrayJoinCall(node, context);
      }
      if (isBuiltinArrayIncludesCall(node)) {
        return renderIncludesCall(node, context);
      }
      if (isBuiltinToStringCall(node)) {
        return renderToStringCall(node, context);
      }
      {
        const stringMethod = getBuiltinStringMethodHelper(node);
        if (stringMethod != null) {
          return renderStringMethodCall(node, context, stringMethod.helperName, stringMethod.propertyName);
        }
      }
      return renderCallLikeExpression(node.callee, node.arguments, context);
    case "OptionalCallExpression":
      return renderOptionalCallExpression(node, context);
    case "SpreadElement":
      throw new Error("Spread elements can only be emitted inside spread-aware containers");
    case "NewExpression":
      return renderCallLikeExpression(node.callee, node.arguments, context);
    case "AssignmentExpression":
      if (node.operator !== "=") {
        return renderCompoundAssignment(node, context);
      }
      if (isBindingPattern(node.left)) {
        const tempName = nextDestructureTempName(context);
        const lines = ["([&]() -> jayess::value {"];
        lines.push(`  jayess::value ${tempName} = ${renderExpression(node.right, context)};`);
        emitDestructuringAssignments(node.left, tempName, context, lines, "  ", false);
        lines.push(`  return ${tempName};`);
        lines.push("})()");
        return lines.join("\n");
      }
      if (node.left.type === "MemberExpression") {
        const object = renderExpression(node.left.object, context);
        const assigned = renderExpression(node.right, context);
        if (node.left.computed) {
          return `jayess::set_index(${object}, ${renderExpression(node.left.property, context)}, ${assigned})`;
        }
        if (isPrivateFieldKey(node.left.property)) {
          return renderPrivateFieldWriteFromExpressions(object, context.classSelfAlias, node.left.property.name, assigned);
        }
        return `jayess::set_property(${object}, ${JSON.stringify(node.left.property.name)}, ${assigned})`;
      }
      return `(${renderExpression(node.left, context)} = ${renderExpression(node.right, context)})`;
    default:
      throw new Error(`Unsupported expression node '${node.type}'`);
  }
}

function renderClosureExpression(node, context) {
  if (node.generator) {
    return renderGeneratorCallableExpression(node, context, renderExpression, emitParameterInitialization);
  }
  if (node.async) {
    return renderAsyncCallableExpression(node, context, (node.captures ?? []).join(", "), emitParameterInitialization, emitStatement, renderExpression);
  }
  const captureList = (node.captures ?? []).join(", ");
  const lines = [`jayess::make_callable([${captureList}](const std::vector<jayess::value>& jayess_args) -> jayess::value {`];
  lines.push("  jayess::scope_cleanup_frame jayess_scope;");

  for (const [index, param] of node.params.entries()) {
    emitParameterInitialization(param, index, context, lines);
  }

  const bodyLines = [];
  emitStatement(node.body, context, bodyLines, 1);
  lines.push(...bodyLines);
  lines.push(`  return ${renderNullValue()};`);
  lines.push("})");
  return lines.join("\n");
}

function renderArrowFunctionExpression(node, context) {
  const captureList = (node.captures ?? [])
    .map((name) => renderArrowCaptureName(name, context))
    .join(", ");
  if (node.async) {
    return renderAsyncCallableExpression(node, context, captureList, emitParameterInitialization, emitStatement, renderExpression);
  }
  const lines = [`jayess::make_callable([${captureList}](const std::vector<jayess::value>& jayess_args) -> jayess::value {`];
  lines.push("  jayess::scope_cleanup_frame jayess_scope;");

  for (const [index, param] of node.params.entries()) {
    emitParameterInitialization(param, index, context, lines);
  }

  if (node.expressionBody) {
    lines.push(`  return ${renderExpression(node.body, context)};`);
    lines.push("})");
    return lines.join("\n");
  }

  const bodyLines = [];
  emitStatement(node.body, context, bodyLines, 1);
  lines.push(...bodyLines);
  lines.push(`  return ${renderNullValue()};`);
  lines.push("})");
  return lines.join("\n");
}

function renderFunctionExportValue(node, context) {
  const lines = ["jayess::make_callable([](const std::vector<jayess::value>& jayess_args) -> jayess::value {"];
  lines.push("  jayess::scope_cleanup_frame jayess_scope;");
  lines.push(`  return ::${context.namespace}::${node.id.name}(jayess_args);`);
  lines.push("})");
  return lines.join("\n");
}

function nextDestructureTempName(context) {
  const index = context.tempState.nextDestructureIndex;
  context.tempState.nextDestructureIndex += 1;
  return `jayess_destructure_${index}`;
}

function renderPatternKey(node) {
  if (node.type === "Identifier") {
    return JSON.stringify(node.name);
  }
  return JSON.stringify(node.value);
}

function nextSwitchLabel(context) {
  const index = context.tempState.nextSwitchIndex ?? 0;
  context.tempState.nextSwitchIndex = index + 1;
  return `jayess_switch_end_${index}`;
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

function emitDestructuringAssignments(pattern, sourceExpr, context, lines, indent, declareBindings = true) {
  if (pattern.type === "Identifier") {
    const prefix = declareBindings ? "jayess::value " : "";
    lines.push(`${indent}${prefix}${pattern.name} = ${sourceExpr};`);
    return;
  }

  if (pattern.type === "AssignmentPattern") {
    const valueTemp = nextDestructureTempName(context);
    lines.push(`${indent}jayess::value ${valueTemp} = ${sourceExpr};`);
    lines.push(`${indent}if (jayess::is_null(${valueTemp})) {`);
    lines.push(`${indent}  ${valueTemp} = ${renderExpression(pattern.right, context)};`);
    lines.push(`${indent}}`);
    emitDestructuringAssignments(pattern.left, valueTemp, context, lines, indent, declareBindings);
    return;
  }

  if (pattern.type === "ArrayPattern") {
    for (const [index, element] of pattern.elements.entries()) {
      if (element.type === "RestElement") {
        const restTemp = nextDestructureTempName(context);
        lines.push(`${indent}jayess::value ${restTemp} = jayess::destructure_rest_array(${sourceExpr}, ${index});`);
        emitDestructuringAssignments(element.argument, restTemp, context, lines, indent, declareBindings);
        continue;
      }
      const elementTemp = nextDestructureTempName(context);
      lines.push(
        `${indent}jayess::value ${elementTemp} = jayess::destructure_index(${sourceExpr}, jayess::value(static_cast<double>(${index})));`
      );
      emitDestructuringAssignments(element, elementTemp, context, lines, indent, declareBindings);
    }
    return;
  }

  if (pattern.type === "ObjectPattern") {
    const excludedKeys = collectObjectPatternKeys(pattern);
    for (const property of pattern.properties) {
      if (property.type === "RestElement") {
        const restTemp = nextDestructureTempName(context);
        lines.push(`${indent}jayess::value ${restTemp} = jayess::destructure_rest_object(${sourceExpr}, {${excludedKeys.join(", ")}});`);
        emitDestructuringAssignments(property.argument, restTemp, context, lines, indent, declareBindings);
        continue;
      }
      const propertyTemp = nextDestructureTempName(context);
      lines.push(
        `${indent}jayess::value ${propertyTemp} = jayess::destructure_property(${sourceExpr}, ${renderPatternKey(property.key)});`
      );
      emitDestructuringAssignments(property.value, propertyTemp, context, lines, indent, declareBindings);
    }
  }
}

function renderVariableDeclaration(node, context) {
  return node.declarations
    .map((declaration) => {
      const init = declaration.init == null ? renderNullValue() : renderExpression(declaration.init, context);
      return `jayess::value ${declaration.id.name} = ${init}`;
    })
    .join(", ");
}

function emitVariableDeclarationStatement(node, context, lines, indent, declarePatternBindings = true) {
  const plainDeclarations = node.declarations.filter((declaration) => !isBindingPattern(declaration.id));
  if (plainDeclarations.length > 0) {
    lines.push(`${indent}${renderVariableDeclaration({ ...node, declarations: plainDeclarations }, context)};`);
  }

  for (const declaration of node.declarations) {
    if (!isBindingPattern(declaration.id)) {
      continue;
    }
    const tempName = nextDestructureTempName(context);
    const init = renderExpression(declaration.init, context);
    lines.push(`${indent}jayess::value ${tempName} = ${init};`);
    emitDestructuringAssignments(declaration.id, tempName, context, lines, indent, declarePatternBindings);
  }
}

function renderForInitializer(node, context, lines, indent) {
  if (node == null) {
    return "";
  }

  if (node.type !== "VariableDeclaration") {
    return renderExpression(node, context);
  }

  if (!node.declarations.some((declaration) => isBindingPattern(declaration.id))) {
    return renderVariableDeclaration(node, context);
  }

  emitVariableDeclarationStatement(node, context, lines, indent);
  return "";
}

function emitStatement(node, context, lines, depth = 0) {
  const indent = "  ".repeat(depth);

  switch (node.type) {
    case "VariableDeclaration":
      emitVariableDeclarationStatement(node, context, lines, indent, !(context.topLevel === true && node.declarations.some((declaration) => isBindingPattern(declaration.id))));
      return;
    case "ExpressionStatement":
      lines.push(`${indent}${renderExpression(node.expression, context)};`);
      return;
    case "ReturnStatement":
      if (context.asyncResultName != null) {
        const resolvedValue = node.argument == null
          ? renderNullValue()
          : renderExpression(node.argument, context);
        lines.push(`${indent}jayess::async_resolve(${context.asyncResultName}, ${resolvedValue});`);
        lines.push(`${indent}return ${context.asyncResultName};`);
        return;
      }
      lines.push(`${indent}return ${node.argument == null ? renderNullValue() : renderExpression(node.argument, context)};`);
      return;
    case "IfStatement":
      lines.push(`${indent}if (jayess::truthy(${renderExpression(node.test, context)})) {`);
      emitStatement(node.consequent, { ...context, topLevel: false }, lines, depth + 1);
      lines.push(`${indent}}`);
      if (node.alternate != null) {
        lines.push(`${indent}else {`);
        emitStatement(node.alternate, { ...context, topLevel: false }, lines, depth + 1);
        lines.push(`${indent}}`);
      }
      return;
    case "WhileStatement":
      lines.push(`${indent}while (jayess::truthy(${renderExpression(node.test, context)})) {`);
      emitStatement(node.body, { ...context, topLevel: false, breakTarget: null, continueTarget: null }, lines, depth + 1);
      lines.push(`${indent}}`);
      return;
    case "DoWhileStatement":
      lines.push(`${indent}do {`);
      emitStatement(node.body, { ...context, topLevel: false, breakTarget: null, continueTarget: null }, lines, depth + 1);
      lines.push(`${indent}} while (jayess::truthy(${renderExpression(node.test, context)}));`);
      return;
    case "ForStatement": {
      const forPrefixLines = [];
      const init = renderForInitializer(node.init, context, forPrefixLines, `${indent}  `);
      const test = node.test == null ? "true" : `jayess::truthy(${renderExpression(node.test, context)})`;
      const update = node.update == null ? "" : renderExpression(node.update, context);
      if (forPrefixLines.length > 0) {
        lines.push(`${indent}{`);
        lines.push(...forPrefixLines);
        lines.push(`${indent}  for (${init}; ${test}; ${update}) {`);
        emitStatement(node.body, { ...context, topLevel: false, breakTarget: null, continueTarget: null }, lines, depth + 2);
        lines.push(`${indent}  }`);
        lines.push(`${indent}}`);
        return;
      }
      lines.push(`${indent}for (${init}; ${test}; ${update}) {`);
      emitStatement(node.body, { ...context, topLevel: false, breakTarget: null, continueTarget: null }, lines, depth + 1);
      lines.push(`${indent}}`);
      return;
    }
    case "SwitchStatement": {
      const switchEndLabel = nextSwitchLabel(context);
      lines.push(`${indent}{`);
      lines.push(`${indent}  jayess::value jayess_switch_value = ${renderExpression(node.discriminant, context)};`);
      for (const [index, switchCaseNode] of node.cases.entries()) {
        const prefix = switchCaseNode.test == null
          ? (index === 0 ? "if" : "else")
          : (index === 0 ? "if" : "else if");
        const condition = switchCaseNode.test == null
          ? ""
          : ` (std::get<bool>(jayess::equal(jayess_switch_value, ${renderExpression(switchCaseNode.test, context)})))`;
        lines.push(`${indent}  ${prefix}${condition} {`);
        for (const statement of switchCaseNode.consequent) {
          emitStatement(statement, { ...context, topLevel: false, breakTarget: switchEndLabel }, lines, depth + 2);
        }
        lines.push(`${indent}  }`);
      }
      lines.push(`${indent}${switchEndLabel}:;`);
      lines.push(`${indent}}`);
      return;
    }
    case "TryStatement":
      lines.push(`${indent}{`);
      if (node.finalizer != null) {
        lines.push(`${indent}  jayess::finally_guard jayess_finally([&]() {`);
        emitStatement(node.finalizer, { ...context, topLevel: false }, lines, depth + 2);
        lines.push(`${indent}  });`);
      }
      if (node.handler != null) {
        lines.push(`${indent}  try {`);
        emitStatement(node.block, { ...context, topLevel: false }, lines, depth + 2);
        lines.push(`${indent}  } catch (const jayess::thrown_value& jayess_error) {`);
        if (node.handler.param != null) {
          lines.push(`${indent}    jayess::value ${node.handler.param.name} = jayess::exception_to_value(jayess_error);`);
        }
        emitStatement(node.handler.body, { ...context, topLevel: false }, lines, depth + 2);
        lines.push(`${indent}  } catch (const std::exception& jayess_error) {`);
        if (node.handler.param != null) {
          lines.push(`${indent}    jayess::value ${node.handler.param.name} = jayess::exception_to_value(jayess_error);`);
        }
        emitStatement(node.handler.body, { ...context, topLevel: false }, lines, depth + 2);
        lines.push(`${indent}  }`);
      } else {
        emitStatement(node.block, { ...context, topLevel: false }, lines, depth + 1);
      }
      lines.push(`${indent}}`);
      return;
    case "ThrowStatement":
      lines.push(`${indent}jayess::throw_value(${renderExpression(node.argument, context)});`);
      return;
    case "BreakStatement":
      if (context.breakTarget != null) {
        lines.push(`${indent}goto ${context.breakTarget};`);
        return;
      }
      lines.push(`${indent}break;`);
      return;
    case "ContinueStatement":
      lines.push(`${indent}continue;`);
      return;
    case "ClassDeclaration":
      if (node.id != null) {
        lines.push(`${indent}jayess::value ${node.id.name} = ${renderClassValue(node, context, emitParameterInitialization, emitStatement, renderExpression, hasSpreadArgument, pushRenderedCallArguments)};`);
      }
      return;
    case "BlockStatement":
      for (const statement of node.body) {
        emitStatement(statement, { ...context, topLevel: false }, lines, depth);
      }
      return;
    default:
      return;
  }
}

function emitFunction(node, context, lines) {
  if (node.async) {
    emitAsyncFunction(node, context, lines, emitParameterInitialization, emitStatement);
    return;
  }
  if (node.generator) {
    emitGeneratorFunction(node, context, lines, renderExpression, emitParameterInitialization);
    return;
  }
  lines.push(`jayess::value ${node.id.name}(const std::vector<jayess::value>& jayess_args) {`);
  lines.push("  jayess::scope_cleanup_frame jayess_scope;");
  for (const [index, param] of node.params.entries()) {
    emitParameterInitialization(param, index, context, lines);
  }
  emitStatement(node.body, context, lines, 1);
  lines.push(`  return ${renderNullValue()};`);
  lines.push("}");
}

function collectHeaderIncludes(imports, includeOverrides = new Map()) {
  const headers = new Set();

  for (const entry of imports) {
    const classification = classifyImport(entry.source);
    if (classification.kind === "cpp-header") {
      headers.add(`#include <${classification.header}>`);
    }
    if (classification.kind === "native-header") {
      headers.add(`#include ${JSON.stringify(includeOverrides.get(entry.source) ?? entry.source)}`);
    }
  }

  return [...headers].sort();
}

export function emitModule({ ast, analysis, moduleStem, dependencies = new Map(), includeOverrides = new Map(), standalone = false }) {
  const namespace = toModuleNamespace(moduleStem);
  const importBindings = new Map();
  const dependencyHeaders = [...dependencies.values()]
    .map((dependency) => `#include ${JSON.stringify(dependency.header)}`)
    .sort();

  for (const entry of analysis.imports) {
    for (const specifier of entry.specifiers) {
      importBindings.set(specifier.local, {
        importedName: specifier.imported,
        importSource: entry.source,
        importKind: specifier.kind
      });
    }
  }

  const context = { dependencies, importBindings, namespace, tempState: { nextDestructureIndex: 0, nextSwitchIndex: 0 } };
  const headerLines = standalone
    ? []
    : [
        "#pragma once",
        '#include "runtime/jayess_runtime.hpp"',
        ...dependencyHeaders,
        ...collectHeaderIncludes(analysis.imports, includeOverrides),
        "",
        `namespace ${namespace} {`
      ];
  const cppLines = [
    ...(standalone ? ['#include "runtime/jayess_runtime.hpp"', ...collectHeaderIncludes(analysis.imports, includeOverrides)] : [`#include "${moduleStem}.hpp"`]),
    "",
    `namespace ${namespace} {`
  ];
  const globalLines = [];
  const standaloneDeclarations = [];
  const exportAliasLines = [];
  const explicitExportNames = new Set(
    analysis.exports
      .map((entry) => entry.exportedName)
      .filter((name) => name !== "*" && name !== "default")
  );
  let hasModuleInit = false;

  cppLines.unshift(...dependencyHeaders);

  const moduleStatements = [];

  for (const statement of ast.body) {
    if (statement.type === "ImportDeclaration") {
      continue;
    }

    if (statement.type === "FunctionDeclaration") {
      if (!standalone) {
        headerLines.push(`jayess::value ${statement.id.name}(const std::vector<jayess::value>& jayess_args);`);
      }
      emitFunction(statement, context, cppLines);
      cppLines.push("");
      continue;
    }

    if (statement.type === "ClassDeclaration") {
      if (standalone) {
        standaloneDeclarations.push(`extern jayess::value ${statement.id.name};`);
      }
      if (!standalone) {
        headerLines.push(`extern jayess::value ${statement.id.name};`);
      }
      globalLines.push(`jayess::value ${statement.id.name} = ${renderClassValue(statement, context, emitParameterInitialization, emitStatement, renderExpression, hasSpreadArgument, pushRenderedCallArguments)};`);
      continue;
    }

    if (statement.type === "VariableDeclaration") {
      for (const declaration of statement.declarations) {
        for (const identifier of collectBindingIdentifiers(declaration.id)) {
          if (!standalone) {
            headerLines.push(`extern jayess::value ${identifier.name};`);
          }
          const init = isBindingPattern(declaration.id) ? renderNullValue() : declaration.init == null ? renderNullValue() : renderExpression(declaration.init, context);
          globalLines.push(`jayess::value ${identifier.name} = ${init};`);
        }
      }
      if (statement.declarations.some((declaration) => isBindingPattern(declaration.id))) {
        moduleStatements.push(statement);
      }
      continue;
    }

    if (statement.type === "ExportNamedDeclaration") {
      if (statement.declaration?.type === "FunctionDeclaration") {
        const declaration = statement.declaration;
        if (!standalone) {
          headerLines.push(`jayess::value ${declaration.id.name}(const std::vector<jayess::value>& jayess_args);`);
        }
        emitFunction(declaration, context, cppLines);
        cppLines.push("");
      } else {
        if (statement.declaration != null) {
          if (statement.declaration.type === "VariableDeclaration") {
            for (const declaration of statement.declaration.declarations) {
              for (const identifier of collectBindingIdentifiers(declaration.id)) {
                if (standalone) {
                  standaloneDeclarations.push(`extern jayess::value ${identifier.name};`);
                }
                if (!standalone) {
                  headerLines.push(`extern jayess::value ${identifier.name};`);
                }
                const init = isBindingPattern(declaration.id) ? renderNullValue() : declaration.init == null ? renderNullValue() : renderExpression(declaration.init, context);
                globalLines.push(`jayess::value ${identifier.name} = ${init};`);
              }
            }
            if (statement.declaration.declarations.some((declaration) => isBindingPattern(declaration.id))) {
              moduleStatements.push(statement.declaration);
            }
          }
          if (statement.declaration.type === "ClassDeclaration") {
            if (standalone) {
              standaloneDeclarations.push(`extern jayess::value ${statement.declaration.id.name};`);
            }
            if (!standalone) {
              headerLines.push(`extern jayess::value ${statement.declaration.id.name};`);
            }
            globalLines.push(`jayess::value ${statement.declaration.id.name} = ${renderClassValue(statement.declaration, context, emitParameterInitialization, emitStatement, renderExpression, hasSpreadArgument, pushRenderedCallArguments)};`);
          }
        } else if (!standalone) {
          for (const specifier of statement.specifiers) {
            if (statement.source == null) {
              if (specifier.exportedName !== specifier.localName) {
                exportAliasLines.push(renderLocalExportAlias(specifier));
              }
              continue;
            }

            const dependency = dependencies.get(statement.source);
            if (dependency != null) {
              exportAliasLines.push(renderReExportAlias(specifier, dependency));
            }
          }
        }
      }
      continue;
    }

    if (statement.type === "ExportAllDeclaration" && !standalone) {
      const dependency = dependencies.get(statement.source);
      if (dependency != null) {
        for (const exportedName of dependency.exportNames ?? []) {
          if (explicitExportNames.has(exportedName)) {
            continue;
          }
          exportAliasLines.push(renderExportAllAlias(exportedName, dependency));
        }
      }
      continue;
    }

    if (statement.type === "ExportDefaultDeclaration") {
      if (standalone) {
        standaloneDeclarations.push("extern jayess::value __default_export__;");
      }
      if (!standalone) {
        headerLines.push("extern jayess::value __default_export__;");
      }
      if (statement.declaration.type === "FunctionDeclaration") {
        if (!standalone) {
          headerLines.push(`jayess::value ${statement.declaration.id.name}(const std::vector<jayess::value>& jayess_args);`);
        }
        emitFunction(statement.declaration, context, cppLines);
        cppLines.push("");
        globalLines.push(`jayess::value __default_export__ = ${renderFunctionExportValue(statement.declaration, context)};`);
        continue;
      }
      if (statement.declaration.type === "ClassDeclaration") {
        if (statement.declaration.id != null) {
          if (standalone) {
            standaloneDeclarations.push(`extern jayess::value ${statement.declaration.id.name};`);
          }
          if (!standalone) {
            headerLines.push(`extern jayess::value ${statement.declaration.id.name};`);
          }
          globalLines.push(`jayess::value ${statement.declaration.id.name} = ${renderClassValue(statement.declaration, context, emitParameterInitialization, emitStatement, renderExpression, hasSpreadArgument, pushRenderedCallArguments)};`);
          globalLines.push("jayess::value __default_export__ = " + statement.declaration.id.name + ";");
          continue;
        }
        globalLines.push(`jayess::value __default_export__ = ${renderClassValue(statement.declaration, context, emitParameterInitialization, emitStatement, renderExpression, hasSpreadArgument, pushRenderedCallArguments)};`);
        continue;
      }
      const init = renderExpression(statement.declaration, context);
      globalLines.push(`jayess::value __default_export__ = ${init};`);
      continue;
    }

    moduleStatements.push(statement);
  }

  const uniqueExportAliasLines = [...new Set(exportAliasLines)].sort();
  const uniqueStandaloneDeclarations = [...new Set(standaloneDeclarations)];
  if (standalone && uniqueStandaloneDeclarations.length > 0) {
    const namespaceInsertIndex = cppLines.indexOf(`namespace ${namespace} {`) + 1;
    cppLines.splice(namespaceInsertIndex, 0, ...uniqueStandaloneDeclarations, "");
  }

  if (!standalone) {
    headerLines.push(...uniqueExportAliasLines);
    headerLines.push("jayess::value jayess_module_init();");
  } else {
    cppLines.push(...uniqueExportAliasLines);
  }

    if (moduleStatements.length > 0) {
      hasModuleInit = true;
      cppLines.push("jayess::value jayess_module_init() {");
      cppLines.push("  jayess::scope_cleanup_frame jayess_scope;");
      for (const statement of moduleStatements) {
        emitStatement(statement, { ...context, topLevel: true }, cppLines, 1);
      }
      cppLines.push(`  return ${renderNullValue()};`);
      cppLines.push("}");
  } else {
    cppLines.push("jayess::value jayess_module_init() {");
    cppLines.push("  jayess::scope_cleanup_frame jayess_scope;");
    cppLines.push(`  return ${renderNullValue()};`);
    cppLines.push("}");
  }

  for (const line of globalLines) {
    cppLines.push(line);
  }

  if (!standalone) {
    headerLines.push("}");
  }
  cppLines.push(`} // namespace ${namespace}`);

  return {
    namespace,
    headerSource: standalone ? "" : `${headerLines.join("\n")}\n`,
    cppSource: `${cppLines.join("\n")}\n`
  };
}
