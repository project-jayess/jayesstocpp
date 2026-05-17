import fs from "node:fs";
import path from "node:path";
import { throwDiagnostics } from "../diagnostics.js";
import { createModuleFileDiagnostic } from "../diagnostics/module-diagnostic.js";
import { parse } from "../parser/parse.js";
import { createSourceText } from "../source/source-text.js";
import { analyzeModule } from "../semantic/analyze.js";
import { classifyImport } from "./classify-import.js";
import { getSupportedJayessSourceExtensions, isSupportedJayessSourceFile } from "./jayess-source-file.js";
import { readPackageJson } from "./read-package-json.js";
import { resolveBuiltinModule } from "./resolve-builtin-module.js";
import { resolvePackageImportDetailed } from "./resolve-package-import.js";
import { resolveRelativeImport } from "./resolve-relative-import.js";
import { validateModuleGraph } from "./validate-module-graph.js";

function throwMissingModule(filename) {
  throwDiagnostics([createModuleFileDiagnostic(filename, `Cannot resolve module '${filename}'`)]);
}

function throwCycle(filename) {
  throwDiagnostics([createModuleFileDiagnostic(filename, `Import cycle detected at '${filename}'`)]);
}

function throwUnsupportedPackageTarget(source, resolved) {
  const supported = getSupportedJayessSourceExtensions().join(", ");
  throwDiagnostics([
    createModuleFileDiagnostic(
      resolved,
      `Package import '${source}' resolved to unsupported file type '${path.extname(resolved)}'; only Jayess source files (${supported}) are transpileable`,
      source
    )
  ]);
}

function throwPackageResolutionFailure(source, failure) {
  if (failure?.reason === "package-not-found") {
    throwDiagnostics([
      createModuleFileDiagnostic(
        source,
        `Cannot resolve package import '${source}': package '${failure.packageName}' was not found in node_modules`,
        source
      )
    ]);
  }

  if (failure?.reason === "package-subpath-not-found") {
    throwDiagnostics([
      createModuleFileDiagnostic(
        source,
        `Cannot resolve package import '${source}': package subpath './${failure.subpath}' was not found in '${failure.packageName}'`,
        source
      )
    ]);
  }

  if (failure?.reason === "package-export-target-missing") {
    throwDiagnostics([
      createModuleFileDiagnostic(
        source,
        `Cannot resolve package import '${source}': package export target '${failure.attemptedPath}' does not exist`,
        source
      )
    ]);
  }

  if (failure?.reason === "package-entry-not-found") {
    throwDiagnostics([
      createModuleFileDiagnostic(
        source,
        `Cannot resolve package import '${source}': package '${failure.packageName}' has no transpileable entry file (checked '${failure.mainField}')`,
        source
      )
    ]);
  }

  throwMissingModule(source);
}

function throwBuiltinResolutionFailure(source) {
  throwDiagnostics([
    createModuleFileDiagnostic(
      source,
      `Cannot resolve built-in Jayess module '${source}' from the repository stdlib layout`,
      source
    )
  ]);
}

function resolveImportTarget(fromFilename, source) {
  const classification = classifyImport(source);

  if (classification.kind === "jayess-module") {
    return { resolved: resolveRelativeImport(fromFilename, source), failure: null };
  }

  if (classification.kind === "builtin-module") {
    return { resolved: resolveBuiltinModule(source), failure: null };
  }

  if (classification.kind === "package") {
    const result = resolvePackageImportDetailed(fromFilename, source);
    return { resolved: result.resolved, failure: result };
  }

  return { resolved: null, failure: null };
}

export function buildModuleGraph(entryFilename) {
  const visited = new Map();
  const root = path.resolve(entryFilename);
  const projectRoot = path.dirname(root);
  const projectPackageJson = readPackageJson(path.join(projectRoot, "package.json"));

  function visit(filename, stack = []) {
    if (stack.includes(filename)) {
      throwCycle(filename);
    }
    if (visited.has(filename)) {
      return;
    }
    if (!fs.existsSync(filename)) {
      throwMissingModule(filename);
    }

    const sourceText = createSourceText(fs.readFileSync(filename, "utf8"), filename);
    const ast = parse(sourceText);
    const analysis = analyzeModule(ast, sourceText);
    const moduleRecord = { filename, sourceText, ast, analysis, dependencies: [] };
    visited.set(filename, moduleRecord);

    for (const entry of analysis.imports) {
      const classification = classifyImport(entry.source);
      const { resolved, failure } = resolveImportTarget(filename, entry.source);

      if ((classification.kind === "jayess-module" || classification.kind === "builtin-module" || classification.kind === "package") && resolved == null) {
        if (classification.kind === "package") {
          throwPackageResolutionFailure(entry.source, failure);
        }
        if (classification.kind === "builtin-module") {
          throwBuiltinResolutionFailure(entry.source);
        }
        throwMissingModule(entry.source);
      }

      if (classification.kind === "package" && resolved != null && !isSupportedJayessSourceFile(resolved)) {
        throwUnsupportedPackageTarget(entry.source, resolved);
      }

      moduleRecord.dependencies.push({
        source: entry.source,
        kind: classification.kind,
        resolved,
        specifiers: entry.specifiers
      });

      if (resolved != null) {
        visit(resolved, [...stack, filename]);
      }
    }
  }

  visit(root, []);
  const graph = {
    entryFilename: root,
    projectRoot,
    projectPackageJson,
    modules: [...visited.values()]
  };
  validateModuleGraph(graph);
  return graph;
}
