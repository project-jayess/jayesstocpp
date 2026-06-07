import { collectBindingIdentifiers, isBindingPattern } from "../ast/binding-patterns.js";
import { renderAssignmentExpression } from "./emit-assignment.js";
import { renderArrayExpression } from "./emit-array.js";
import { emitAsyncFunction, renderAsyncCallableExpression, renderAwaitExpression } from "./emit-async.js";
import { isBuiltinLengthMember, renderBuiltinCallExpression } from "./emit-builtins.js";
import { renderSyncCallableClosure } from "./emit-callable-closure.js";
import {
  hasSpreadArgument,
  pushRenderedCallArguments,
  renderCallLikeExpression as renderSharedCallLikeExpression,
  renderOptionalCallExpression as renderSharedOptionalCallExpression
} from "./emit-call.js";
import { renderClassValue, renderSuperConstructorCall, renderSuperMemberExpression } from "./emit-class.js";
import {
  emitBlockStatement,
  emitBreakStatement,
  emitContinueStatement,
  emitReturnStatement,
  emitThrowStatement
} from "./emit-control-flow.js";
import { emitDestructuringAssignments as emitSharedDestructuringAssignments } from "./emit-destructuring.js";
import { collectExportAliasLines } from "./emit-export-aliases.js";
import { emitGeneratorFunction, renderGeneratorCallableExpression } from "./emit-generator.js";
import { renderLiteral } from "./emit-literals.js";
import {
  hasLocalBinding,
  withLoopInitializerBindings,
  withParameterBindings
} from "./emit-local-bindings.js";
import { emitExternValueDeclaration, emitFunctionDeclaration, emitGlobalValueDeclaration } from "./emit-module-declarations.js";
import { renderObjectExpression } from "./emit-object.js";
import { renderBinary, renderUnary } from "./emit-operators.js";
import {
  renderMemberExpression as renderSharedMemberExpression,
  renderOptionalMemberExpression as renderSharedOptionalMemberExpression
} from "./emit-member.js";
import { emitParameterInitialization as emitSharedParameterInitialization } from "./emit-parameters.js";
import { renderTemplateLiteral } from "./emit-template.js";
import { emitTryStatement } from "./emit-try.js";
import { renderUpdateExpression as renderSharedUpdateExpression } from "./emit-update.js";
import {
  emitVariableDeclarationStatement as emitSharedVariableDeclarationStatement,
  renderVariableDeclaration as renderSharedVariableDeclaration
} from "./emit-variable-declaration.js";
import { collectHeaderIncludes, collectImportBindings } from "./module-imports.js";
import { emitModuleInit, emitModuleInitAsync } from "./module-init.js";
import { toModuleNamespace } from "./module-names.js";
import { toCppIdentifier } from "./cpp-identifiers.js";
import { createLifetimeEmissionPlan, renderLifetimeMetadataCommentLines } from "./emit-lifetime-metadata.js";
import { shouldEmitRetainedTopLevelStatement } from "./retained-declarations.js";
import {
  isPrivateMemberExpression,
  renderPrivateMemberExpression
} from "./emit-private.js";

function renderNullValue() {
  return "jayess::value(std::monostate{})";
}

function pushCallArguments(argumentNodes, context, lines, indent = "  ", argsName = "jayess_args") {
  pushRenderedCallArguments(argumentNodes, context, lines, {
    argsName,
    indent,
    renderExpression
  });
}

function emitParameterInitialization(param, index, context, lines, indent = "  ", argsName = "jayess_args") {
  emitSharedParameterInitialization(param, index, context, lines, {
    argsName,
    indent,
    nextTempName: nextDestructureTempName,
    renderExpression
  });
}

function renderUpdateExpression(node, context) {
  return renderSharedUpdateExpression(node, context, renderExpression);
}

function renderIdentifier(node, context) {
  if (context.classSelfName != null && context.classSelfAlias != null && node.name === context.classSelfName) {
    return context.classSelfAlias;
  }
  const localBinding = hasLocalBinding(context, node.name);
  const imported = localBinding ? null : context.importBindings.get(node.name);
  if (imported != null) {
    const dependency = context.dependencies.get(imported.importSource);
    const importedName = imported.importedName === "default" ? "__default_export__" : toCppIdentifier(imported.importedName);
    if (imported.importKind === "namespace") {
      return toCppIdentifier(node.name);
    }
    if (dependency != null) {
      if (dependency.exportedFunctionNames?.includes(importedName)) {
        return renderFunctionReferenceValue(dependency.namespace, importedName);
      }
      return `${dependency.namespace}::${importedName}`;
    }
    return importedName;
  }
  if (!localBinding && context.moduleFunctionNames?.has(node.name)) {
    return renderFunctionValue(node.name, context);
  }
  return toCppIdentifier(node.name);
}

function renderCallTargetExpression(node, context) {
  if (node.type !== "Identifier") {
    return renderExpression(node, context);
  }
  if (context.classSelfName != null && context.classSelfAlias != null && node.name === context.classSelfName) {
    return context.classSelfAlias;
  }
  const localBinding = hasLocalBinding(context, node.name);
  const imported = localBinding ? null : context.importBindings.get(node.name);
  if (imported == null && !localBinding && context.moduleFunctionNames?.has(node.name)) {
    return toCppIdentifier(node.name);
  }
  if (imported != null && imported.importKind !== "namespace") {
    const dependency = context.dependencies.get(imported.importSource);
    const importedName = imported.importedName === "default" ? "__default_export__" : toCppIdentifier(imported.importedName);
    if (dependency != null) {
      return `${dependency.namespace}::${importedName}`;
    }
    return importedName;
  }
  return renderIdentifier(node, context);
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
      return renderTemplateLiteral(node, context, renderExpression);
    case "ArrayExpression":
      return renderArrayExpression(node, context, renderExpression);
    case "ObjectExpression":
      return renderObjectExpression(node, context, renderExpression);
    case "MemberExpression":
      return renderSharedMemberExpression(node, context, {
        isBuiltinLengthMember,
        isPrivateMemberExpression,
        renderExpression,
        renderPrivateMemberExpression,
        renderSuperMemberExpression
      });
    case "OptionalMemberExpression":
      return renderSharedOptionalMemberExpression(node, context, { renderExpression });
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
    case "CallExpression": {
      const builtinCall = renderBuiltinCallExpression(node, context, {
        renderExpression,
        pushRenderedCallArguments: pushCallArguments
      });
      if (builtinCall != null) {
        return builtinCall;
      }
      return renderSharedCallLikeExpression(node.callee, node.arguments, context, {
        renderExpression,
        renderCalleeExpression: renderCallTargetExpression,
        renderSuperConstructorCall
      });
    }
    case "OptionalCallExpression":
      return renderSharedOptionalCallExpression(node, context, { renderExpression });
    case "SpreadElement":
      throw new Error("Spread elements can only be emitted inside spread-aware containers");
    case "NewExpression":
      return renderSharedCallLikeExpression(node.callee, node.arguments, context, {
        renderExpression,
        renderCalleeExpression: renderCallTargetExpression,
        renderSuperConstructorCall
      });
    case "AssignmentExpression":
      return renderAssignmentExpression(node, context, {
        nextTempName: nextDestructureTempName,
        renderExpression
      });
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
  const nestedContext = {
    ...context,
    asyncResultName: null,
    inAsyncFunction: false
  };
  const closureContext = withParameterBindings(nestedContext, node.params, node.id != null ? [node.id.name] : []);
  return renderSyncCallableClosure({
    captureList: (node.captures ?? []).join(", "),
    params: node.params,
    parameterContext: closureContext,
    bodyContext: closureContext,
    emitParameter: emitParameterInitialization,
    emitBody(activeContext, bodyLines) {
      emitStatement(node.body, activeContext, bodyLines, 1);
    },
    nullReturnExpression: renderNullValue()
  });
}

function renderArrowFunctionExpression(node, context) {
  const captureList = (node.captures ?? [])
    .map((name) => renderArrowCaptureName(name, context))
    .join(", ");
  if (node.async) {
    return renderAsyncCallableExpression(node, context, captureList, emitParameterInitialization, emitStatement, renderExpression);
  }
  const nestedContext = {
    ...context,
    asyncResultName: null,
    inAsyncFunction: false
  };
  const closureContext = withParameterBindings(nestedContext, node.params);
  if (node.expressionBody) {
    return renderSyncCallableClosure({
      captureList,
      params: node.params,
      parameterContext: closureContext,
      bodyContext: closureContext,
      emitParameter: emitParameterInitialization,
      emitBody() {
      },
      nullReturnExpression: renderNullValue(),
      renderExpressionReturn(activeContext) {
        return renderExpression(node.body, activeContext);
      }
    });
  }

  return renderSyncCallableClosure({
    captureList,
    params: node.params,
    parameterContext: closureContext,
    bodyContext: closureContext,
    emitParameter: emitParameterInitialization,
    emitBody(activeContext, bodyLines) {
      emitStatement(node.body, activeContext, bodyLines, 1);
    },
    nullReturnExpression: renderNullValue()
  });
}

function renderFunctionExportValue(node, context) {
  return renderFunctionValue(node.id.name, context);
}

function renderFunctionValue(name, context) {
  return renderFunctionReferenceValue(context.namespace, toCppIdentifier(name));
}

function renderFunctionReferenceValue(namespace, cppName) {
  const lines = ["jayess::make_callable([](const std::vector<jayess::value>& jayess_args) -> jayess::value {"];
  lines.push("  jayess::scope_cleanup_frame jayess_scope;");
  lines.push(`  return ::${namespace}::${cppName}(jayess_args);`);
  lines.push("})");
  return lines.join("\n");
}

function collectModuleFunctionNames(ast, retainedDeclarationSet) {
  const names = new Set();
  for (const statement of ast.body) {
    if (!shouldEmitRetainedTopLevelStatement(statement, retainedDeclarationSet)) {
      continue;
    }
    if (statement.type === "FunctionDeclaration" && statement.id != null) {
      names.add(statement.id.name);
      continue;
    }
    if (statement.type === "ExportNamedDeclaration" && statement.declaration?.type === "FunctionDeclaration") {
      names.add(statement.declaration.id.name);
      continue;
    }
    if (statement.type === "ExportDefaultDeclaration" && statement.declaration.type === "FunctionDeclaration" && statement.declaration.id != null) {
      names.add(statement.declaration.id.name);
    }
  }
  return names;
}

function nextDestructureTempName(context) {
  const index = context.tempState.nextDestructureIndex;
  context.tempState.nextDestructureIndex += 1;
  return `jayess_destructure_${index}`;
}

function nextSwitchLabel(context) {
  const index = context.tempState.nextSwitchIndex ?? 0;
  context.tempState.nextSwitchIndex = index + 1;
  return `jayess_switch_end_${index}`;
}

function emitDestructuringAssignments(pattern, sourceExpr, context, lines, indent, declareBindings = true) {
  emitSharedDestructuringAssignments(pattern, sourceExpr, context, lines, indent, {
    declareBindings,
    nextTempName: nextDestructureTempName,
    renderExpression
  });
}

function variableDeclarationHelpers() {
  return {
    emitDestructuringAssignments,
    nextDestructureTempName,
    renderExpression,
    renderNullValue
  };
}

function renderVariableDeclaration(node, context) {
  return renderSharedVariableDeclaration(node, context, variableDeclarationHelpers());
}

function emitVariableDeclarationStatement(node, context, lines, indent, declarePatternBindings = true) {
  emitSharedVariableDeclarationStatement(node, context, lines, indent, declarePatternBindings, variableDeclarationHelpers());
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
    case "FunctionDeclaration":
      lines.push(`${indent}jayess::value ${toCppIdentifier(node.id.name)} = ${renderClosureExpression(node, context)};`);
      return;
    case "ExpressionStatement":
      lines.push(`${indent}${renderExpression(node.expression, context)};`);
      return;
    case "ReturnStatement":
      emitReturnStatement(node, context, lines, indent, { renderExpression, renderNullValue });
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
      const loopContext = withLoopInitializerBindings(context, node.init);
      const forPrefixLines = [];
      const init = renderForInitializer(node.init, loopContext, forPrefixLines, `${indent}  `);
      const test = node.test == null ? "true" : `jayess::truthy(${renderExpression(node.test, loopContext)})`;
      const update = node.update == null ? "" : renderExpression(node.update, loopContext);
      if (forPrefixLines.length > 0) {
        lines.push(`${indent}{`);
        lines.push(...forPrefixLines);
        lines.push(`${indent}  for (${init}; ${test}; ${update}) {`);
        emitStatement(node.body, { ...loopContext, topLevel: false, breakTarget: null, continueTarget: null }, lines, depth + 2);
        lines.push(`${indent}  }`);
        lines.push(`${indent}}`);
        return;
      }
      lines.push(`${indent}for (${init}; ${test}; ${update}) {`);
      emitStatement(node.body, { ...loopContext, topLevel: false, breakTarget: null, continueTarget: null }, lines, depth + 1);
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
      emitTryStatement(node, context, lines, depth, emitStatement);
      return;
    case "ThrowStatement":
      emitThrowStatement(node, context, lines, indent, { renderExpression });
      return;
    case "BreakStatement":
      emitBreakStatement(context, lines, indent);
      return;
    case "ContinueStatement":
      emitContinueStatement(context, lines, indent);
      return;
    case "ClassDeclaration":
      if (node.id != null) {
        lines.push(`${indent}jayess::value ${toCppIdentifier(node.id.name)} = ${renderClassValue(node, context, emitParameterInitialization, emitStatement, renderExpression, hasSpreadArgument, pushCallArguments)};`);
      }
      return;
    case "BlockStatement":
      emitBlockStatement(node, context, lines, depth, { emitStatement });
      return;
    default:
      return;
  }
}

function emitFunction(node, context, lines) {
  const functionContext = withParameterBindings(context, node.params);
  if (node.async) {
    emitAsyncFunction(node, functionContext, lines, emitParameterInitialization, emitStatement);
    return;
  }
  if (node.generator) {
    emitGeneratorFunction(node, functionContext, lines, renderExpression, emitParameterInitialization);
    return;
  }
  lines.push(`jayess::value ${toCppIdentifier(node.id.name)}(const std::vector<jayess::value>& jayess_args) {`);
  lines.push("  jayess::scope_cleanup_frame jayess_scope;");
  for (const [index, param] of node.params.entries()) {
    emitParameterInitialization(param, index, functionContext, lines);
  }
  emitStatement(node.body, functionContext, lines, 1);
  lines.push(`  return ${renderNullValue()};`);
  lines.push("}");
}

export function emitModule({
  ast,
  analysis,
  moduleStem,
  dependencies = new Map(),
  includeOverrides = new Map(),
  retainedDeclarationNames = null,
  retainedImportLocalNames = null,
  lifetimeMetadata = null,
  emitLifetimeMetadataComment = false,
  standalone = false
}) {
  const namespace = toModuleNamespace(moduleStem);
  const lifetimeEmission = createLifetimeEmissionPlan(lifetimeMetadata);
  const importBindings = collectImportBindings(analysis.imports);
  const retainedDeclarationSet = retainedDeclarationNames == null ? null : new Set(retainedDeclarationNames);
  const moduleFunctionNames = collectModuleFunctionNames(ast, retainedDeclarationSet);
  const retainedImportLocalSet = retainedImportLocalNames == null ? null : new Set(retainedImportLocalNames);
  const dependencyHeaders = [...dependencies.values()]
    .map((dependency) => `#include ${JSON.stringify(dependency.header)}`)
    .sort();

  const context = {
    dependencies,
    importBindings,
    moduleFunctionNames,
    namespace,
    localBindingSets: [],
    tempState: { nextDestructureIndex: 0, nextSwitchIndex: 0 }
  };
  const headerLines = standalone
    ? []
    : [
        "#pragma once",
        '#include "runtime/jayess_runtime.hpp"',
        ...dependencyHeaders,
        ...collectHeaderIncludes(analysis.imports, includeOverrides, retainedImportLocalSet),
        "",
        `namespace ${namespace} {`
      ];
  const cppLines = [
    ...(standalone ? ['#include "runtime/jayess_runtime.hpp"', ...collectHeaderIncludes(analysis.imports, includeOverrides, retainedImportLocalSet)] : [`#include "${moduleStem}.hpp"`]),
    "",
    `namespace ${namespace} {`
  ];
  if (emitLifetimeMetadataComment) {
    cppLines.push(...renderLifetimeMetadataCommentLines(lifetimeMetadata), "");
  }
  const globalLines = [];
  const standaloneDeclarations = [];
  const exportAliasLines = collectExportAliasLines({ ast, analysis, dependencies, standalone });

  cppLines.unshift(...dependencyHeaders);

  const moduleStatements = [];
  const declarationTarget = { standalone, headerLines, standaloneDeclarations, globalLines };

  for (const statement of ast.body) {
    if (!shouldEmitRetainedTopLevelStatement(statement, retainedDeclarationSet)) {
      continue;
    }

    if (statement.type === "ImportDeclaration") {
      continue;
    }

    if (statement.type === "FunctionDeclaration") {
      emitFunctionDeclaration(statement.id.name, declarationTarget);
      emitFunction(statement, context, cppLines);
      cppLines.push("");
      continue;
    }

    if (statement.type === "ClassDeclaration") {
      emitGlobalValueDeclaration(
        statement.id.name,
        renderClassValue(statement, context, emitParameterInitialization, emitStatement, renderExpression, hasSpreadArgument, pushCallArguments),
        declarationTarget
      );
      continue;
    }

    if (statement.type === "VariableDeclaration") {
      for (const declaration of statement.declarations) {
        for (const identifier of collectBindingIdentifiers(declaration.id)) {
          const init = isBindingPattern(declaration.id) ? renderNullValue() : declaration.init == null ? renderNullValue() : renderExpression(declaration.init, context);
          emitGlobalValueDeclaration(identifier.name, init, declarationTarget, { includeStandalone: false });
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
        emitFunctionDeclaration(declaration.id.name, declarationTarget);
        emitFunction(declaration, context, cppLines);
        cppLines.push("");
      } else {
        if (statement.declaration != null) {
          if (statement.declaration.type === "VariableDeclaration") {
            for (const declaration of statement.declaration.declarations) {
              for (const identifier of collectBindingIdentifiers(declaration.id)) {
                const init = isBindingPattern(declaration.id) ? renderNullValue() : declaration.init == null ? renderNullValue() : renderExpression(declaration.init, context);
                emitGlobalValueDeclaration(identifier.name, init, declarationTarget);
              }
            }
            if (statement.declaration.declarations.some((declaration) => isBindingPattern(declaration.id))) {
              moduleStatements.push(statement.declaration);
            }
          }
          if (statement.declaration.type === "ClassDeclaration") {
            emitGlobalValueDeclaration(
              statement.declaration.id.name,
              renderClassValue(statement.declaration, context, emitParameterInitialization, emitStatement, renderExpression, hasSpreadArgument, pushCallArguments),
              declarationTarget
            );
          }
        }
      }
      continue;
    }

    if (statement.type === "ExportAllDeclaration") {
      continue;
    }

    if (statement.type === "ExportDefaultDeclaration") {
      emitExternValueDeclaration("__default_export__", declarationTarget);
      if (statement.declaration.type === "FunctionDeclaration") {
        emitFunctionDeclaration(statement.declaration.id.name, declarationTarget);
        emitFunction(statement.declaration, context, cppLines);
        cppLines.push("");
        globalLines.push(`jayess::value __default_export__ = ${renderFunctionExportValue(statement.declaration, context)};`);
        continue;
      }
      if (statement.declaration.type === "ClassDeclaration") {
        if (statement.declaration.id != null) {
          emitGlobalValueDeclaration(
            statement.declaration.id.name,
            renderClassValue(statement.declaration, context, emitParameterInitialization, emitStatement, renderExpression, hasSpreadArgument, pushCallArguments),
            declarationTarget
          );
          globalLines.push("jayess::value __default_export__ = " + toCppIdentifier(statement.declaration.id.name) + ";");
          continue;
        }
        globalLines.push(`jayess::value __default_export__ = ${renderClassValue(statement.declaration, context, emitParameterInitialization, emitStatement, renderExpression, hasSpreadArgument, pushCallArguments)};`);
        continue;
      }
      const init = renderExpression(statement.declaration, context);
      globalLines.push(`jayess::value __default_export__ = ${init};`);
      continue;
    }

    moduleStatements.push(statement);
  }

  const uniqueExportAliasLines = exportAliasLines;
  const uniqueStandaloneDeclarations = [...new Set(standaloneDeclarations)];
  if (standalone && uniqueStandaloneDeclarations.length > 0) {
    const namespaceInsertIndex = cppLines.indexOf(`namespace ${namespace} {`) + 1;
    cppLines.splice(namespaceInsertIndex, 0, ...uniqueStandaloneDeclarations, "");
  }

  if (!standalone) {
    headerLines.push(...uniqueExportAliasLines);
    headerLines.push("jayess::value jayess_module_init();");
    headerLines.push("jayess::value jayess_module_init_async();");
  } else {
    cppLines.push(...uniqueExportAliasLines);
  }

  emitModuleInit(cppLines, moduleStatements, context, emitStatement, renderNullValue());
  cppLines.push("");
  emitModuleInitAsync(cppLines);

  for (const line of globalLines) {
    cppLines.push(line);
  }

  if (!standalone) {
    headerLines.push("}");
  }
  cppLines.push(`} // namespace ${namespace}`);

  return {
    namespace,
    lifetimeEmission,
    headerSource: standalone ? "" : `${headerLines.join("\n")}\n`,
    cppSource: `${cppLines.join("\n")}\n`
  };
}
