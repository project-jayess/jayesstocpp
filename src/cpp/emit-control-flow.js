import { withStatementBindings } from "./emit-local-bindings.js";

export function emitReturnStatement(node, context, lines, indent, callbacks) {
  if (context.finallyControl === true) {
    const payload = node.argument == null
      ? callbacks.renderNullValue()
      : callbacks.renderExpression(node.argument, context);
    lines.push(`${indent}throw jayess::finally_return_signal(${payload});`);
    return;
  }
  if (context.asyncResultName != null) {
    const resolvedValue = node.argument == null
      ? callbacks.renderNullValue()
      : callbacks.renderExpression(node.argument, context);
    lines.push(`${indent}jayess::async_resolve(${context.asyncResultName}, ${resolvedValue});`);
    lines.push(`${indent}return ${context.asyncResultName};`);
    return;
  }
  const returnedValue = node.argument == null
    ? callbacks.renderNullValue()
    : callbacks.renderExpression(node.argument, context);
  lines.push(`${indent}return ${returnedValue};`);
}

export function emitThrowStatement(node, context, lines, indent, callbacks) {
  lines.push(`${indent}jayess::throw_value(${callbacks.renderExpression(node.argument, context)});`);
}

export function emitBreakStatement(context, lines, indent) {
  if (context.finallyControl === true) {
    lines.push(`${indent}throw jayess::finally_break_signal{};`);
    return;
  }
  if (context.breakTarget != null) {
    lines.push(`${indent}goto ${context.breakTarget};`);
    return;
  }
  lines.push(`${indent}break;`);
}

export function emitContinueStatement(context, lines, indent) {
  if (context.finallyControl === true) {
    lines.push(`${indent}throw jayess::finally_continue_signal{};`);
    return;
  }
  lines.push(`${indent}continue;`);
}

export function emitBlockStatement(node, context, lines, depth, callbacks) {
  const blockContext = withStatementBindings(context, node.body);
  for (const statement of node.body) {
    callbacks.emitStatement(statement, { ...blockContext, topLevel: false }, lines, depth);
  }
}
