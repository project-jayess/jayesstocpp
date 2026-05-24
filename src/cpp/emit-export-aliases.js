import { renderExportAllAlias, renderLocalExportAlias, renderReExportAlias } from "./export-alias.js";

function explicitExportNamesFor(analysis) {
  return new Set(
    analysis.exports
      .map((entry) => entry.exportedName)
      .filter((name) => name !== "*" && name !== "default")
  );
}

export function collectExportAliasLines({ ast, analysis, dependencies, standalone }) {
  if (standalone) {
    return [];
  }

  const aliases = [];
  const explicitExportNames = explicitExportNamesFor(analysis);
  for (const statement of ast.body) {
    if (statement.type === "ExportNamedDeclaration" && statement.declaration == null) {
      for (const specifier of statement.specifiers) {
        if (statement.source == null) {
          if (specifier.exportedName !== specifier.localName) {
            aliases.push(renderLocalExportAlias(specifier));
          }
          continue;
        }
        const dependency = dependencies.get(statement.source);
        if (dependency != null) {
          aliases.push(renderReExportAlias(specifier, dependency));
        }
      }
    }

    if (statement.type === "ExportAllDeclaration") {
      const dependency = dependencies.get(statement.source);
      if (dependency != null) {
        for (const exportedName of dependency.exportNames ?? []) {
          if (!explicitExportNames.has(exportedName)) {
            aliases.push(renderExportAllAlias(exportedName, dependency));
          }
        }
      }
    }
  }
  return [...new Set(aliases)].sort();
}
