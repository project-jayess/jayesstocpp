import { collectBindingIdentifiers, isBindingPattern } from "../ast/binding-patterns.js";

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
    this.declaredDelegates = [];
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
  lines.push("      }");
  lines.push(`      jayess::generator_yield(jayess_generator, ${loopState}, ${delegate.valueName});`);
  lines.push("      return;");
}

function emitGeneratorVariableDeclaration(node, context, lines, renderExpression, loweringContext) {
  for (const declaration of node.declarations) {
    if (isBindingPattern(declaration.id)) {
      throw new Error("Generator lowering does not support destructuring declarations yet");
    }

    const name = declaration.id.name;
    if (declaration.init == null) {
      lines.push(`      ${name} = 0.0;`);
      continue;
    }

    if (declaration.init.type === "YieldExpression") {
      if (declaration.init.delegate) {
        emitDelegatedYield(
          declaration.init.argument,
          context,
          lines,
          renderExpression,
          loweringContext,
          [`        ${name} = __DELEGATED_VALUE__;`]
        );
        continue;
      }
      emitDirectYield(
        declaration.init.argument,
        context,
        lines,
        renderExpression,
        loweringContext,
        [`      ${name} = jayess::value(std::monostate{});`]
      );
      continue;
    }

    if (containsYieldExpression(declaration.init)) {
      throw new Error("Generator lowering currently supports only direct yield and yield* positions");
    }

    lines.push(`      ${name} = ${renderExpression(declaration.init, context)};`);
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
      if (containsYieldExpression(node.expression)) {
        throw new Error("Generator lowering currently supports only direct yield and yield* positions");
      }
      lines.push(`      ${renderExpression(node.expression, context)};`);
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
            "      jayess::generator_complete(jayess_generator, jayess::value(std::monostate{}));",
            "      return;"
          ]
        );
        return;
      }
      if (containsYieldExpression(node.argument)) {
        throw new Error("Generator lowering currently supports only direct yield and yield* positions");
      }
      lines.push(`      jayess::generator_complete(jayess_generator, ${renderExpression(node.argument, context)});`);
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

function emitGeneratorCallableBody(node, context, lines, renderExpression, emitParameterInitialization, bodyLines, loweringContext, localNames, outerCaptureNames = []) {
  lines.push("  jayess::value jayess_generator = jayess::make_generator_handle();");
  for (const [index, param] of node.params.entries()) {
    emitParameterInitialization(param, index, context, lines);
  }
  for (const localName of localNames) {
    lines.push(`  jayess::value ${localName} = 0.0;`);
  }
  for (const delegateName of loweringContext.declaredDelegates) {
    lines.push(`  jayess::value ${delegateName} = 0.0;`);
  }
  const captureNames = ["jayess_generator", ...outerCaptureNames, ...node.params.map((param) => param.name), ...localNames, ...loweringContext.declaredDelegates];
  lines.push(`  jayess::generator_set_resume(jayess_generator, [${captureNames.join(", ")}]() mutable {`);
  lines.push("    jayess::scope_cleanup_frame jayess_scope;");
  lines.push(...bodyLines);
  lines.push("  });");
  lines.push("  return jayess_generator;");
}

export function renderGeneratorCallableExpression(node, context, renderExpression, emitParameterInitialization) {
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
  const captureList = (node.captures ?? []).join(", ");
  const lines = [`jayess::make_callable([${captureList}](const std::vector<jayess::value>& jayess_args) -> jayess::value {`];
  emitGeneratorCallableBody(node, context, lines, renderExpression, emitParameterInitialization, bodyLines, loweringContext, localNames, node.captures ?? []);
  lines.push("})");
  return lines.join("\n");
}
