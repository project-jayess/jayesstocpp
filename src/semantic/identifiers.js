import { createSemanticDiagnostic } from "../diagnostics/semantic-diagnostic.js";
import { unsupportedBuiltinIdentifierMessage } from "./builtins.js";
import { resolveBinding } from "./scope.js";

export function scopeBelongsToFunction(scope, functionScope) {
  let current = scope;
  while (current != null) {
    if (current === functionScope) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

export function resolveSemanticIdentifier(node, context) {
  const {
    activeScope,
    diagnostics,
    functionNode = null,
    functionScope = null,
    sourceText
  } = context;
  const binding = resolveBinding(activeScope, node.name);
  if (binding == null || binding.node?.start > node.start) {
    diagnostics.push(
      createSemanticDiagnostic(
        sourceText,
        node,
        unsupportedBuiltinIdentifierMessage(node.name) ?? `Undefined identifier '${node.name}'`
      )
    );
    return null;
  }
  if (
    functionScope != null
    && functionNode != null
    && binding.scope != null
    && binding.scope.kind !== "module"
    && binding.scope.kind !== "module-body"
    && !scopeBelongsToFunction(binding.scope, functionScope)
  ) {
    const captures = new Set(functionNode.captures ?? []);
    captures.add(node.name);
    functionNode.captures = [...captures].sort();
  }
  return binding;
}
