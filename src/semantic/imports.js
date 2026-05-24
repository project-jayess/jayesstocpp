import { createModuleDiagnostic } from "../diagnostics/module-diagnostic.js";
import path from "node:path";

const nodeBuiltinGuidance = new Map([
  ["node:fs", "jayess:fs"],
  ["node:path", "jayess:path"],
  ["node:process", "jayess:process"],
  ["node:child_process", "jayess:subprocess"],
  ["node:os", "jayess:os"],
  ["node:url", "jayess:url"],
  ["node:timers", "jayess:timers"],
  ["node:worker_threads", "jayess:thread"]
]);

function nodeBuiltinMessage(source) {
  const replacement = nodeBuiltinGuidance.get(source);
  if (replacement != null) {
    return `Jayess does not support Node built-in modules inside source imports: '${source}'. Use '${replacement}' instead, or use native headers/repository-defined adapters where Jayess does not own that host surface`;
  }
  return `Jayess does not support Node built-in modules inside source imports: '${source}'. Use Jayess system modules such as 'jayess:fs', 'jayess:path', or 'jayess:process', or use native headers/repository-defined adapters instead`;
}

function libraryStem(source) {
  return path.basename(source, path.extname(source));
}

function nativeArtifactBindingLabel(kind) {
  switch (kind) {
    case "native-source":
      return "Native source imports";
    case "shared-library":
      return "Shared-library imports";
    case "static-library":
      return "Static-library imports";
    default:
      return "Native dependency artifacts";
  }
}

function nativeLibraryHeaderRequirementLabel(kind) {
  if (kind === "shared-library") {
    return "Shared-library imports";
  }
  if (kind === "static-library") {
    return "Static-library imports";
  }
  return "Native library imports";
}

export function collectNativeHeaderStems(statements, classifyImport) {
  return new Set(
    statements
      .filter((entry) => entry.type === "ImportDeclaration" && classifyImport(entry.source).kind === "native-header")
      .map((entry) => libraryStem(entry.source))
  );
}

export function validateNativeLibraryHeaderPair(sourceText, statement, classification, importedHeaderStems, diagnostics) {
  if (
    (classification.kind === "shared-library" || classification.kind === "static-library") &&
    !importedHeaderStems.has(libraryStem(statement.source))
  ) {
    diagnostics.push(
      createModuleDiagnostic(
        sourceText,
        statement,
        `${nativeLibraryHeaderRequirementLabel(classification.kind)} require a matching native header import: '${statement.source}'`,
        statement.source
      )
    );
  }
}

export function validateImportBindings(sourceText, statement, classification, diagnostics) {
  if (classification.kind === "node-builtin") {
    diagnostics.push(
      createModuleDiagnostic(
        sourceText,
        statement,
        nodeBuiltinMessage(statement.source),
        statement.source
      )
    );
    return;
  }

  if (statement.specifiers.length === 0) {
    return;
  }

  if (classification.kind === "cpp-header") {
    diagnostics.push(
      createModuleDiagnostic(
        sourceText,
        statement,
        `C++ standard library imports do not provide Jayess bindings: '${statement.source}'`,
        statement.source
      )
    );
    return;
  }

  if (
    classification.kind === "native-source"
    || classification.kind === "shared-library"
    || classification.kind === "static-library"
  ) {
    diagnostics.push(
      createModuleDiagnostic(
        sourceText,
        statement,
        `${nativeArtifactBindingLabel(classification.kind)} cannot provide Jayess bindings: '${statement.source}'. Import the matching native header instead`,
        statement.source
      )
    );
  }
}
