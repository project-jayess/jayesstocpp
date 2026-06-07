import { collectBindingIdentifiers, isBindingPattern } from "../ast/binding-patterns.js";
import { throwDiagnostics } from "../diagnostics.js";
import { createSemanticDiagnostic } from "../diagnostics/semantic-diagnostic.js";
import { validatePrivateMemberAccess, walkClassDeclaration, walkClassMember } from "./classes.js";
import { validateLoopControlStatement } from "./control-flow-statements.js";
import { walkDestructuringPattern } from "./destructuring.js";
import {
  validateAssignmentExpressionShape,
  validateArrayExpressionShape,
  validateBinaryExpressionShape,
  validateCallExpressionShape,
  validateGeneratorExpressionYieldShape,
  validateMemberExpressionShape,
  validateObjectExpressionShape,
  validateUnaryExpressionShape,
  validateUpdateExpressionShape
} from "./expressions.js";
import { validateFinallyControlFlow } from "./finally-control-flow.js";
import { validateGeneratorStatementDeclarationShape } from "./generator-emission-shapes.js";
import { containsYieldExpression } from "./generator-forms.js";
import {
  canLowerFocusedGeneratorCatchBodyYield,
  canLowerFocusedGeneratorTryCatchYield,
  canLowerFocusedGeneratorTryFinallyYield,
  canLowerMultiYieldGeneratorTryCatch
} from "./generator-try-shapes.js";
import { resolveSemanticIdentifier } from "./identifiers.js";
import { addScopedBinding, bindBlockDeclarations, bindParameter, collectModuleSurface } from "./module-surface.js";
import { createScope, resolveBinding } from "./scope.js";

export function analyzeModule(ast, sourceText, options = {}) {
  const diagnostics = [];
  const moduleScope = createScope(null, "module");
  const { imports, exports, localExportsToValidate } = collectModuleSurface(ast, sourceText, moduleScope, diagnostics);

  function resolveIdentifier(node, activeScope, functionScope = null, functionNode = null) {
    return resolveSemanticIdentifier(node, {
      activeScope,
      diagnostics,
      functionNode,
      functionScope,
      sourceText
    });
  }

  function walkBindingPattern(
    node,
    activeScope,
    loopDepth,
    switchDepth,
    functionScope,
    functionNode,
    inAsyncFunction,
    inGeneratorFunction,
    currentClass,
    currentMethod,
    declarationMode
  ) {
    walkDestructuringPattern(node, {
      activeScope,
      createSemanticDiagnostic,
      currentClass,
      currentMethod,
      declarationMode,
      diagnostics,
      functionNode,
      functionScope,
      inAsyncFunction,
      inGeneratorFunction,
      loopDepth,
      resolveIdentifier,
      sourceText,
      switchDepth,
      walk
    });
  }

  function walk(
    node,
    activeScope,
    loopDepth = 0,
    switchDepth = 0,
    functionScope = null,
    functionNode = null,
    inAsyncFunction = false,
    inGeneratorFunction = false,
    currentClass = null,
    currentMethod = null
  ) {
    if (node == null) {
      return;
    }

    switch (node.type) {
      case "Program":
        for (const statement of node.body) {
          walk(statement, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        }
        return;
      case "BlockStatement": {
        const blockScope = createScope(activeScope, "block");
        bindBlockDeclarations(node.body, blockScope, diagnostics, sourceText);
        for (const statement of node.body) {
          walk(statement, blockScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        }
        return;
      }
      case "FunctionDeclaration": {
        validateGeneratorStatementDeclarationShape(node, inGeneratorFunction, diagnostics, sourceText);
        if (node.async === true && node.generator === true) {
          diagnostics.push(createSemanticDiagnostic(sourceText, node.id, "Jayess does not support async generator functions"));
        }
        node.captures = [];
        const nestedFunctionScope = createScope(activeScope, "function");
        if (node.id != null) {
          addScopedBinding(nestedFunctionScope, diagnostics, sourceText, node.id, node.id.name, {
            name: node.id.name,
            kind: "function",
            node: node.id
          });
        }
        for (const param of node.params) {
          walk(param.defaultValue, nestedFunctionScope, 0, 0, nestedFunctionScope, node, node.async === true, node.generator === true, currentClass, null);
          walkBindingPattern(param.id, nestedFunctionScope, 0, 0, nestedFunctionScope, node, node.async === true, node.generator === true, currentClass, null, true);
          bindParameter(param, nestedFunctionScope, diagnostics, sourceText);
        }
        walk(node.body, nestedFunctionScope, 0, 0, nestedFunctionScope, node, node.async === true, node.generator === true, currentClass, null);
        return;
      }
      case "ClassDeclaration": {
        validateGeneratorStatementDeclarationShape(node, inGeneratorFunction, diagnostics, sourceText);
        walkClassDeclaration(node, {
          activeScope,
          addScopedBinding,
          bindBlockDeclarations,
          bindParameter,
          createScope,
          diagnostics,
          functionNode,
          functionScope,
          inAsyncFunction,
          inGeneratorFunction,
          loopDepth,
          resolveIdentifier,
          sourceText,
          switchDepth,
          walk,
          walkBindingPattern
        });
        return;
      }
      case "ClassFieldDefinition":
      case "MethodDefinition":
      case "StaticInitializationBlock":
        walkClassMember(node, {
          activeScope,
          addScopedBinding,
          bindBlockDeclarations,
          bindParameter,
          createScope,
          currentClass,
          currentMethod,
          diagnostics,
          functionNode,
          functionScope,
          inAsyncFunction,
          inGeneratorFunction,
          loopDepth,
          sourceText,
          switchDepth,
          walk,
          walkBindingPattern
        });
        return;
      case "FunctionExpression": {
        if (node.async === true && node.generator === true) {
          diagnostics.push(createSemanticDiagnostic(sourceText, node.id ?? node, "Jayess does not support async generator functions"));
        }
        node.captures = [];
        const nestedFunctionScope = createScope(activeScope, "function");
        if (node.id != null) {
          addScopedBinding(nestedFunctionScope, diagnostics, sourceText, node.id, node.id.name, {
            name: node.id.name,
            kind: "function-expression-name",
            node: node.id
          });
        }
        for (const param of node.params) {
          walk(param.defaultValue, nestedFunctionScope, 0, 0, nestedFunctionScope, node, node.async === true, node.generator === true, currentClass, null);
          walkBindingPattern(param.id, nestedFunctionScope, 0, 0, nestedFunctionScope, node, node.async === true, node.generator === true, currentClass, null, true);
          bindParameter(param, nestedFunctionScope, diagnostics, sourceText);
        }
        walk(node.body, nestedFunctionScope, 0, 0, nestedFunctionScope, node, node.async === true, node.generator === true, currentClass, null);
        return;
      }
      case "ArrowFunctionExpression": {
        node.captures = [];
        const nestedFunctionScope = createScope(activeScope, "function");
        for (const param of node.params) {
          walk(param.defaultValue, nestedFunctionScope, 0, 0, nestedFunctionScope, node, node.async === true, node.generator === true, currentClass, null);
          walkBindingPattern(param.id, nestedFunctionScope, 0, 0, nestedFunctionScope, node, node.async === true, node.generator === true, currentClass, null, true);
          bindParameter(param, nestedFunctionScope, diagnostics, sourceText);
        }
        walk(node.body, nestedFunctionScope, 0, 0, nestedFunctionScope, node, node.async === true, node.generator === true, currentClass, null);
        return;
      }
      case "VariableDeclaration":
        for (const declaration of node.declarations) {
          if (isBindingPattern(declaration.id) || declaration.id.type === "AssignmentPattern") {
            walkBindingPattern(
              declaration.id,
              activeScope,
              loopDepth,
              switchDepth,
              functionScope,
              functionNode,
              inAsyncFunction,
              inGeneratorFunction,
              currentClass,
              currentMethod,
              true
            );
          }
          walk(declaration.init, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        }
        return;
      case "ExportNamedDeclaration":
        walk(node.declaration, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        return;
      case "ExportDefaultDeclaration":
        walk(node.declaration, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        return;
      case "ReturnStatement":
        walk(node.argument, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        return;
      case "ThrowStatement":
        if (inGeneratorFunction && containsYieldExpression(node.argument)) {
          diagnostics.push(createSemanticDiagnostic(sourceText, node.argument, "Jayess generator lowering does not support 'yield' inside throw expressions"));
        }
        walk(node.argument, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        return;
      case "ExpressionStatement":
        walk(node.expression, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        return;
      case "AssignmentExpression": {
        validateAssignmentExpressionShape(node, inGeneratorFunction, diagnostics, sourceText);
        if (isBindingPattern(node.left) || node.left.type === "AssignmentPattern") {
          walkBindingPattern(
            node.left,
            activeScope,
            loopDepth,
            switchDepth,
            functionScope,
            functionNode,
            inAsyncFunction,
            inGeneratorFunction,
            currentClass,
            currentMethod,
            false
          );
          walk(node.right, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
          return;
        }
        if (node.left.type === "MemberExpression") {
          validatePrivateMemberAccess(node.left, currentClass, currentMethod, diagnostics, sourceText);
          if (node.left.object.type !== "SuperExpression") {
            walk(node.left.object, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
          }
          if (node.left.computed) {
            walk(node.left.property, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
          }
        } else if (node.left.type !== "Identifier") {
          diagnostics.push(
            createSemanticDiagnostic(
              sourceText,
              node.left,
              `Invalid assignment target for '${node.operator}'; expected an identifier, member access, or destructuring pattern`
            )
          );
        }
        if (node.left.type === "Identifier") {
          const binding = resolveIdentifier(node.left, activeScope, functionScope, functionNode);
          if (binding?.kind === "const") {
            const verb = node.operator === "=" ? "reassign" : "update";
            diagnostics.push(createSemanticDiagnostic(sourceText, node.left, `Cannot ${verb} const '${node.left.name}'`));
          }
        }
        walk(node.right, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        return;
      }
      case "BinaryExpression":
        validateBinaryExpressionShape(node, inGeneratorFunction, diagnostics, sourceText);
        walk(node.left, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        walk(node.right, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        return;
      case "ConditionalExpression":
        validateGeneratorExpressionYieldShape(node, inGeneratorFunction, diagnostics, sourceText);
        walk(node.test, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        walk(node.consequent, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        walk(node.alternate, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        return;
      case "UnaryExpression":
        validateUnaryExpressionShape(node, inGeneratorFunction, diagnostics, sourceText);
        walk(node.argument, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        return;
      case "AwaitExpression":
        if (!inAsyncFunction) {
          diagnostics.push(createSemanticDiagnostic(sourceText, node, "'await' is only valid inside async functions"));
        }
        walk(node.argument, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        return;
      case "YieldExpression":
        if (!inGeneratorFunction) {
          diagnostics.push(createSemanticDiagnostic(sourceText, node, "'yield' is only valid inside generator functions"));
        }
        walk(node.argument, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        return;
      case "UpdateExpression": {
        validateUpdateExpressionShape(node, diagnostics, sourceText);
        validateGeneratorExpressionYieldShape(node, inGeneratorFunction, diagnostics, sourceText);
        if (node.argument.type === "MemberExpression") {
          validatePrivateMemberAccess(node.argument, currentClass, currentMethod, diagnostics, sourceText);
          walk(node.argument.object, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
          if (node.argument.computed) {
            walk(node.argument.property, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
          }
          return;
        }
        if (node.argument.type !== "Identifier") {
          diagnostics.push(
            createSemanticDiagnostic(
              sourceText,
              node.argument,
              `Invalid update target for '${node.operator}'; expected an identifier or member access`
            )
          );
          return;
        }
        const binding = resolveIdentifier(node.argument, activeScope, functionScope, functionNode);
        if (binding?.kind === "const") {
          diagnostics.push(createSemanticDiagnostic(sourceText, node.argument, `Cannot update const '${node.argument.name}'`));
        }
        return;
      }
      case "CallExpression":
      case "OptionalCallExpression":
        validateCallExpressionShape(node, inGeneratorFunction, currentClass, currentMethod, diagnostics, sourceText);
        if (node.callee.type !== "SuperExpression") {
          walk(node.callee, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        }
        for (const argument of node.arguments) {
          walk(argument, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        }
        return;
      case "NewExpression":
        validateGeneratorExpressionYieldShape(node, inGeneratorFunction, diagnostics, sourceText);
        walk(node.callee, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        for (const argument of node.arguments) {
          walk(argument, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        }
        return;
      case "MemberExpression":
      case "OptionalMemberExpression":
        validateGeneratorExpressionYieldShape(node, inGeneratorFunction, diagnostics, sourceText);
        validatePrivateMemberAccess(node, currentClass, currentMethod, diagnostics, sourceText);
        validateMemberExpressionShape(node, currentClass, currentMethod, diagnostics, sourceText);
        if (node.object.type !== "SuperExpression") {
          walk(node.object, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        }
        if (node.computed) {
          walk(node.property, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        }
        return;
      case "ArrayExpression":
        validateArrayExpressionShape(node, inGeneratorFunction, diagnostics, sourceText);
        for (const element of node.elements) {
          if (inGeneratorFunction && element.type === "SpreadElement" && containsYieldExpression(element.argument)) {
            diagnostics.push(createSemanticDiagnostic(sourceText, element, "Jayess generator lowering does not support array spread elements containing 'yield'"));
          }
          walk(element, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        }
        return;
      case "ObjectExpression":
        validateObjectExpressionShape(node, inGeneratorFunction, diagnostics, sourceText);
        for (const property of node.properties) {
          if (property.type === "SpreadElement") {
            if (inGeneratorFunction && containsYieldExpression(property.argument)) {
              diagnostics.push(createSemanticDiagnostic(sourceText, property, "Jayess generator lowering does not support object spread properties containing 'yield'"));
            }
            walk(property.argument, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
            continue;
          }
          walk(property.value, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        }
        return;
      case "TemplateLiteral":
        validateGeneratorExpressionYieldShape(node, inGeneratorFunction, diagnostics, sourceText);
        for (const expression of node.expressions) {
          walk(expression, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        }
        return;
      case "SpreadElement":
        walk(node.argument, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        return;
      case "IfStatement":
        if (inGeneratorFunction && containsYieldExpression(node.test)) {
          diagnostics.push(createSemanticDiagnostic(sourceText, node.test, "Jayess generator lowering does not support 'yield' inside if tests"));
        }
        walk(node.test, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        walk(node.consequent, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        walk(node.alternate, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        return;
      case "SwitchStatement": {
        if (inGeneratorFunction && containsYieldExpression(node.discriminant)) {
          diagnostics.push(createSemanticDiagnostic(sourceText, node.discriminant, "Jayess generator lowering does not support 'yield' inside switch discriminants"));
        }
        walk(node.discriminant, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        for (const clause of node.cases) {
          const clauseScope = createScope(activeScope, "switch-case");
          bindBlockDeclarations(clause.consequent, clauseScope, diagnostics, sourceText);
          for (const statement of clause.consequent) {
            walk(statement, clauseScope, loopDepth, switchDepth + 1, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
          }
        }
        return;
      }
      case "TryStatement": {
        if (
          inGeneratorFunction
          && containsYieldExpression(node)
          && !canLowerFocusedGeneratorTryCatchYield(node, containsYieldExpression)
          && !canLowerMultiYieldGeneratorTryCatch(node, containsYieldExpression)
          && !canLowerFocusedGeneratorCatchBodyYield(node, containsYieldExpression)
          && !canLowerFocusedGeneratorTryFinallyYield(node, containsYieldExpression)
        ) {
          diagnostics.push(createSemanticDiagnostic(sourceText, node, "Jayess generator lowering supports only direct try-body yields, single direct catch-body yields, or direct try/finally yields with non-yielding surrounding statements"));
        }
        walk(node.block, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        if (node.handler != null) {
          const catchScope = createScope(activeScope, "catch");
          if (node.handler.param != null) {
            addScopedBinding(catchScope, diagnostics, sourceText, node.handler.param, node.handler.param.name, {
              name: node.handler.param.name,
              kind: "catch",
              node: node.handler.param
            });
          }
          bindBlockDeclarations(node.handler.body.body, catchScope, diagnostics, sourceText);
          for (const statement of node.handler.body.body) {
            walk(statement, catchScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
          }
        }
        if (node.finalizer != null) {
          validateFinallyControlFlow(node.finalizer, diagnostics, sourceText);
          walk(node.finalizer, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        }
        return;
      }
      case "WhileStatement":
        if (inGeneratorFunction && containsYieldExpression(node.test)) {
          diagnostics.push(createSemanticDiagnostic(sourceText, node.test, "Jayess generator lowering does not support 'yield' inside while tests"));
        }
        walk(node.test, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        walk(node.body, activeScope, loopDepth + 1, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        return;
      case "DoWhileStatement":
        if (inGeneratorFunction && containsYieldExpression(node.test)) {
          diagnostics.push(createSemanticDiagnostic(sourceText, node.test, "Jayess generator lowering does not support 'yield' inside do/while tests"));
        }
        walk(node.body, activeScope, loopDepth + 1, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        walk(node.test, activeScope, loopDepth + 1, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        return;
      case "ForStatement": {
        const loopScope = createScope(activeScope, "loop");
        if (inGeneratorFunction && node.init != null && containsYieldExpression(node.init)) {
          diagnostics.push(createSemanticDiagnostic(sourceText, node.init, "Jayess generator lowering does not support 'yield' inside for-loop initializers"));
        }
        if (inGeneratorFunction && node.test != null && containsYieldExpression(node.test)) {
          diagnostics.push(createSemanticDiagnostic(sourceText, node.test, "Jayess generator lowering does not support 'yield' inside for-loop tests"));
        }
        if (inGeneratorFunction && node.update != null && containsYieldExpression(node.update)) {
          diagnostics.push(createSemanticDiagnostic(sourceText, node.update, "Jayess generator lowering does not support 'yield' inside for-loop updates"));
        }
        if (node.init?.type === "VariableDeclaration") {
          for (const declaration of node.init.declarations) {
            for (const identifier of collectBindingIdentifiers(declaration.id)) {
              addScopedBinding(loopScope, diagnostics, sourceText, identifier, identifier.name, {
                name: identifier.name,
                kind: node.init.kind,
                node: identifier
              });
            }
          }
        }
        walk(node.init, loopScope, loopDepth + 1, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        walk(node.test, loopScope, loopDepth + 1, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        walk(node.update, loopScope, loopDepth + 1, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        walk(node.body, loopScope, loopDepth + 1, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        return;
      }
      case "BreakStatement":
        validateLoopControlStatement(node, loopDepth, switchDepth, diagnostics, sourceText, createSemanticDiagnostic);
        return;
      case "ContinueStatement":
        validateLoopControlStatement(node, loopDepth, switchDepth, diagnostics, sourceText, createSemanticDiagnostic);
        return;
      case "Identifier":
        if (functionNode?.type === "ArrowFunctionExpression" && node.name === "arguments") {
          diagnostics.push(
            createSemanticDiagnostic(
              sourceText,
              node,
              "Jayess arrow functions do not support 'arguments'; use named parameters instead"
            )
          );
          return;
        }
        resolveIdentifier(node, activeScope, functionScope, functionNode);
        return;
      case "ThisExpression":
        resolveIdentifier({ ...node, name: "this" }, activeScope, functionScope, functionNode);
        return;
      case "SuperExpression":
        diagnostics.push(
          createSemanticDiagnostic(
            sourceText,
            node,
            "Bare 'super' expressions are not supported; use super(...) in derived constructors or super.name/super[expr] in derived methods"
          )
        );
        return;
      default:
        return;
    }
  }

  const rootScope = createScope(null, "module-body");
  for (const [name, binding] of moduleScope.bindings.entries()) {
    addScopedBinding(rootScope, diagnostics, sourceText, binding.node, name, binding);
  }
  walk(ast, rootScope);

  for (const specifier of localExportsToValidate) {
    if (resolveBinding(rootScope, specifier.localName) == null) {
      diagnostics.push(
        createSemanticDiagnostic(sourceText, specifier, `Cannot export undefined local binding '${specifier.localName}'`)
      );
    }
  }

  if (diagnostics.length > 0 && options.throwOnError !== false) {
    throwDiagnostics(diagnostics);
  }

  return { diagnostics, imports, exports, scope: rootScope };
}
