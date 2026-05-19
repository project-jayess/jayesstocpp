import { collectBindingIdentifiers, isBindingPattern } from "../ast/binding-patterns.js";
import { renderBinary } from "./emit-binary.js";
import { emitDestructuringAssignments } from "./emit-destructuring.js";

function containsYieldExpression(node) {
  if (node == null || typeof node !== "object") {
    return false;
  }
  if (node.type === "YieldExpression") {
    return true;
  }

  switch (node.type) {
    case "FunctionDeclaration":
    case "FunctionExpression":
    case "ArrowFunctionExpression":
    case "ClassDeclaration":
      return false;
    default:
      break;
  }

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      if (value.some((item) => containsYieldExpression(item))) {
        return true;
      }
      continue;
    }
    if (containsYieldExpression(value)) {
      return true;
    }
  }

  return false;
}

function collectGeneratorLocalNames(node, names = new Set()) {
  if (node == null) {
    return names;
  }

  switch (node.type) {
    case "BlockStatement":
      for (const statement of node.body) {
        collectGeneratorLocalNames(statement, names);
      }
      return names;
    case "VariableDeclaration":
      for (const declaration of node.declarations) {
        for (const identifier of collectBindingIdentifiers(declaration.id)) {
          names.add(identifier.name);
        }
      }
      return names;
    case "IfStatement":
      collectGeneratorLocalNames(node.consequent, names);
      collectGeneratorLocalNames(node.alternate, names);
      return names;
    case "WhileStatement":
      collectGeneratorLocalNames(node.body, names);
      return names;
    case "ForStatement":
      collectGeneratorLocalNames(node.init, names);
      collectGeneratorLocalNames(node.body, names);
      return names;
    case "FunctionDeclaration":
    case "FunctionExpression":
    case "ArrowFunctionExpression":
    case "ClassDeclaration":
      return names;
    default:
      return names;
  }
}

class GeneratorLoweringContext {
  constructor() {
    this.nextState = 1;
    this.nextDelegate = 0;
    this.nextExpressionTemp = 0;
    this.declaredDelegates = [];
    this.declaredDestructureTemps = [];
    this.declaredExpressionTemps = [];
  }

  allocateState() {
    const state = this.nextState;
    this.nextState += 1;
    return state;
  }

  allocateDelegate() {
    const name = `jayess_delegate_${this.nextDelegate}`;
    const valueName = `${name}_value`;
    this.nextDelegate += 1;
    this.declaredDelegates.push(name);
    this.declaredDelegates.push(valueName);
    return { name, valueName };
  }

  allocateDestructureTemp(context) {
    const index = context.tempState.nextDestructureIndex;
    context.tempState.nextDestructureIndex += 1;
    const name = `jayess_destructure_${index}`;
    this.declaredDestructureTemps.push(name);
    return name;
  }

  allocateExpressionTemp() {
    const name = `jayess_yield_expr_${this.nextExpressionTemp}`;
    this.nextExpressionTemp += 1;
    this.declaredExpressionTemps.push(name);
    return name;
  }
}

function nextGeneratorDestructureTempName(context, loweringContext) {
  return loweringContext.allocateDestructureTemp(context);
}

function generatorDestructureOptions(loweringContext, renderExpression) {
  return {
    declareBindings: false,
    declareTemps: false,
    nextTempName: (context) => nextGeneratorDestructureTempName(context, loweringContext),
    renderExpression
  };
}

function emitDirectYield(argumentNode, context, lines, renderExpression, loweringContext, onResumeLines = []) {
  const nextState = loweringContext.allocateState();
  lines.push(`      jayess::generator_yield(jayess_generator, ${nextState}, ${renderExpression(argumentNode, context)});`);
  lines.push("      return;");
  lines.push(`    case ${nextState}:;`);
  for (const line of onResumeLines) {
    lines.push(line);
  }
}

function emitDelegatedYield(argumentNode, context, lines, renderExpression, loweringContext, onCompleteLines = []) {
  const delegate = loweringContext.allocateDelegate();
  const loopState = loweringContext.allocateState();

  lines.push(`      ${delegate.name} = ${renderExpression(argumentNode, context)};`);
  lines.push(`    case ${loopState}:;`);
  lines.push(`      ${delegate.valueName} = jayess::generator_resume(${delegate.name});`);
  lines.push(`      if (jayess::generator_is_completed(${delegate.name})) {`);
  for (const line of onCompleteLines) {
    lines.push(line.replaceAll("__DELEGATED_VALUE__", delegate.valueName));
  }
  lines.push("      } else {");
  lines.push(`        jayess::generator_yield(jayess_generator, ${loopState}, ${delegate.valueName});`);
  lines.push("        return;");
  lines.push("      }");
}

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

function emitStableGeneratorExpressionValue(node, context, lines, renderExpression, loweringContext) {
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

function emitGeneratorExpressionValue(node, context, lines, renderExpression, loweringContext) {
  if (!containsYieldExpression(node)) {
    return renderExpression(node, context);
  }

  switch (node.type) {
    case "YieldExpression":
      return emitGeneratorYieldExpression(node, context, lines, renderExpression, loweringContext);
    case "BinaryExpression": {
      if (node.operator === "&&" || node.operator === "||" || node.operator === "??") {
        throw new Error("Generator expression lowering does not support short-circuit expression-yield forms yet");
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
    default:
      throw new Error("Generator lowering currently supports selected expression-yield positions only");
  }
}

function emitGeneratorVariableDeclaration(node, context, lines, renderExpression, loweringContext) {
  for (const declaration of node.declarations) {
    const isPattern = isBindingPattern(declaration.id);
    const name = isPattern ? nextGeneratorDestructureTempName(context, loweringContext) : declaration.id.name;
    if (declaration.init == null) {
      if (isPattern) {
        lines.push(`      ${name} = jayess::value(std::monostate{});`);
        emitDestructuringAssignments(declaration.id, name, context, lines, "      ", generatorDestructureOptions(loweringContext, renderExpression));
      } else {
        lines.push(`      ${name} = 0.0;`);
      }
      continue;
    }

    if (declaration.init.type === "YieldExpression") {
      if (declaration.init.delegate) {
        const completeLines = [`        ${name} = __DELEGATED_VALUE__;`];
        emitDelegatedYield(
          declaration.init.argument,
          context,
          lines,
          renderExpression,
          loweringContext,
          completeLines
        );
        if (isPattern) {
          emitDestructuringAssignments(declaration.id, name, context, lines, "      ", generatorDestructureOptions(loweringContext, renderExpression));
        }
        continue;
      }
      const resumeLines = isPattern
        ? [`      ${name} = jayess::generator_take_sent(jayess_generator);`]
        : [`      ${name} = jayess::generator_take_sent(jayess_generator);`];
      emitDirectYield(
        declaration.init.argument,
        context,
        lines,
        renderExpression,
        loweringContext,
        resumeLines
      );
      if (isPattern) {
        emitDestructuringAssignments(declaration.id, name, context, lines, "      ", generatorDestructureOptions(loweringContext, renderExpression));
      }
      continue;
    }

    if (isPattern) {
      lines.push(`      ${name} = ${emitGeneratorExpressionValue(declaration.init, context, lines, renderExpression, loweringContext)};`);
      emitDestructuringAssignments(declaration.id, name, context, lines, "      ", generatorDestructureOptions(loweringContext, renderExpression));
      continue;
    }

    lines.push(`      ${name} = ${emitGeneratorExpressionValue(declaration.init, context, lines, renderExpression, loweringContext)};`);
  }
}

function emitGeneratorStatement(node, context, lines, renderExpression, loweringContext) {
  switch (node.type) {
    case "BlockStatement":
      for (const statement of node.body) {
        emitGeneratorStatement(statement, context, lines, renderExpression, loweringContext);
      }
      return;
    case "VariableDeclaration":
      emitGeneratorVariableDeclaration(node, context, lines, renderExpression, loweringContext);
      return;
    case "ExpressionStatement":
      if (node.expression.type === "YieldExpression") {
        if (node.expression.delegate) {
          emitDelegatedYield(node.expression.argument, context, lines, renderExpression, loweringContext);
          return;
        }
        emitDirectYield(node.expression.argument, context, lines, renderExpression, loweringContext);
        return;
      }
      lines.push(`      ${emitGeneratorExpressionValue(node.expression, context, lines, renderExpression, loweringContext)};`);
      return;
    case "IfStatement":
      if (containsYieldExpression(node.test)) {
        throw new Error("Generator lowering currently supports only direct yield and yield* positions");
      }
      lines.push(`      if (jayess::truthy(${renderExpression(node.test, context)})) {`);
      emitGeneratorStatement(node.consequent, context, lines, renderExpression, loweringContext);
      lines.push("      }");
      if (node.alternate != null) {
        lines.push("      else {");
        emitGeneratorStatement(node.alternate, context, lines, renderExpression, loweringContext);
        lines.push("      }");
      }
      return;
    case "WhileStatement":
      if (containsYieldExpression(node.test)) {
        throw new Error("Generator lowering currently supports only direct yield and yield* positions");
      }
      lines.push(`      while (jayess::truthy(${renderExpression(node.test, context)})) {`);
      emitGeneratorStatement(node.body, context, lines, renderExpression, loweringContext);
      lines.push("      }");
      return;
    case "ForStatement":
      if (node.test != null && containsYieldExpression(node.test)) {
        throw new Error("Generator lowering currently supports only direct yield and yield* positions");
      }
      if (node.update != null && containsYieldExpression(node.update)) {
        throw new Error("Generator lowering currently supports only direct yield and yield* positions");
      }
      lines.push("      {");
      if (node.init != null) {
        if (node.init.type === "VariableDeclaration") {
          emitGeneratorVariableDeclaration(node.init, context, lines, renderExpression, loweringContext);
        } else {
          if (containsYieldExpression(node.init)) {
            throw new Error("Generator lowering currently supports only direct yield and yield* positions");
          }
          lines.push(`      ${renderExpression(node.init, context)};`);
        }
      }
      const test = node.test == null ? "true" : `jayess::truthy(${renderExpression(node.test, context)})`;
      lines.push(`      while (${test}) {`);
      emitGeneratorStatement(node.body, context, lines, renderExpression, loweringContext);
      if (node.update != null) {
        lines.push(`      ${renderExpression(node.update, context)};`);
      }
      lines.push("      }");
      lines.push("      }");
      return;
    case "ReturnStatement":
      if (node.argument == null) {
        lines.push("      jayess::generator_complete(jayess_generator, jayess::value(std::monostate{}));");
        lines.push("      return;");
        return;
      }
      if (node.argument.type === "YieldExpression") {
        if (node.argument.delegate) {
          emitDelegatedYield(
            node.argument.argument,
            context,
            lines,
            renderExpression,
            loweringContext,
            [
              "        jayess::generator_complete(jayess_generator, __DELEGATED_VALUE__);",
              "        return;"
            ]
          );
          return;
        }
        emitDirectYield(
          node.argument.argument,
          context,
          lines,
          renderExpression,
          loweringContext,
          [
            "      jayess::generator_complete(jayess_generator, jayess::generator_take_sent(jayess_generator));",
            "      return;"
          ]
        );
        return;
      }
      lines.push(`      jayess::generator_complete(jayess_generator, ${emitGeneratorExpressionValue(node.argument, context, lines, renderExpression, loweringContext)});`);
      lines.push("      return;");
      return;
    case "ThrowStatement":
      if (containsYieldExpression(node.argument)) {
        throw new Error("Generator lowering currently supports only direct yield and yield* positions");
      }
      lines.push(`      jayess::generator_fail(jayess_generator, ${renderExpression(node.argument, context)});`);
      lines.push("      return;");
      return;
    default:
      throw new Error(`Generator lowering does not support '${node.type}' yet`);
  }
}

export function emitGeneratorFunction(node, context, lines, renderExpression, emitParameterInitialization) {
  const localNames = [...collectGeneratorLocalNames(node.body)].filter((name) => !node.params.some((param) => param.name === name));
  const bodyLines = [];
  const loweringContext = new GeneratorLoweringContext();

  bodyLines.push("    switch (jayess::generator_next_state(jayess_generator)) {");
  bodyLines.push("    case 0:;");
  emitGeneratorStatement(node.body, context, bodyLines, renderExpression, loweringContext);
  bodyLines.push("      jayess::generator_complete(jayess_generator, jayess::value(std::monostate{}));");
  bodyLines.push("      return;");
  bodyLines.push("    default:");
  bodyLines.push('      throw std::runtime_error("Invalid generator state");');
  bodyLines.push("    }");

  lines.push(`jayess::value ${node.id.name}(const std::vector<jayess::value>& jayess_args) {`);
  emitGeneratorCallableBody(node, context, lines, renderExpression, emitParameterInitialization, bodyLines, loweringContext, localNames);
  lines.push("}");
}

function emitGeneratorCallableBody(node, context, lines, renderExpression, emitParameterInitialization, bodyLines, loweringContext, localNames, options = {}) {
  lines.push("  jayess::value jayess_generator = jayess::make_generator_handle();");
  options.beforeParameters?.(lines);
  for (const [index, param] of node.params.entries()) {
    emitParameterInitialization(param, index, context, lines);
  }
  for (const localName of localNames) {
    lines.push(`  jayess::value ${localName} = 0.0;`);
  }
  for (const tempName of loweringContext.declaredDestructureTemps) {
    lines.push(`  jayess::value ${tempName} = 0.0;`);
  }
  for (const tempName of loweringContext.declaredExpressionTemps) {
    lines.push(`  jayess::value ${tempName} = 0.0;`);
  }
  for (const delegateName of loweringContext.declaredDelegates) {
    lines.push(`  jayess::value ${delegateName} = 0.0;`);
  }
  const captureNames = [
    "jayess_generator",
    ...(options.outerCaptureNames ?? []),
    ...node.params.map((param) => param.name),
    ...localNames,
    ...loweringContext.declaredDestructureTemps,
    ...loweringContext.declaredExpressionTemps,
    ...loweringContext.declaredDelegates
  ];
  lines.push(`  jayess::generator_set_resume(jayess_generator, [${captureNames.join(", ")}]() mutable {`);
  lines.push("    jayess::scope_cleanup_frame jayess_scope;");
  lines.push(...bodyLines);
  lines.push("  });");
  lines.push("  return jayess_generator;");
}

export function renderGeneratorCallableExpression(node, context, renderExpression, emitParameterInitialization, options = {}) {
  const loweringContext = new GeneratorLoweringContext();
  const localNames = [...collectGeneratorLocalNames(node.body)].filter((name) => !node.params.some((param) => param.name === name));
  const bodyLines = [];

  bodyLines.push("    switch (jayess::generator_next_state(jayess_generator)) {");
  bodyLines.push("    case 0:;");
  emitGeneratorStatement(node.body, context, bodyLines, renderExpression, loweringContext);
  bodyLines.push("      jayess::generator_complete(jayess_generator, jayess::value(std::monostate{}));");
  bodyLines.push("      return;");
  bodyLines.push("    default:");
  bodyLines.push('      throw std::runtime_error("Invalid generator state");');
  bodyLines.push("    }");
  const captureList = options.captureList ?? (node.captures ?? []).join(", ");
  const lines = [`jayess::make_callable([${captureList}](const std::vector<jayess::value>& jayess_args) -> jayess::value {`];
  emitGeneratorCallableBody(
    node,
    context,
    lines,
    renderExpression,
    emitParameterInitialization,
    bodyLines,
    loweringContext,
    localNames,
    {
      beforeParameters: options.beforeParameters,
      outerCaptureNames: options.outerCaptureNames ?? node.captures ?? []
    }
  );
  lines.push("})");
  return lines.join("\n");
}
