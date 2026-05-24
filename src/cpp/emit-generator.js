import { collectParameterBindingNames } from "../ast/parameters.js";
import { toCppIdentifier } from "./cpp-identifiers.js";
import { collectGeneratorLocalNames, GeneratorLoweringContext } from "./emit-generator-core.js";
import { emitGeneratorStatement } from "./emit-generator-statement.js";

function buildGeneratorBodyLines(node, context, renderExpression, loweringContext) {
  const bodyLines = [];
  bodyLines.push("    switch (jayess::generator_next_state(jayess_generator)) {");
  bodyLines.push("    case 0:;");
  emitGeneratorStatement(node.body, context, bodyLines, renderExpression, loweringContext);
  bodyLines.push("      jayess::generator_complete(jayess_generator, jayess::value(std::monostate{}));");
  bodyLines.push("      return;");
  bodyLines.push("    default:");
  bodyLines.push('      throw std::runtime_error("Invalid generator state");');
  bodyLines.push("    }");
  return bodyLines;
}

function collectLocalNames(node) {
  const parameterNames = collectParameterBindingNames(node.params);
  return [...collectGeneratorLocalNames(node.body)]
    .filter((name) => !parameterNames.includes(name))
    .map((name) => toCppIdentifier(name))
    .sort((left, right) => left.localeCompare(right));
}

function emitGeneratorCallableBody(node, context, lines, emitParameterInitialization, bodyLines, loweringContext, localNames, options = {}) {
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
    ...collectParameterBindingNames(node.params).map((name) => toCppIdentifier(name)),
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

export function emitGeneratorFunction(node, context, lines, renderExpression, emitParameterInitialization) {
  const localNames = collectLocalNames(node);
  const loweringContext = new GeneratorLoweringContext();
  const bodyLines = buildGeneratorBodyLines(node, context, renderExpression, loweringContext);

  lines.push(`jayess::value ${toCppIdentifier(node.id.name)}(const std::vector<jayess::value>& jayess_args) {`);
  emitGeneratorCallableBody(node, context, lines, emitParameterInitialization, bodyLines, loweringContext, localNames);
  lines.push("}");
}

export function renderGeneratorCallableExpression(node, context, renderExpression, emitParameterInitialization, options = {}) {
  const loweringContext = new GeneratorLoweringContext();
  const localNames = collectLocalNames(node);
  const bodyLines = buildGeneratorBodyLines(node, context, renderExpression, loweringContext);
  const captureList = options.captureList ?? (node.captures ?? []).join(", ");
  const lines = [`jayess::make_callable([${captureList}](const std::vector<jayess::value>& jayess_args) -> jayess::value {`];

  emitGeneratorCallableBody(
    node,
    context,
    lines,
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
