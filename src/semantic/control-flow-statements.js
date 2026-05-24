export function validateLoopControlStatement(node, loopDepth, switchDepth, diagnostics, sourceText, createSemanticDiagnostic) {
  if (node.type === "BreakStatement" && loopDepth === 0 && switchDepth === 0) {
    diagnostics.push(createSemanticDiagnostic(sourceText, node, "break is only valid inside a loop or switch"));
    return;
  }
  if (node.type === "ContinueStatement" && loopDepth === 0) {
    diagnostics.push(createSemanticDiagnostic(sourceText, node, "continue is only valid inside a loop"));
  }
}
