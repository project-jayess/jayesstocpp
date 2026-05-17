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
  relatedPath = null
}) {
  return { phase, message, filename, line, column, relatedPath };
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
