import { createModuleDiagnostic } from "../diagnostics/module-diagnostic.js";
import path from "node:path";

function libraryStem(source) {
  return path.basename(source, path.extname(source));
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
        `Native library imports require a matching header import: '${statement.source}'`,
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
        `Jayess does not support Node built-in modules inside source imports: '${statement.source}'. Use Jayess system modules such as 'jayess:fs', 'jayess:path', or 'jayess:process', or use native headers/repository-defined adapters instead`,
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
        `Native dependency artifacts cannot provide Jayess bindings: '${statement.source}'. Import the matching header instead`,
        statement.source
      )
    );
  }
}
