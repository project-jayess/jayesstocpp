import { withLocalBindings } from "./emit-local-bindings.js";

function collectFinallyControlFlow(node, flags = { hasAny: false, hasReturn: false, hasBreak: false, hasContinue: false }) {
  if (node == null || typeof node !== "object") {
    return flags;
  }

  switch (node.type) {
    case "ReturnStatement":
      flags.hasAny = true;
      flags.hasReturn = true;
      return flags;
    case "BreakStatement":
      flags.hasAny = true;
      flags.hasBreak = true;
      return flags;
    case "ContinueStatement":
      flags.hasAny = true;
      flags.hasContinue = true;
      return flags;
    case "FunctionDeclaration":
    case "FunctionExpression":
    case "ArrowFunctionExpression":
    case "ClassDeclaration":
      return flags;
    default:
      break;
  }

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        collectFinallyControlFlow(item, flags);
      }
      continue;
    }
    collectFinallyControlFlow(value, flags);
  }
  return flags;
}

function emitFinallySignalHandlers(context, lines, depth, flags) {
  const indent = "  ".repeat(depth);
  if (flags.hasReturn) {
    lines.push(`${indent}catch (const jayess::finally_return_signal& jayess_signal) {`);
    if (context.asyncResultName != null) {
      lines.push(`${indent}  jayess::async_resolve(${context.asyncResultName}, jayess_signal.payload);`);
      lines.push(`${indent}  return ${context.asyncResultName};`);
    } else {
      lines.push(`${indent}  return jayess_signal.payload;`);
    }
    lines.push(`${indent}}`);
  }
  if (flags.hasBreak) {
    lines.push(`${indent}catch (const jayess::finally_break_signal&) {`);
    if (context.breakTarget != null) {
      lines.push(`${indent}  goto ${context.breakTarget};`);
    } else {
      lines.push(`${indent}  break;`);
    }
    lines.push(`${indent}}`);
  }
  if (flags.hasContinue) {
    lines.push(`${indent}catch (const jayess::finally_continue_signal&) {`);
    lines.push(`${indent}  continue;`);
    lines.push(`${indent}}`);
  }
}

export function emitTryStatement(node, context, lines, depth, emitStatement) {
  const indent = "  ".repeat(depth);
  const finallyControl = node.finalizer == null ? { hasAny: false } : collectFinallyControlFlow(node.finalizer);
  if (finallyControl.hasAny) {
    lines.push(`${indent}try {`);
  }
  lines.push(`${indent}{`);
  if (node.finalizer != null) {
    lines.push(`${indent}  jayess::finally_guard jayess_finally([&]() {`);
    emitStatement(node.finalizer, { ...context, topLevel: false, finallyControl: true }, lines, depth + 2);
    lines.push(`${indent}  });`);
  }
  if (node.handler != null) {
    const catchContext = node.handler.param == null
      ? context
      : withLocalBindings(context, [node.handler.param.name]);
    lines.push(`${indent}  try {`);
    emitStatement(node.block, { ...context, topLevel: false }, lines, depth + 2);
    lines.push(`${indent}  } catch (const jayess::thrown_value& jayess_error) {`);
    if (node.handler.param != null) {
      lines.push(`${indent}    jayess::value ${toCppIdentifier(node.handler.param.name)} = jayess::exception_to_value(jayess_error);`);
    }
    emitStatement(node.handler.body, { ...catchContext, topLevel: false }, lines, depth + 2);
    lines.push(`${indent}  } catch (const std::exception& jayess_error) {`);
    if (node.handler.param != null) {
      lines.push(`${indent}    jayess::value ${toCppIdentifier(node.handler.param.name)} = jayess::exception_to_value(jayess_error);`);
    }
    emitStatement(node.handler.body, { ...catchContext, topLevel: false }, lines, depth + 2);
    lines.push(`${indent}  }`);
  } else {
    emitStatement(node.block, { ...context, topLevel: false }, lines, depth + 1);
  }
  lines.push(`${indent}}`);
  if (finallyControl.hasAny) {
    lines.push(`${indent}}`);
    emitFinallySignalHandlers(context, lines, depth, finallyControl);
  }
}
import { toCppIdentifier } from "./cpp-identifiers.js";
