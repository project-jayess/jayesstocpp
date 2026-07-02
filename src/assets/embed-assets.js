import fs from "node:fs";
import path from "node:path";
import { collectBindingIdentifiers } from "../ast/binding-patterns.js";
import { collectParameterBindingNames } from "../ast/parameters.js";
import { importDeclaration, literal } from "../ast/nodes.js";
import { throwDiagnostics } from "../diagnostics.js";
import { createModuleDiagnostic } from "../diagnostics/module-diagnostic.js";

const assetPackersByImportSource = new Map([
  ["jayess:canvas", ["packHtml", "packCss", "packXml", "packImage"]],
  ["jayess:font", ["packFont"]]
]);

function isInsideDirectory(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function collectAssetImportLocals(ast) {
  const locals = new Map();
  for (const statement of ast.body) {
    if (statement.type !== "ImportDeclaration") {
      continue;
    }
    const packers = assetPackersByImportSource.get(statement.source);
    if (packers == null) {
      continue;
    }
    for (const specifier of statement.specifiers) {
      if (specifier.kind === "named" && packers.includes(specifier.imported)) {
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
  if (kind === "packHtml") {
    return ".html";
  }
  if (kind === "packCss") {
    return ".css";
  }
  if (kind === "packXml") {
    return ".xml";
  }
  return null;
}

function imageAssetExtension(requested) {
  const extension = path.extname(requested);
  if (extension === ".ppm" || extension === ".pgm") {
    return extension;
  }
  return null;
}

function fontAssetExtension(requested) {
  const extension = path.extname(requested);
  if ([".ttf", ".otf", ".woff", ".woff2"].includes(extension)) {
    return extension;
  }
  return null;
}

function packagedFontPath(requested) {
  return `assets/fonts/${path.basename(requested)}`;
}

function embeddedAssetLiteral(sourceText, node, kind, projectRoot, addedAssetImports) {
  const maximumArguments = kind === "packFont" ? 2 : 1;
  if (node.arguments.length < 1 || node.arguments.length > maximumArguments || node.arguments[0]?.type !== "Literal" || node.arguments[0].kind !== "string") {
    throwDiagnostics([
      createModuleDiagnostic(sourceText, node, `${kind}() requires one static string filename${kind === "packFont" ? " and an optional options object" : ""}`)
    ]);
  }
  const requested = node.arguments[0].value;
  if (!requested.startsWith("./") && !requested.startsWith("../")) {
    throwDiagnostics([
      createModuleDiagnostic(sourceText, node.arguments[0], `${kind}() only embeds relative asset paths`, requested)
    ]);
  }
  const requiredExtension = assetExtension(kind);
  if (requiredExtension !== null && path.extname(requested) !== requiredExtension) {
    throwDiagnostics([
      createModuleDiagnostic(sourceText, node.arguments[0], `${kind}() expects a ${requiredExtension} asset`, requested)
    ]);
  }
  const imageExtension = kind === "packImage" ? imageAssetExtension(requested) : null;
  if (kind === "packImage" && imageExtension === null) {
    throwDiagnostics([
      createModuleDiagnostic(sourceText, node.arguments[0], "packImage() currently embeds .ppm and .pgm assets", requested)
    ]);
  }
  const fontExtension = kind === "packFont" ? fontAssetExtension(requested) : null;
  if (kind === "packFont" && fontExtension === null) {
    throwDiagnostics([
      createModuleDiagnostic(sourceText, node.arguments[0], "packFont() currently packages .ttf, .otf, .woff, and .woff2 assets", requested)
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
  if (kind === "packFont") {
    addedAssetImports.add(requested);
    const start = node.arguments[0].start;
    const end = node.arguments[0].end;
    const name = path.basename(requested, fontExtension);
    const options = node.arguments[1] ?? literal("null", null, start, end);
    node.arguments = [
      literal("string", name, start, end),
      literal("string", packagedFontPath(requested), start, end),
      literal("string", fontExtension.slice(1), start, end),
      options
    ];
    return node;
  }
  const contents = fs.readFileSync(resolved, "utf8");
  if (kind === "packImage") {
    node.arguments = [
      literal("string", contents, node.arguments[0].start, node.arguments[0].end),
      literal("string", imageExtension, node.arguments[0].start, node.arguments[0].end)
    ];
    return node;
  }
  return literal("string", contents, node.start, node.end);
}

function transformNode(sourceText, node, assetLocals, projectRoot, blocked, addedAssetImports) {
  if (node == null || typeof node !== "object") {
    return node;
  }

  if (
    node.type === "CallExpression"
    && node.callee?.type === "Identifier"
    && assetLocals.has(node.callee.name)
    && !blocked.has(node.callee.name)
  ) {
    return embeddedAssetLiteral(sourceText, node, assetLocals.get(node.callee.name), projectRoot, addedAssetImports);
  }

  const childBlocked = childScopeBlockedNames(node, blocked);
  for (const [key, value] of Object.entries(node)) {
    if (key === "start" || key === "end" || key === "type") {
      continue;
    }
    if (Array.isArray(value)) {
      node[key] = value.map((item) => transformNode(sourceText, item, assetLocals, projectRoot, childBlocked, addedAssetImports));
    } else if (value != null && typeof value === "object") {
      node[key] = transformNode(sourceText, value, assetLocals, projectRoot, childBlocked, addedAssetImports);
    }
  }
  return node;
}

function existingSideEffectImports(ast) {
  return new Set(
    ast.body
      .filter((statement) => statement.type === "ImportDeclaration" && statement.specifiers.length === 0)
      .map((statement) => statement.source)
  );
}

export function embedCompileTimeAssets(ast, sourceText, projectRoot) {
  const assetLocals = collectAssetImportLocals(ast);
  if (assetLocals.size === 0) {
    return ast;
  }
  const addedAssetImports = new Set();
  transformNode(sourceText, ast, assetLocals, path.resolve(projectRoot), new Set(), addedAssetImports);
  if (addedAssetImports.size > 0) {
    const existing = existingSideEffectImports(ast);
    const imports = [...addedAssetImports]
      .filter((source) => !existing.has(source))
      .sort()
      .map((source) => importDeclaration([], source, 0, 0));
    ast.body = [...imports, ...ast.body];
  }
  return ast;
}
