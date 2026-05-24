import { collectBindingIdentifiers } from "../ast/binding-patterns.js";
import { collectParameterBindingIdentifiers } from "../ast/parameters.js";
import { createSemanticDiagnostic } from "../diagnostics/semantic-diagnostic.js";
import { classifyImport } from "../modules/classify-import.js";
import { collectNativeHeaderStems, validateImportBindings, validateNativeLibraryHeaderPair } from "./imports.js";
import { defineBinding } from "./scope.js";

export function addScopedBinding(scope, diagnostics, sourceText, node, name, binding) {
  if (!defineBinding(scope, name, binding)) {
    diagnostics.push(createSemanticDiagnostic(sourceText, node, `Duplicate declaration '${name}'`));
  }
}

export function registerExport(exports, diagnostics, sourceText, node, exportedName, localName, kind, source = null) {
  if (exportedName !== "*" && exports.some((entry) => entry.exportedName === exportedName)) {
    diagnostics.push(createSemanticDiagnostic(sourceText, node, `Duplicate export '${exportedName}'`));
    return;
  }
  exports.push({ exportedName, localName, kind, source });
}

export function bindBlockDeclarations(statements, scope, diagnostics, sourceText) {
  for (const statement of statements) {
    if (statement.type === "VariableDeclaration") {
      for (const declaration of statement.declarations) {
        for (const identifier of collectBindingIdentifiers(declaration.id)) {
          addScopedBinding(scope, diagnostics, sourceText, identifier, identifier.name, {
            name: identifier.name,
            kind: statement.kind,
            node: identifier
          });
        }
      }
    }
    if (statement.type === "FunctionDeclaration") {
      addScopedBinding(scope, diagnostics, sourceText, statement.id, statement.id.name, {
        name: statement.id.name,
        kind: "function",
        node: statement.id
      });
    }
    if (statement.type === "ClassDeclaration") {
      addScopedBinding(scope, diagnostics, sourceText, statement.id, statement.id.name, {
        name: statement.id.name,
        kind: "class",
        node: statement.id
      });
    }
  }
}

export function bindParameter(param, scope, diagnostics, sourceText) {
  for (const identifier of collectParameterBindingIdentifiers(param)) {
    addScopedBinding(scope, diagnostics, sourceText, identifier, identifier.name, {
      name: identifier.name,
      kind: "param",
      node: identifier
    });
  }
}

export function collectModuleSurface(ast, sourceText, moduleScope, diagnostics) {
  const imports = [];
  const exports = [];
  const localExportsToValidate = [];
  const importedHeaderStems = collectNativeHeaderStems(ast.body, classifyImport);

  function addModuleBinding(node, name, kind, exported = false, metadata = {}) {
    const binding = { name, kind, node, exported, ...metadata };
    addScopedBinding(moduleScope, diagnostics, sourceText, node, name, binding);
    if (exported) {
      registerExport(exports, diagnostics, sourceText, node, name, name, kind);
    }
    return binding;
  }

  for (const statement of ast.body) {
    if (statement.type === "ImportDeclaration") {
      const classification = classifyImport(statement.source);
      const localNames = new Set();

      validateNativeLibraryHeaderPair(sourceText, statement, classification, importedHeaderStems, diagnostics);
      validateImportBindings(sourceText, statement, classification, diagnostics);

      for (const specifier of statement.specifiers) {
        if (localNames.has(specifier.local)) {
          diagnostics.push(createSemanticDiagnostic(sourceText, statement, `Duplicate imported local name '${specifier.local}'`));
          continue;
        }
        localNames.add(specifier.local);
        addModuleBinding(statement, specifier.local, "import", false, {
          importedName: specifier.imported,
          importSource: statement.source,
          importKind: specifier.kind
        });
      }

      imports.push({
        source: statement.source,
        kind: classification.kind,
        specifiers: statement.specifiers
      });
      continue;
    }

    if (statement.type === "VariableDeclaration") {
      for (const declaration of statement.declarations) {
        for (const identifier of collectBindingIdentifiers(declaration.id)) {
          addModuleBinding(identifier, identifier.name, statement.kind, statement.exported);
        }
      }
      continue;
    }

    if (statement.type === "FunctionDeclaration") {
      addModuleBinding(statement.id, statement.id.name, "function", statement.exported);
      continue;
    }

    if (statement.type === "ClassDeclaration") {
      if (statement.id != null) {
        addModuleBinding(statement.id, statement.id.name, "class", statement.exported);
      }
      continue;
    }

    if (statement.type === "ExportNamedDeclaration") {
      collectNamedExportSurface(statement, imports, exports, localExportsToValidate, addModuleBinding, diagnostics, sourceText);
      continue;
    }

    if (statement.type === "ExportAllDeclaration") {
      const classification = classifyImport(statement.source);
      imports.push({
        source: statement.source,
        kind: classification.kind,
        specifiers: []
      });
      registerExport(exports, diagnostics, sourceText, statement, "*", "*", "export-all", statement.source);
      continue;
    }

    if (statement.type === "ExportDefaultDeclaration") {
      if (statement.declaration?.type === "FunctionDeclaration") {
        addModuleBinding(statement.declaration.id, statement.declaration.id.name, "function");
      }
      if (statement.declaration?.type === "ClassDeclaration" && statement.declaration.id != null) {
        addModuleBinding(statement.declaration.id, statement.declaration.id.name, "class");
      }
      registerExport(exports, diagnostics, sourceText, statement, "default", "__default_export__", "default");
    }
  }

  return { imports, exports, localExportsToValidate };
}

function collectNamedExportSurface(statement, imports, exports, localExportsToValidate, addModuleBinding, diagnostics, sourceText) {
  if (statement.declaration != null) {
    collectNamedExportDeclaration(statement.declaration, addModuleBinding);
    return;
  }

  if (statement.source == null) {
    for (const specifier of statement.specifiers) {
      registerExport(exports, diagnostics, sourceText, specifier, specifier.exportedName, specifier.localName, "local-export");
      localExportsToValidate.push(specifier);
    }
    return;
  }

  const classification = classifyImport(statement.source);
  imports.push({
    source: statement.source,
    kind: classification.kind,
    specifiers: statement.specifiers.map((specifier) => ({
      imported: specifier.localName,
      local: specifier.exportedName,
      kind: "re-export"
    }))
  });

  for (const specifier of statement.specifiers) {
    registerExport(exports, diagnostics, sourceText, specifier, specifier.exportedName, specifier.localName, "re-export", statement.source);
  }
}

function collectNamedExportDeclaration(declaration, addModuleBinding) {
  if (declaration.type === "FunctionDeclaration") {
    addModuleBinding(declaration.id, declaration.id.name, "function", true);
  }
  if (declaration.type === "VariableDeclaration") {
    for (const declarator of declaration.declarations) {
      for (const identifier of collectBindingIdentifiers(declarator.id)) {
        addModuleBinding(identifier, identifier.name, declaration.kind, true);
      }
    }
  }
  if (declaration.type === "ClassDeclaration" && declaration.id != null) {
    addModuleBinding(declaration.id, declaration.id.name, "class", true);
  }
}
