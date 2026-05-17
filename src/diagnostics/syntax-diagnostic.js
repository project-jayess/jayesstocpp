import { createDiagnostic } from "../diagnostics.js";
import { offsetToLineColumn } from "../source/source-text.js";

export function createSyntaxDiagnostic(sourceText, start, message, relatedPath = null) {
  const { line, column } = offsetToLineColumn(sourceText, start);
  return createDiagnostic({
    phase: "syntax",
    message,
    filename: sourceText.filename,
    line,
    column,
    relatedPath
  });
}
