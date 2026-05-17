import { createDiagnostic } from "../diagnostics.js";
import { offsetToLineColumn } from "../source/source-text.js";

export function createModuleDiagnostic(sourceText, node, message, relatedPath = null) {
  const { line, column } = offsetToLineColumn(sourceText, node.start);
  return createDiagnostic({
    phase: "module-resolution",
    message,
    filename: sourceText.filename,
    line,
    column,
    relatedPath
  });
}

export function createModuleFileDiagnostic(filename, message, relatedPath = null) {
  return createDiagnostic({
    phase: "module-resolution",
    message,
    filename,
    relatedPath
  });
}
