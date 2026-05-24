import { isBindingPattern } from "../ast/binding-patterns.js";
import { toCppIdentifier } from "./cpp-identifiers.js";
import { emitDestructuringAssignments } from "./emit-destructuring.js";
import {
  containsYieldExpression,
  emitDelegatedYield,
  emitDirectYield,
  emitDirectYieldToState,
  emitDirectYieldWithExternalResume
} from "./emit-generator-core.js";
import { emitGeneratorExpressionValue } from "./emit-generator-expression.js";
import {
  canLowerFocusedCatchBodyYield,
  canLowerFocusedTryCatchYield,
  canLowerFocusedTryFinallyYield,
  canLowerMultiYieldTryCatch,
  findDirectYieldStatementIndices,
  findDirectYieldStatementIndex
} from "./generator-try-shapes.js";

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

function emitGeneratorVariableDeclaration(node, context, lines, renderExpression, loweringContext) {
  for (const declaration of node.declarations) {
    const isPattern = isBindingPattern(declaration.id);
    const name = isPattern ? nextGeneratorDestructureTempName(context, loweringContext) : toCppIdentifier(declaration.id.name);
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
      emitDirectYield(
        declaration.init.argument,
        context,
        lines,
        renderExpression,
        loweringContext,
        [`      ${name} = jayess::generator_take_sent(jayess_generator);`]
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

function emitCatchBinding(node, lines, errorName) {
  if (node.handler.param != null) {
    lines.push(`        ${toCppIdentifier(node.handler.param.name)} = jayess::exception_to_value(${errorName});`);
  }
}

function emitCatchBodyPrefix(node, context, lines, renderExpression, loweringContext, yieldIndex) {
  if (node.handler.param != null) {
    lines.push(`        ${toCppIdentifier(node.handler.param.name)} = jayess::exception_to_value(jayess_error);`);
  }
  for (const statement of node.handler.body.body.slice(0, yieldIndex)) {
    emitGeneratorStatement(statement, context, lines, renderExpression, loweringContext);
  }
}

function emitFocusedCatchBodyYield(node, context, lines, renderExpression, loweringContext) {
  if (!canLowerFocusedCatchBodyYield(node, containsYieldExpression)) {
    throw new Error("Generator lowering does not support this catch-body yield shape yet");
  }

  const catchStatements = node.handler.body.body;
  const yieldIndex = findDirectYieldStatementIndex(catchStatements);
  const yieldStatement = catchStatements[yieldIndex];
  const nextState = loweringContext.allocateState();
  lines.push("      try {");
  emitGeneratorStatement(node.block, context, lines, renderExpression, loweringContext);
  lines.push("      } catch (const jayess::thrown_value& jayess_error) {");
  emitCatchBodyPrefix(node, context, lines, renderExpression, loweringContext, yieldIndex);
  emitDirectYieldToState(yieldStatement.expression.argument, context, lines, renderExpression, nextState);
  lines.push("      } catch (const std::exception& jayess_error) {");
  emitCatchBodyPrefix(node, context, lines, renderExpression, loweringContext, yieldIndex);
  emitDirectYieldToState(yieldStatement.expression.argument, context, lines, renderExpression, nextState);
  lines.push("      }");
  lines.push(`    case ${nextState}:;`);
  for (const statement of catchStatements.slice(yieldIndex + 1)) {
    emitGeneratorStatement(statement, context, lines, renderExpression, loweringContext);
  }
}

function emitGeneratorTryCatchStatement(node, context, lines, renderExpression, loweringContext) {
  if (canLowerFocusedCatchBodyYield(node, containsYieldExpression)) {
    emitFocusedCatchBodyYield(node, context, lines, renderExpression, loweringContext);
    return;
  }

  if (canLowerMultiYieldTryCatch(node, containsYieldExpression)) {
    const yieldIndices = findDirectYieldStatementIndices(node.block.body);
    const endLabel = loweringContext.allocateTryEndLabel();
    let segmentStart = 0;
    for (const yieldIndex of yieldIndices) {
      const yieldStatement = node.block.body[yieldIndex];
      lines.push("      try {");
      for (const statement of node.block.body.slice(segmentStart, yieldIndex)) {
        emitGeneratorStatement(statement, context, lines, renderExpression, loweringContext);
      }
      const nextState = emitDirectYieldWithExternalResume(yieldStatement.expression.argument, context, lines, renderExpression, loweringContext);
      lines.push("      } catch (const jayess::thrown_value& jayess_error) {");
      emitCatchBinding(node, lines, "jayess_error");
      emitGeneratorStatement(node.handler.body, context, lines, renderExpression, loweringContext);
      lines.push(`      goto ${endLabel};`);
      lines.push("      } catch (const std::exception& jayess_error) {");
      emitCatchBinding(node, lines, "jayess_error");
      emitGeneratorStatement(node.handler.body, context, lines, renderExpression, loweringContext);
      lines.push(`      goto ${endLabel};`);
      lines.push("      }");
      lines.push(`    case ${nextState}:;`);
      segmentStart = yieldIndex + 1;
    }

    lines.push("      try {");
    for (const statement of node.block.body.slice(segmentStart)) {
      emitGeneratorStatement(statement, context, lines, renderExpression, loweringContext);
    }
    lines.push("      } catch (const jayess::thrown_value& jayess_error) {");
    emitCatchBinding(node, lines, "jayess_error");
    emitGeneratorStatement(node.handler.body, context, lines, renderExpression, loweringContext);
    lines.push(`      goto ${endLabel};`);
    lines.push("      } catch (const std::exception& jayess_error) {");
    emitCatchBinding(node, lines, "jayess_error");
    emitGeneratorStatement(node.handler.body, context, lines, renderExpression, loweringContext);
    lines.push(`      goto ${endLabel};`);
    lines.push("      }");
    lines.push(`      ${endLabel}:;`);
    return;
  }

  if (!canLowerFocusedTryCatchYield(node, containsYieldExpression)) {
    throw new Error("Generator lowering does not support this try/catch yield shape yet");
  }

  const tryStatements = node.block.body;
  const yieldStatement = tryStatements[tryStatements.length - 1];
  lines.push("      try {");
  for (const statement of tryStatements.slice(0, -1)) {
    emitGeneratorStatement(statement, context, lines, renderExpression, loweringContext);
  }
  const nextState = emitDirectYieldWithExternalResume(yieldStatement.expression.argument, context, lines, renderExpression, loweringContext);
  lines.push("      } catch (const jayess::thrown_value& jayess_error) {");
  emitCatchBinding(node, lines, "jayess_error");
  emitGeneratorStatement(node.handler.body, context, lines, renderExpression, loweringContext);
  lines.push("      } catch (const std::exception& jayess_error) {");
  emitCatchBinding(node, lines, "jayess_error");
  emitGeneratorStatement(node.handler.body, context, lines, renderExpression, loweringContext);
  lines.push("      }");
  lines.push(`    case ${nextState}:;`);
}

function emitGeneratorTryFinallyStatement(node, context, lines, renderExpression, loweringContext) {
  if (!canLowerFocusedTryFinallyYield(node, containsYieldExpression)) {
    throw new Error("Generator lowering does not support this try/finally yield shape yet");
  }

  const yieldIndices = findDirectYieldStatementIndices(node.block.body);
  let segmentStart = 0;
  for (const yieldIndex of yieldIndices) {
    const yieldStatement = node.block.body[yieldIndex];
    for (const statement of node.block.body.slice(segmentStart, yieldIndex)) {
      emitGeneratorStatement(statement, context, lines, renderExpression, loweringContext);
    }
    const nextState = emitDirectYieldWithExternalResume(yieldStatement.expression.argument, context, lines, renderExpression, loweringContext);
    lines.push(`    case ${nextState}:;`);
    segmentStart = yieldIndex + 1;
  }

  for (const statement of node.block.body.slice(segmentStart)) {
    emitGeneratorStatement(statement, context, lines, renderExpression, loweringContext);
  }
  emitGeneratorStatement(node.finalizer, context, lines, renderExpression, loweringContext);
}

export function emitGeneratorStatement(node, context, lines, renderExpression, loweringContext) {
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
    case "DoWhileStatement":
      if (containsYieldExpression(node.test)) {
        throw new Error("Generator lowering currently supports only direct yield and yield* positions");
      }
      lines.push("      do {");
      emitGeneratorStatement(node.body, context, lines, renderExpression, loweringContext);
      lines.push(`      } while (jayess::truthy(${renderExpression(node.test, context)}));`);
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
    case "SwitchStatement": {
      if (containsYieldExpression(node.discriminant)) {
        throw new Error("Generator lowering currently supports only direct yield and yield* positions");
      }
      const switchEndLabel = `jayess_generator_switch_end_${loweringContext.allocateState()}`;
      const switchValue = loweringContext.allocateExpressionTemp();
      lines.push("      {");
      lines.push(`        ${switchValue} = ${renderExpression(node.discriminant, context)};`);
      for (const [index, switchCaseNode] of node.cases.entries()) {
        const prefix = switchCaseNode.test == null
          ? (index === 0 ? "if" : "else")
          : (index === 0 ? "if" : "else if");
        const condition = switchCaseNode.test == null
          ? ""
          : ` (std::get<bool>(jayess::equal(${switchValue}, ${renderExpression(switchCaseNode.test, context)})))`;
        lines.push(`        ${prefix}${condition} {`);
        for (const statement of switchCaseNode.consequent) {
          emitGeneratorStatement(statement, { ...context, breakTarget: switchEndLabel }, lines, renderExpression, loweringContext);
        }
        lines.push("        }");
      }
      lines.push(`      ${switchEndLabel}:;`);
      lines.push("      }");
      return;
    }
    case "TryStatement":
      if (node.finalizer != null) {
        emitGeneratorTryFinallyStatement(node, context, lines, renderExpression, loweringContext);
        return;
      }
      emitGeneratorTryCatchStatement(node, context, lines, renderExpression, loweringContext);
      return;
    case "BreakStatement":
      if (context.breakTarget != null) {
        lines.push(`      goto ${context.breakTarget};`);
        return;
      }
      lines.push("      break;");
      return;
    case "ContinueStatement":
      lines.push("      continue;");
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
