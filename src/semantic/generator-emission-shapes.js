import { createSemanticDiagnostic } from "../diagnostics/semantic-diagnostic.js";

export function validateGeneratorStatementDeclarationShape(node, inGeneratorFunction, diagnostics, sourceText) {
  if (!inGeneratorFunction) {
    return;
  }
  if (node.type === "FunctionDeclaration") {
    diagnostics.push(
      createSemanticDiagnostic(
        sourceText,
        node,
        "Jayess generator lowering does not support function declarations inside generator bodies; move the declaration outside the generator or use a function expression assigned to a variable"
      )
    );
  }
  if (node.type === "ClassDeclaration") {
    diagnostics.push(
      createSemanticDiagnostic(
        sourceText,
        node,
        "Jayess generator lowering does not support class declarations inside generator bodies; move the class declaration outside the generator"
      )
    );
  }
}
