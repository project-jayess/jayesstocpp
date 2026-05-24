import { collectBindingIdentifiers } from "../ast/binding-patterns.js";

export function containsYieldExpression(node) {
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

export function collectGeneratorLocalNames(node, names = new Set()) {
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
    case "DoWhileStatement":
      collectGeneratorLocalNames(node.body, names);
      return names;
    case "WhileStatement":
      collectGeneratorLocalNames(node.body, names);
      return names;
    case "ForStatement":
      collectGeneratorLocalNames(node.init, names);
      collectGeneratorLocalNames(node.body, names);
      return names;
    case "SwitchStatement":
      for (const switchCaseNode of node.cases) {
        for (const statement of switchCaseNode.consequent) {
          collectGeneratorLocalNames(statement, names);
        }
      }
      return names;
    case "TryStatement":
      collectGeneratorLocalNames(node.block, names);
      if (node.handler?.param != null) {
        names.add(node.handler.param.name);
      }
      collectGeneratorLocalNames(node.handler?.body, names);
      collectGeneratorLocalNames(node.finalizer, names);
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

export class GeneratorLoweringContext {
  constructor() {
    this.nextState = 1;
    this.nextDelegate = 0;
    this.nextExpressionTemp = 0;
    this.nextTryEndLabel = 0;
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

  allocateTryEndLabel() {
    const name = `jayess_generator_try_end_${this.nextTryEndLabel}`;
    this.nextTryEndLabel += 1;
    return name;
  }
}

export function emitDirectYield(argumentNode, context, lines, renderExpression, loweringContext, onResumeLines = []) {
  const nextState = loweringContext.allocateState();
  lines.push(`      jayess::generator_yield(jayess_generator, ${nextState}, ${renderExpression(argumentNode, context)});`);
  lines.push("      return;");
  lines.push(`    case ${nextState}:;`);
  for (const line of onResumeLines) {
    lines.push(line);
  }
}

export function emitDirectYieldToState(argumentNode, context, lines, renderExpression, nextState) {
  lines.push(`      jayess::generator_yield(jayess_generator, ${nextState}, ${renderExpression(argumentNode, context)});`);
  lines.push("      return;");
}

export function emitDirectYieldWithExternalResume(argumentNode, context, lines, renderExpression, loweringContext) {
  const nextState = loweringContext.allocateState();
  emitDirectYieldToState(argumentNode, context, lines, renderExpression, nextState);
  return nextState;
}

export function emitDelegatedYield(argumentNode, context, lines, renderExpression, loweringContext, onCompleteLines = []) {
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
