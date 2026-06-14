import fs from "node:fs";
import path from "node:path";
import { collectBindingIdentifiers } from "../ast/binding-patterns.js";
import { collectParameterBindingNames } from "../ast/parameters.js";
import { literal } from "../ast/nodes.js";
import { throwDiagnostics } from "../diagnostics.js";
import { createModuleDiagnostic } from "../diagnostics/module-diagnostic.js";

const assetImportSource = "jayess:canvas";

function isInsideDirectory(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function collectAssetImportLocals(ast) {
  const locals = new Map();
  for (const statement of ast.body) {
    if (statement.type !== "ImportDeclaration" || statement.source !== assetImportSource) {
      continue;
    }
    for (const specifier of statement.specifiers) {
      if (specifier.kind === "named" && (specifier.imported === "packHtml" || specifier.imported === "packCss")) {
        locals.set(specifier.local, specifier.imported);
      }
    }
  }
  return locals;
}

function declarationNames(statement) {
  const names = [];
  if (statement?.type === "VariableDeclaration") {
    for (const declaration of statement.declarations) {
      for (const identifier of collectBindingIdentifiers(declaration.id)) {
        names.push(identifier.name);
      }
    }
  }
  if (statement?.type === "FunctionDeclaration" && statement.id?.name != null) {
    names.push(statement.id.name);
  }
  if (statement?.type === "ClassDeclaration" && statement.id?.name != null) {
    names.push(statement.id.name);
  }
  return names;
}

function childScopeBlockedNames(node, blocked) {
  const next = new Set(blocked);
  if (node.type === "FunctionDeclaration" || node.type === "FunctionExpression" || node.type === "ArrowFunctionExpression") {
    for (const name of collectParameterBindingNames(node.params ?? [])) {
      next.add(name);
    }
    if (node.id?.name != null) {
      next.add(node.id.name);
    }
  }
  if (node.type === "BlockStatement" || node.type === "Program") {
    for (const statement of node.body ?? []) {
      for (const name of declarationNames(statement)) {
        next.add(name);
      }
    }
  }
  return next;
}

function assetExtension(kind) {
  return kind === "packHtml" ? ".html" : ".css";
}

function embeddedAssetLiteral(sourceText, node, kind, projectRoot) {
  if (node.arguments.length !== 1 || node.arguments[0]?.type !== "Literal" || node.arguments[0].kind !== "string") {
    throwDiagnostics([
      createModuleDiagnostic(sourceText, node, `${kind}() requires one static string filename`)
    ]);
  }
  const requested = node.arguments[0].value;
  if (!requested.startsWith("./") && !requested.startsWith("../")) {
    throwDiagnostics([
      createModuleDiagnostic(sourceText, node.arguments[0], `${kind}() only embeds relative asset paths`, requested)
    ]);
  }
  if (path.extname(requested) !== assetExtension(kind)) {
    throwDiagnostics([
      createModuleDiagnostic(sourceText, node.arguments[0], `${kind}() expects a ${assetExtension(kind)} asset`, requested)
    ]);
  }
  const resolved = path.resolve(path.dirname(sourceText.filename), requested);
  if (!isInsideDirectory(projectRoot, resolved)) {
    throwDiagnostics([
      createModuleDiagnostic(sourceText, node.arguments[0], `${kind}() cannot embed assets outside the project root`, resolved)
    ]);
  }
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    throwDiagnostics([
      createModuleDiagnostic(sourceText, node.arguments[0], `${kind}() asset does not exist`, resolved)
    ]);
  }
  return literal("string", fs.readFileSync(resolved, "utf8"), node.start, node.end);
}

function transformNode(sourceText, node, assetLocals, projectRoot, blocked) {
  if (node == null || typeof node !== "object") {
    return node;
  }

  if (
    node.type === "CallExpression"
    && node.callee?.type === "Identifier"
    && assetLocals.has(node.callee.name)
    && !blocked.has(node.callee.name)
  ) {
    return embeddedAssetLiteral(sourceText, node, assetLocals.get(node.callee.name), projectRoot);
  }

  const childBlocked = childScopeBlockedNames(node, blocked);
  for (const [key, value] of Object.entries(node)) {
    if (key === "start" || key === "end" || key === "type") {
      continue;
    }
    if (Array.isArray(value)) {
      node[key] = value.map((item) => transformNode(sourceText, item, assetLocals, projectRoot, childBlocked));
    } else if (value != null && typeof value === "object") {
      node[key] = transformNode(sourceText, value, assetLocals, projectRoot, childBlocked);
    }
  }
  return node;
}

export function embedCompileTimeAssets(ast, sourceText, projectRoot) {
  const assetLocals = collectAssetImportLocals(ast);
  if (assetLocals.size === 0) {
    return ast;
  }
  transformNode(sourceText, ast, assetLocals, path.resolve(projectRoot), new Set());
  return ast;
}
