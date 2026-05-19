import { createSemanticDiagnostic } from "../diagnostics/semantic-diagnostic.js";

export function validateFinallyControlFlow(node, diagnostics, sourceText) {
  if (node == null) {
    return;
  }

  switch (node.type) {
    case "BlockStatement":
      for (const statement of node.body) {
        validateFinallyControlFlow(statement, diagnostics, sourceText);
      }
      return;
    case "IfStatement":
      validateFinallyControlFlow(node.consequent, diagnostics, sourceText);
      validateFinallyControlFlow(node.alternate, diagnostics, sourceText);
      return;
    case "WhileStatement":
    case "DoWhileStatement":
      validateFinallyControlFlow(node.body, diagnostics, sourceText);
      return;
    case "ForStatement":
      validateFinallyControlFlow(node.body, diagnostics, sourceText);
      return;
    case "SwitchStatement":
      for (const clause of node.cases) {
        for (const statement of clause.consequent) {
          validateFinallyControlFlow(statement, diagnostics, sourceText);
        }
      }
      return;
    case "TryStatement":
      validateFinallyControlFlow(node.block, diagnostics, sourceText);
      validateFinallyControlFlow(node.handler?.body ?? null, diagnostics, sourceText);
      validateFinallyControlFlow(node.finalizer, diagnostics, sourceText);
      return;
    case "ReturnStatement":
      diagnostics.push(createSemanticDiagnostic(sourceText, node, "Jayess does not yet support 'return' inside finally blocks"));
      return;
    case "BreakStatement":
      diagnostics.push(createSemanticDiagnostic(sourceText, node, "Jayess does not yet support 'break' inside finally blocks"));
      return;
    case "ContinueStatement":
      diagnostics.push(createSemanticDiagnostic(sourceText, node, "Jayess does not yet support 'continue' inside finally blocks"));
      return;
    case "FunctionDeclaration":
    case "FunctionExpression":
    case "ArrowFunctionExpression":
    case "ClassDeclaration":
    case "MethodDefinition":
      return;
    default:
      return;
  }
}
