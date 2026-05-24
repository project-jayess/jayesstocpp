export class JayessError extends Error {
  constructor(diagnostics) {
    super(diagnostics[0]?.message ?? "Jayess transpilation failed");
    this.name = "JayessError";
    this.diagnostics = diagnostics;
  }
}

export function createDiagnostic({
  phase,
  message,
  filename = null,
  line = null,
  column = null,
  relatedPath = null,
  code = null,
  category = null
}) {
  const resolvedCategory = category ?? diagnosticCategoryForPhase(phase);
  const resolvedCode = code ?? inferDiagnosticCode(phase, message);
  return { phase, category: resolvedCategory, code: resolvedCode, message, filename, line, column, relatedPath };
}

export function diagnosticCategoryForPhase(phase) {
  if (phase === "syntax") {
    return "parser";
  }
  if (phase === "semantic") {
    return "semantic";
  }
  if (phase === "module-resolution") {
    return "module";
  }
  if (phase === "cpp-emission") {
    return "emitter";
  }
  if (phase === "runtime") {
    return "runtime";
  }
  return "general";
}

export function inferDiagnosticCode(phase, message) {
  if (phase === "syntax") {
    if (/dynamic import\(\)/.test(message)) {
      return "JY_PARSE_DYNAMIC_IMPORT";
    }
    if (/does not support 'let'/.test(message)) {
      return "JY_PARSE_LET_UNSUPPORTED";
    }
    if (/does not support 'with'/.test(message)) {
      return "JY_PARSE_WITH_UNSUPPORTED";
    }
    if (/tagged template/.test(message)) {
      return "JY_PARSE_TAGGED_TEMPLATE";
    }
    return "JY_PARSE_ERROR";
  }
  if (phase === "semantic") {
    if (/ambient global 'eval'/.test(message)) {
      return "JY_SEMANTIC_EVAL_UNSUPPORTED";
    }
    if (/JavaScript 'Function' constructor/.test(message)) {
      return "JY_SEMANTIC_FUNCTION_CONSTRUCTOR_UNSUPPORTED";
    }
    if (/Unsupported built-in/.test(message)) {
      return "JY_SEMANTIC_UNSUPPORTED_BUILTIN";
    }
    return "JY_SEMANTIC_ERROR";
  }
  if (phase === "module-resolution") {
    if (/node:/.test(message) || /Node built-in/.test(message)) {
      return "JY_MODULE_NODE_BUILTIN_UNSUPPORTED";
    }
    if (/unsupported package\.json/.test(message)) {
      return "JY_MODULE_PACKAGE_TARGET_UNSUPPORTED";
    }
    if (/Cannot resolve module/.test(message) || /does not exist/.test(message)) {
      return "JY_MODULE_NOT_FOUND";
    }
    return "JY_MODULE_ERROR";
  }
  if (phase === "cpp-emission") {
    return "JY_EMIT_ERROR";
  }
  if (phase === "runtime") {
    return "JY_RUNTIME_ERROR";
  }
  return "JY_DIAGNOSTIC";
}

function compareNullable(left, right) {
  if (left == null && right == null) {
    return 0;
  }
  if (left == null) {
    return -1;
  }
  if (right == null) {
    return 1;
  }
  return String(left).localeCompare(String(right));
}

export function sortDiagnostics(diagnostics) {
  return [...diagnostics].sort((left, right) => {
    return compareNullable(left.filename, right.filename)
      || compareNullable(left.line, right.line)
      || compareNullable(left.column, right.column)
      || compareNullable(left.phase, right.phase)
      || compareNullable(left.relatedPath, right.relatedPath)
      || compareNullable(left.message, right.message);
  });
}

export function throwDiagnostics(diagnostics) {
  throw new JayessError(sortDiagnostics(diagnostics));
}
