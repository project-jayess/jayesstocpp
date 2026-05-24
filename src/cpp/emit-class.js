import { renderAsyncCallableClosure } from "./emit-async.js";
import { renderSyncCallableClosure } from "./emit-callable-closure.js";
import { renderGeneratorCallableExpression } from "./emit-generator.js";
import { isPrivateFieldKey, renderPrivateFieldInitialization, renderPrivateStaticFieldInitialization } from "./emit-private.js";

function emitMethodParameterInitialization(param, index, context, lines, emitParameterInitialization, indent = "  ", offset = 0) {
  emitParameterInitialization(param, index + offset, context, lines, indent);
}

function isSuperConstructorCallExpression(node) {
  return node?.type === "CallExpression" && node.callee.type === "SuperExpression";
}

function isSuperConstructorStatement(node) {
  return node?.type === "ExpressionStatement" && isSuperConstructorCallExpression(node.expression);
}

export function renderSuperMemberExpression(node, context, renderExpression) {
  if (context.classSelfAlias == null || context.thisAlias == null) {
    throw new Error("super member access requires class and this aliases");
  }
  const keyExpr = node.computed
    ? `jayess::property_key_string(${renderExpression(node.property, context)})`
    : JSON.stringify(node.property.name);
  if (context.staticMethod === true) {
    return `jayess::find_static_class_member(jayess::get_base_class(${context.classSelfAlias}), ${keyExpr})`;
  }
  return `jayess::bind_method(${context.thisAlias}, jayess::find_class_method(jayess::get_base_class(${context.classSelfAlias}), ${keyExpr}))`;
}

export function renderSuperConstructorCall(argumentNodes, context, renderExpression, hasSpreadArgument, pushRenderedCallArguments) {
  if (context.classSelfAlias == null || context.thisAlias == null) {
    throw new Error("super constructor calls require class and this aliases");
  }

  const baseClassExpr = `jayess::get_base_class(${context.classSelfAlias})`;
  if (!hasSpreadArgument(argumentNodes)) {
    return `jayess::call_class_constructor(${baseClassExpr}, ${context.thisAlias}, {${argumentNodes.map((arg) => renderExpression(arg, context)).join(", ")}})`;
  }

  const lines = ["([&]() -> jayess::value {"];
  lines.push("  std::vector<jayess::value> jayess_args;");
  pushRenderedCallArguments(argumentNodes, context, lines);
  lines.push(`  return jayess::call_class_constructor(${baseClassExpr}, ${context.thisAlias}, std::move(jayess_args));`);
  lines.push("})()");
  return lines.join("\n");
}

function renderBoundStaticMethodClosure(node, context, emitParameterInitialization, emitStatement, renderExpression, thisAlias = "class_value") {
  const methodContext = { ...context, staticMethod: true };
  const captureList = context.classSelfAlias != null ? `${thisAlias}` : thisAlias;
  if (node.async) {
    return renderAsyncMethodClosure(
      node,
      methodContext,
      captureList,
      emitParameterInitialization,
      emitStatement,
      renderExpression,
      thisAlias,
      0
    );
  }
  if (node.generator) {
    return renderGeneratorMethodClosure(node, methodContext, renderExpression, emitParameterInitialization, thisAlias, 0, [thisAlias], null);
  }
  return renderSyncCallableClosure({
    captureList,
    params: node.params,
    parameterContext: { ...methodContext, thisAlias },
    bodyContext: { ...methodContext, thisAlias },
    emitParameter(param, index, activeContext, lines) {
      emitMethodParameterInitialization(param, index, activeContext, lines, emitParameterInitialization);
    },
    emitBody(activeContext, bodyLines) {
      emitStatement(node.body, activeContext, bodyLines, 1);
    },
    nullReturnExpression: "jayess::value(std::monostate{})"
  });
}

function renderInstanceMethodClosure(node, context, emitParameterInitialization, emitStatement, renderExpression) {
  const captureList = context.classSelfAlias != null ? context.classSelfAlias : "";
  if (node.async) {
    return renderAsyncMethodClosure(
      node,
      context,
      captureList,
      emitParameterInitialization,
      emitStatement,
      renderExpression,
      "this_value",
      1
    );
  }
  if (node.generator) {
    return renderGeneratorMethodClosure(
      node,
      context,
      renderExpression,
      emitParameterInitialization,
      "this_value",
      1,
      [context.classSelfAlias].filter(Boolean),
      "this_value"
    );
  }
  return renderSyncCallableClosure({
    captureList,
    params: node.params,
    parameterContext: { ...context, thisAlias: "this_value" },
    bodyContext: { ...context, thisAlias: "this_value" },
    emitParameter(param, index, activeContext, lines) {
      emitMethodParameterInitialization(param, index, activeContext, lines, emitParameterInitialization, "  ", 1);
    },
    emitBody(activeContext, bodyLines) {
      emitStatement(node.body, activeContext, bodyLines, 1);
    },
    nullReturnExpression: "jayess::value(std::monostate{})",
    beforeParameters(lines) {
      lines.push("  jayess::value this_value = jayess::argument_at(jayess_args, 0);");
    }
  });
}

function renderPrivateInstanceMethodClosure(node, context, emitParameterInitialization, emitStatement, renderExpression, instanceExpr = "this_value") {
  const captures = [context.classSelfAlias, instanceExpr].filter(Boolean);
  if (node.async) {
    return renderAsyncMethodClosure(
      node,
      context,
      captures.join(", "),
      emitParameterInitialization,
      emitStatement,
      renderExpression,
      instanceExpr,
      0
    );
  }
  if (node.generator) {
    return renderGeneratorMethodClosure(
      node,
      context,
      renderExpression,
      emitParameterInitialization,
      instanceExpr,
      0,
      [context.classSelfAlias, instanceExpr].filter(Boolean),
      null
    );
  }
  return renderSyncCallableClosure({
    captureList: captures.join(", "),
    params: node.params,
    parameterContext: { ...context, thisAlias: instanceExpr },
    bodyContext: { ...context, thisAlias: instanceExpr },
    emitParameter(param, index, activeContext, lines) {
      emitMethodParameterInitialization(param, index, activeContext, lines, emitParameterInitialization);
    },
    emitBody(activeContext, bodyLines) {
      emitStatement(node.body, activeContext, bodyLines, 1);
    },
    nullReturnExpression: "jayess::value(std::monostate{})"
  });
}

function renderAsyncMethodClosure(
  node,
  context,
  captureList,
  emitParameterInitialization,
  emitStatement,
  renderExpression,
  thisAlias,
  argumentOffset
) {
  const methodContext = { ...context, thisAlias };
  return renderAsyncCallableClosure(
    node,
    methodContext,
    captureList,
    (param, index, activeContext, activeLines) => {
      emitMethodParameterInitialization(param, index, activeContext, activeLines, emitParameterInitialization, "  ", argumentOffset);
    },
    emitStatement,
    () => {
      throw new Error("Async class methods should not use expression bodies");
    },
    {
      beforeParameters(activeLines) {
        if (thisAlias === "this_value" && argumentOffset === 1) {
          activeLines.push("  jayess::value this_value = jayess::argument_at(jayess_args, 0);");
        }
      }
    }
  );
}

function renderGeneratorMethodClosure(
  node,
  context,
  renderExpression,
  emitParameterInitialization,
  thisAlias,
  argumentOffset,
  captureNames,
  thisArgumentAlias
) {
  const methodContext = { ...context, thisAlias };
  const uniqueCaptureNames = [...new Set(captureNames.filter(Boolean))];
  const outerCaptureNames = [...uniqueCaptureNames];
  if (thisArgumentAlias != null && !outerCaptureNames.includes(thisArgumentAlias)) {
    outerCaptureNames.push(thisArgumentAlias);
  }

  return renderGeneratorCallableExpression(
    node,
    methodContext,
    renderExpression,
    (param, index, activeContext, activeLines) => {
      emitMethodParameterInitialization(param, index, activeContext, activeLines, emitParameterInitialization, "  ", argumentOffset);
    },
    {
      captureList: uniqueCaptureNames.join(", "),
      outerCaptureNames,
      beforeParameters(lines) {
        if (thisArgumentAlias != null) {
          lines.push(`  jayess::value ${thisArgumentAlias} = jayess::argument_at(jayess_args, 0);`);
        }
      }
    }
  );
}

function renderConstructorClosure(
  node,
  context,
  constructorMethod,
  instanceFieldList,
  privateMethodList,
  emitParameterInitialization,
  emitStatement,
  renderExpression,
  hasSpreadArgument,
  pushRenderedCallArguments
) {
  const constructorCaptures = [context.classSelfAlias, ...instanceFieldList.map((field) => field.computedKeyAlias).filter(Boolean)];
  const lines = [`jayess::make_callable([${constructorCaptures.join(", ")}](const std::vector<jayess::value>& jayess_args) -> jayess::value {`];
  lines.push("  jayess::scope_cleanup_frame jayess_scope;");
  lines.push("  jayess::value this_value = jayess::argument_at(jayess_args, 0);");

  if (constructorMethod != null) {
    for (const [index, param] of constructorMethod.params.entries()) {
      emitMethodParameterInitialization(param, index, { ...context, thisAlias: "this_value" }, lines, emitParameterInitialization, "  ", 1);
    }
  }

  const derivedClass = node.base != null;
  let bodyStatements = constructorMethod?.body.body ?? [];

  if (derivedClass) {
    if (constructorMethod == null) {
      lines.push(`  jayess::call_class_constructor(jayess::get_base_class(${context.classSelfAlias}), this_value, {});`);
    } else if (bodyStatements.length > 0 && isSuperConstructorStatement(bodyStatements[0])) {
      lines.push(`  ${renderSuperConstructorCall(bodyStatements[0].expression.arguments, { ...context, thisAlias: "this_value" }, renderExpression, hasSpreadArgument, pushRenderedCallArguments)};`);
      bodyStatements = bodyStatements.slice(1);
    } else {
      throw new Error("Derived constructors currently require 'super(...)' as their first statement");
    }
  }

  for (const method of privateMethodList) {
    lines.push(`  ${renderPrivateFieldInitialization(method, renderPrivateInstanceMethodClosure(method, context, emitParameterInitialization, emitStatement, renderExpression), context, "this_value")};`);
  }

  for (const field of instanceFieldList) {
    const init = field.init == null ? "0.0" : renderExpression(field.init, { ...context, thisAlias: "this_value" });
    if (isPrivateFieldKey(field.key)) {
      lines.push(`  ${renderPrivateFieldInitialization(field, init, context, "this_value")};`);
      continue;
    }
    if (field.computedKeyAlias != null) {
      lines.push(`  jayess::set_index(this_value, ${field.computedKeyAlias}, ${init});`);
      continue;
    }
    lines.push(`  jayess::set_property(this_value, ${JSON.stringify(field.key.name)}, ${init});`);
  }

  if (!derivedClass && constructorMethod != null) {
    bodyStatements = constructorMethod.body.body;
  }

  for (const statement of bodyStatements) {
    emitStatement(statement, { ...context, thisAlias: "this_value" }, lines, 1);
  }

  lines.push("  return this_value;");
  lines.push("})");
  return lines.join("\n");
}

function nextComputedKeyAlias(state) {
  const index = state.nextComputedKeyIndex ?? 0;
  state.nextComputedKeyIndex = index + 1;
  return `jayess_computed_key_${index}`;
}

function emitComputedKeyAlias(node, alias, context, lines, renderExpression) {
  lines.push(`  jayess::value ${alias} = ${renderExpression(node.key, { ...context, thisAlias: "class_value" })};`);
}

export function renderClassValue(
  node,
  context,
  emitParameterInitialization,
  emitStatement,
  renderExpression,
  hasSpreadArgument,
  pushRenderedCallArguments
) {
  const constructorMethod = node.methods.find((method) => method.type === "MethodDefinition" && !method.static && method.kind === "constructor") ?? null;
  const instanceFieldList = [];
  const privateMethodList = [];
  const classContext = node.id != null
    ? { ...context, classSelfName: node.id.name, classSelfAlias: "class_value" }
    : { ...context, classSelfAlias: "class_value" };
  const lines = [
    "([]() -> jayess::value {",
    "  auto class_wrapper = std::make_shared<jayess::callable_value>();",
    "  jayess::value class_value = class_wrapper;"
  ];

  if (node.base != null) {
    lines.push(`  jayess::value base_class = ${renderExpression(node.base, classContext)};`);
    lines.push("  jayess::set_base_class(class_value, base_class);");
  }

  const localTempState = {};
  for (const member of node.methods) {
    if (member.type === "MethodDefinition" && !member.static && member.kind === "constructor") {
      continue;
    }

    if (member.type === "ClassFieldDefinition" && !member.static) {
      if (member.computed) {
        member.computedKeyAlias = nextComputedKeyAlias(localTempState);
        emitComputedKeyAlias(member, member.computedKeyAlias, classContext, lines, renderExpression);
      }
      instanceFieldList.push(member);
      continue;
    }

    if (member.type === "MethodDefinition" && !member.static) {
      if (isPrivateFieldKey(member.key)) {
        privateMethodList.push(member);
        continue;
      }
      if (member.computed) {
        const keyAlias = nextComputedKeyAlias(localTempState);
        emitComputedKeyAlias(member, keyAlias, classContext, lines, renderExpression);
        lines.push(`  jayess::define_dynamic_class_method(class_value, ${keyAlias}, ${renderInstanceMethodClosure(member, classContext, emitParameterInitialization, emitStatement, renderExpression)});`);
        continue;
      }
      lines.push(`  jayess::define_class_method(class_value, ${JSON.stringify(member.key.name)}, ${renderInstanceMethodClosure(member, classContext, emitParameterInitialization, emitStatement, renderExpression)});`);
      continue;
    }

    if (member.type === "ClassFieldDefinition" && member.static) {
      const init = member.init == null ? "0.0" : renderExpression(member.init, { ...classContext, thisAlias: "class_value" });
      if (isPrivateFieldKey(member.key)) {
        lines.push(`  ${renderPrivateStaticFieldInitialization(member, init, classContext)};`);
        continue;
      }
      if (member.computed) {
        const keyAlias = nextComputedKeyAlias(localTempState);
        emitComputedKeyAlias(member, keyAlias, classContext, lines, renderExpression);
        lines.push(`  jayess::set_index(class_value, ${keyAlias}, ${init});`);
        continue;
      }
      lines.push(`  jayess::set_property(class_value, ${JSON.stringify(member.key.name)}, ${init});`);
      continue;
    }

    if (member.type === "MethodDefinition" && member.static) {
      const closure = renderBoundStaticMethodClosure(member, classContext, emitParameterInitialization, emitStatement, renderExpression, "class_value");
      if (isPrivateFieldKey(member.key)) {
        lines.push(`  ${renderPrivateStaticFieldInitialization(member, closure, classContext)};`);
        continue;
      }
      if (member.computed) {
        const keyAlias = nextComputedKeyAlias(localTempState);
        emitComputedKeyAlias(member, keyAlias, classContext, lines, renderExpression);
        lines.push(`  jayess::set_index(class_value, ${keyAlias}, ${closure});`);
        continue;
      }
      lines.push(`  jayess::set_property(class_value, ${JSON.stringify(member.key.name)}, ${closure});`);
      continue;
    }

    if (member.type === "StaticInitializationBlock") {
      lines.push("  {");
      emitStatement(member.body, { ...classContext, thisAlias: "class_value", topLevel: false }, lines, 2);
      lines.push("  }");
    }
  }

  lines.push(`  jayess::set_class_constructor(class_value, ${renderConstructorClosure(node, classContext, constructorMethod, instanceFieldList, privateMethodList, emitParameterInitialization, emitStatement, renderExpression, hasSpreadArgument, pushRenderedCallArguments)});`);
  lines.push("  class_wrapper->fn = [class_value](const std::vector<jayess::value>& jayess_args) -> jayess::value {");
  lines.push("    jayess::scope_cleanup_frame jayess_scope;");
  lines.push("    jayess::value this_value = jayess::make_object({});");
  lines.push("    jayess::set_instance_class(this_value, class_value);");
  lines.push("    jayess::call_class_constructor(class_value, this_value, jayess_args);");
  lines.push("    return this_value;");
  lines.push("  };");
  lines.push("  return class_value;");
  lines.push("})()");
  return lines.join("\n");
}
