import { collectBindingIdentifiers } from "../ast/binding-patterns.js";
import { collectParameterBindingNames } from "../ast/parameters.js";

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

function collectModuleDeclarations(ast) {
  const declarations = new Map();

  function add(name, node, kind) {
    if (name != null && !declarations.has(name)) {
      declarations.set(name, { name, kind, node });
    }
  }

  function addDeclaration(node) {
    if (node?.type === "FunctionDeclaration") {
      add(node.id?.name, node, "function");
    } else if (node?.type === "ClassDeclaration") {
      add(node.id?.name, node, "class");
    } else if (node?.type === "VariableDeclaration") {
      for (const declarator of node.declarations) {
        for (const identifier of collectBindingIdentifiers(declarator.id)) {
          add(identifier.name, declarator, node.kind);
        }
      }
    }
  }

  for (const statement of ast.body) {
    if (statement.type === "ExportNamedDeclaration" && statement.declaration != null) {
      addDeclaration(statement.declaration);
    } else if (statement.type === "ExportDefaultDeclaration") {
      addDeclaration(statement.declaration);
    } else {
      addDeclaration(statement);
    }
  }

  return declarations;
}

function collectImportLocalNames(moduleRecord) {
  const names = new Set();
  for (const entry of moduleRecord.analysis.imports) {
    for (const specifier of entry.specifiers ?? []) {
      names.add(specifier.local);
    }
  }
  return names;
}

function collectNestedBindingNames(node, names = new Set()) {
  if (node == null || typeof node !== "object") {
    return names;
  }

  if (node.type === "FunctionDeclaration" || node.type === "ClassDeclaration") {
    if (node.id?.name != null) {
      names.add(node.id.name);
    }
  }
  if (node.type === "FunctionDeclaration" || node.type === "FunctionExpression" || node.type === "ArrowFunctionExpression") {
    for (const name of collectParameterBindingNames(node.params ?? [])) {
      names.add(name);
    }
  }
  if (node.type === "VariableDeclaration") {
    for (const declarator of node.declarations) {
      for (const identifier of collectBindingIdentifiers(declarator.id)) {
        names.add(identifier.name);
      }
    }
  }
  if (node.type === "CatchClause" && node.param != null) {
    for (const identifier of collectBindingIdentifiers(node.param)) {
      names.add(identifier.name);
    }
  }

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        collectNestedBindingNames(item, names);
      }
    } else {
      collectNestedBindingNames(value, names);
    }
  }

  return names;
}

function collectIdentifierReferences(node, references = []) {
  if (node == null || typeof node !== "object") {
    return references;
  }

  if (node.type === "Identifier") {
    references.push(node.name);
    return references;
  }

  if (node.type === "VariableDeclarator") {
    collectIdentifierReferences(node.init, references);
    return references;
  }
  if (node.type === "Parameter") {
    collectIdentifierReferences(node.defaultValue, references);
    return references;
  }
  if (node.type === "MemberExpression" || node.type === "OptionalMemberExpression") {
    collectIdentifierReferences(node.object, references);
    if (node.computed) {
      collectIdentifierReferences(node.property, references);
    }
    return references;
  }
  if (node.type === "ObjectProperty") {
    if (node.key?.type !== "Identifier") {
      collectIdentifierReferences(node.key, references);
    }
    collectIdentifierReferences(node.value, references);
    return references;
  }
  if (node.type === "FunctionDeclaration" || node.type === "FunctionExpression" || node.type === "ArrowFunctionExpression") {
    for (const param of node.params ?? []) {
      collectIdentifierReferences(param.defaultValue, references);
    }
    collectIdentifierReferences(node.body, references);
    return references;
  }
  if (node.type === "ClassDeclaration") {
    collectIdentifierReferences(node.base, references);
    for (const member of node.methods ?? []) {
      collectIdentifierReferences(member, references);
    }
    return references;
  }

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        collectIdentifierReferences(item, references);
      }
    } else {
      collectIdentifierReferences(value, references);
    }
  }

  return references;
}

export function collectDeclarationReferences(moduleRecord) {
  const declarations = collectModuleDeclarations(moduleRecord.ast);
  const declarationNames = new Set(declarations.keys());
  const importNames = collectImportLocalNames(moduleRecord);
  const records = [];

  for (const declaration of declarations.values()) {
    const nestedBindings = collectNestedBindingNames(declaration.node);
    nestedBindings.add(declaration.name);
    const references = collectIdentifierReferences(declaration.node)
      .filter((name) => !nestedBindings.has(name));

    records.push({
      name: declaration.name,
      kind: declaration.kind,
      localReferences: sortedUnique(references.filter((name) => declarationNames.has(name))),
      importReferences: sortedUnique(references.filter((name) => importNames.has(name)))
    });
  }

  return records.sort((left, right) => left.name.localeCompare(right.name));
}
