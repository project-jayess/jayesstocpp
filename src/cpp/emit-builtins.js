export function isBuiltinLengthMember(node) {
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

function renderArrayPushCall(node, context, helpers) {
  const lines = ["([&]() -> jayess::value {"];
  lines.push(`  jayess::value jayess_object = ${helpers.renderExpression(node.callee.object, context)};`);
  lines.push("  std::vector<jayess::value> jayess_args;");
  helpers.pushRenderedCallArguments(node.arguments, context, lines);
  lines.push("  if (std::holds_alternative<jayess::array_ptr>(jayess_object)) {");
  lines.push("    return jayess::array_push(jayess_object, std::move(jayess_args));");
  lines.push("  }");
  lines.push('  return jayess::call_with_args(jayess::get_property(jayess_object, "push"), std::move(jayess_args));');
  lines.push("})()");
  return lines.join("\n");
}

function renderArrayPopCall(node, context, helpers) {
  const lines = ["([&]() -> jayess::value {"];
  lines.push(`  jayess::value jayess_object = ${helpers.renderExpression(node.callee.object, context)};`);
  lines.push("  if (std::holds_alternative<jayess::array_ptr>(jayess_object)) {");
  lines.push("    return jayess::array_pop(jayess_object);");
  lines.push("  }");
  lines.push('  return jayess::call(jayess::get_property(jayess_object, "pop"));');
  lines.push("})()");
  return lines.join("\n");
}

function renderArrayJoinCall(node, context, helpers) {
  const lines = ["([&]() -> jayess::value {"];
  lines.push(`  jayess::value jayess_object = ${helpers.renderExpression(node.callee.object, context)};`);
  lines.push("  std::vector<jayess::value> jayess_args;");
  helpers.pushRenderedCallArguments(node.arguments, context, lines);
  lines.push("  if (std::holds_alternative<jayess::array_ptr>(jayess_object)) {");
  lines.push("    return jayess::array_join(jayess_object, jayess_args);");
  lines.push("  }");
  lines.push('  return jayess::call_with_args(jayess::get_property(jayess_object, "join"), std::move(jayess_args));');
  lines.push("})()");
  return lines.join("\n");
}

function renderIncludesCall(node, context, helpers) {
  const lines = ["([&]() -> jayess::value {"];
  lines.push(`  jayess::value jayess_object = ${helpers.renderExpression(node.callee.object, context)};`);
  lines.push("  std::vector<jayess::value> jayess_args;");
  helpers.pushRenderedCallArguments(node.arguments, context, lines);
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

function renderToStringCall(node, context, helpers) {
  const lines = ["([&]() -> jayess::value {"];
  lines.push(`  jayess::value jayess_object = ${helpers.renderExpression(node.callee.object, context)};`);
  lines.push("  if (std::holds_alternative<jayess::object_ptr>(jayess_object) || std::holds_alternative<jayess::callable_ptr>(jayess_object)) {");
  lines.push('    return jayess::call(jayess::get_property(jayess_object, "toString"));');
  lines.push("  }");
  lines.push("  return jayess::to_string_value(jayess_object);");
  lines.push("})()");
  return lines.join("\n");
}

function renderStringMethodCall(node, context, helpers, helperName, propertyName) {
  const lines = ["([&]() -> jayess::value {"];
  lines.push(`  jayess::value jayess_object = ${helpers.renderExpression(node.callee.object, context)};`);
  lines.push("  std::vector<jayess::value> jayess_args;");
  helpers.pushRenderedCallArguments(node.arguments, context, lines);
  lines.push("  if (std::holds_alternative<std::string>(jayess_object)) {");
  lines.push(`    return jayess::${helperName}(jayess_object, jayess_args);`);
  lines.push("  }");
  lines.push(`  return jayess::call_with_args(jayess::get_property(jayess_object, ${JSON.stringify(propertyName)}), std::move(jayess_args));`);
  lines.push("})()");
  return lines.join("\n");
}

export function renderBuiltinCallExpression(node, context, helpers) {
  if (isBuiltinArrayPushCall(node)) {
    return renderArrayPushCall(node, context, helpers);
  }
  if (isBuiltinArrayPopCall(node)) {
    return renderArrayPopCall(node, context, helpers);
  }
  if (isBuiltinArrayJoinCall(node)) {
    return renderArrayJoinCall(node, context, helpers);
  }
  if (isBuiltinArrayIncludesCall(node)) {
    return renderIncludesCall(node, context, helpers);
  }
  if (isBuiltinToStringCall(node)) {
    return renderToStringCall(node, context, helpers);
  }

  const stringMethod = getBuiltinStringMethodHelper(node);
  if (stringMethod != null) {
    return renderStringMethodCall(node, context, helpers, stringMethod.helperName, stringMethod.propertyName);
  }

  return null;
}
