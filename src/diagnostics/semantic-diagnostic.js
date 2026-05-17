import { createDiagnostic } from "../diagnostics.js";
import { offsetToLineColumn } from "../source/source-text.js";

export function createSemanticDiagnostic(sourceText, node, message, relatedPath = null) {
  const { line, column } = offsetToLineColumn(sourceText, node.start);
  return createDiagnostic({
    phase: "semantic",
    message,
    filename: sourceText.filename,
    line,
    column,
    relatedPath
  });
}
