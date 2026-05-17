import path from "node:path";
import { collectBindingIdentifiers, isBindingPattern } from "../ast/binding-patterns.js";
import { throwDiagnostics } from "../diagnostics.js";
import { createModuleDiagnostic } from "../diagnostics/module-diagnostic.js";
import { createSemanticDiagnostic } from "../diagnostics/semantic-diagnostic.js";
import { classifyImport } from "../modules/classify-import.js";
import { createScope, defineBinding, resolveBinding } from "./scope.js";

function addScopedBinding(scope, diagnostics, sourceText, node, name, binding) {
  if (!defineBinding(scope, name, binding)) {
    diagnostics.push(createSemanticDiagnostic(sourceText, node, `Duplicate declaration '${name}'`));
  }
}

function registerExport(exports, exportedName, localName, kind, source = null) {
  exports.push({ exportedName, localName, kind, source });
}

function libraryStem(source) {
  return path.basename(source, path.extname(source));
}

function validateImportBindings(sourceText, statement, classification, diagnostics) {
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
    return;
  }
}

function scopeBelongsToFunction(scope, functionScope) {
  let current = scope;
  while (current != null) {
    if (current === functionScope) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

function getSupportedBuiltinProperty(node) {
  if (node.type !== "MemberExpression" || node.computed || node.property.type !== "Identifier") {
    return null;
  }

  if (node.object.type === "ArrayExpression") {
    if (node.property.name === "length" || node.property.name === "push" || node.property.name === "pop" || node.property.name === "join") {
      return { receiver: "array", property: node.property.name };
    }
    return { receiver: "array", property: node.property.name, unsupported: true };
  }

  if (node.object.type === "Literal" && node.object.kind === "string") {
    if (node.property.name === "length" || node.property.name === "toString" || node.property.name === "slice" || node.property.name === "substring" || node.property.name === "startsWith") {
      return { receiver: "string", property: node.property.name };
    }
    return { receiver: "string", property: node.property.name, unsupported: true };
  }

  if (node.object.type === "Literal" && (node.object.kind === "number" || node.object.kind === "boolean" || node.object.kind === "null")) {
    if (node.property.name === "toString") {
      return { receiver: node.object.kind, property: node.property.name };
    }
    return { receiver: node.object.kind, property: node.property.name, unsupported: true };
  }

  return null;
}

function bindBlockDeclarations(statements, scope, diagnostics, sourceText) {
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

function validateFinallyControlFlow(node, diagnostics, sourceText) {
  if (node == null) {
    return;
  }

  switch (node.type) {
    case "BlockStatement":
      for (const statement of node.body) {
        validateFinallyControlFlow(statement, diagnostics, sourceText);
      }
      return;
    case "IfStatement":
      validateFinallyControlFlow(node.consequent, diagnostics, sourceText);
      validateFinallyControlFlow(node.alternate, diagnostics, sourceText);
      return;
    case "WhileStatement":
    case "DoWhileStatement":
      validateFinallyControlFlow(node.body, diagnostics, sourceText);
      return;
    case "ForStatement":
      validateFinallyControlFlow(node.body, diagnostics, sourceText);
      return;
    case "SwitchStatement":
      for (const clause of node.cases) {
        for (const statement of clause.consequent) {
          validateFinallyControlFlow(statement, diagnostics, sourceText);
        }
      }
      return;
    case "TryStatement":
      validateFinallyControlFlow(node.block, diagnostics, sourceText);
      validateFinallyControlFlow(node.handler?.body ?? null, diagnostics, sourceText);
      validateFinallyControlFlow(node.finalizer, diagnostics, sourceText);
      return;
    case "ReturnStatement":
      diagnostics.push(createSemanticDiagnostic(sourceText, node, "Jayess does not yet support 'return' inside finally blocks"));
      return;
    case "BreakStatement":
      diagnostics.push(createSemanticDiagnostic(sourceText, node, "Jayess does not yet support 'break' inside finally blocks"));
      return;
    case "ContinueStatement":
      diagnostics.push(createSemanticDiagnostic(sourceText, node, "Jayess does not yet support 'continue' inside finally blocks"));
      return;
    case "FunctionDeclaration":
    case "FunctionExpression":
    case "ArrowFunctionExpression":
    case "ClassDeclaration":
    case "MethodDefinition":
      return;
    default:
      return;
  }
}

function reportGeneratorExpressionNotImplemented(node, diagnostics, sourceText) {
  diagnostics.push(
    createSemanticDiagnostic(
      sourceText,
      node,
      "Jayess does not support generator function expressions yet; the first generator slice starts with generator declarations only"
    )
  );
}

function currentClassLabel(currentClass) {
  return currentClass?.id?.name != null ? `class '${currentClass.id.name}'` : "the current class";
}

function initializePrivateFieldMap(classNode, diagnostics, sourceText) {
  if (classNode.privateFieldMap != null) {
    return classNode.privateFieldMap;
  }

  const privateFieldMap = new Map();
  for (const member of classNode.methods) {
    if (member.type !== "ClassFieldDefinition" || member.key.type !== "PrivateIdentifier") {
      continue;
    }
    if (privateFieldMap.has(member.key.name)) {
      diagnostics.push(
        createSemanticDiagnostic(
          sourceText,
          member.key,
          `Duplicate private field '#${member.key.name}' in ${currentClassLabel(classNode)}`
        )
      );
      continue;
    }
    privateFieldMap.set(member.key.name, member.key);
  }

  classNode.privateFieldMap = privateFieldMap;
  return privateFieldMap;
}

function validatePrivateMemberAccess(node, currentClass, diagnostics, sourceText) {
  if (node.property?.type !== "PrivateIdentifier") {
    return;
  }

  if (currentClass == null) {
    diagnostics.push(
      createSemanticDiagnostic(
        sourceText,
        node.property,
        "Jayess private field access is only valid inside methods or field initializers of the declaring class"
      )
    );
    return;
  }

  const privateFieldMap = currentClass.privateFieldMap ?? new Map();
  if (!privateFieldMap.has(node.property.name)) {
    diagnostics.push(
      createSemanticDiagnostic(
        sourceText,
        node.property,
        `Private field '#${node.property.name}' is not declared in ${currentClassLabel(currentClass)}`
      )
    );
  }
}

export function analyzeModule(ast, sourceText, options = {}) {
  const diagnostics = [];
  const imports = [];
  const exports = [];
  const moduleScope = createScope(null, "module");
  const localExportsToValidate = [];

  function addModuleBinding(node, name, kind, exported = false, metadata = {}) {
    const binding = { name, kind, node, exported, ...metadata };
    addScopedBinding(moduleScope, diagnostics, sourceText, node, name, binding);
    if (exported) {
      registerExport(exports, name, name, kind);
    }
    return binding;
  }

  for (const statement of ast.body) {
    if (statement.type === "ImportDeclaration") {
      const classification = classifyImport(statement.source);
      const localNames = new Set();
      const importedHeaderStems = new Set(
        ast.body
          .filter((entry) => entry.type === "ImportDeclaration" && classifyImport(entry.source).kind === "native-header")
          .map((entry) => libraryStem(entry.source))
      );

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
      if (statement.declaration != null) {
        if (statement.declaration.type === "FunctionDeclaration") {
          addModuleBinding(statement.declaration.id, statement.declaration.id.name, "function", true);
        }
        if (statement.declaration.type === "VariableDeclaration") {
          for (const declaration of statement.declaration.declarations) {
            for (const identifier of collectBindingIdentifiers(declaration.id)) {
              addModuleBinding(identifier, identifier.name, statement.declaration.kind, true);
            }
          }
        }
        if (statement.declaration.type === "ClassDeclaration") {
          if (statement.declaration.id != null) {
            addModuleBinding(statement.declaration.id, statement.declaration.id.name, "class", true);
          }
        }
        continue;
      }

      if (statement.source == null) {
        for (const specifier of statement.specifiers) {
          registerExport(exports, specifier.exportedName, specifier.localName, "local-export");
          localExportsToValidate.push(specifier);
        }
        continue;
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
        registerExport(exports, specifier.exportedName, specifier.localName, "re-export", statement.source);
      }
      continue;
    }

    if (statement.type === "ExportAllDeclaration") {
      const classification = classifyImport(statement.source);
      imports.push({
        source: statement.source,
        kind: classification.kind,
        specifiers: []
      });
      registerExport(exports, "*", "*", "export-all", statement.source);
      continue;
    }

    if (statement.type === "ExportDefaultDeclaration") {
      if (statement.declaration?.type === "FunctionDeclaration") {
        addModuleBinding(statement.declaration.id, statement.declaration.id.name, "function");
      }
      if (statement.declaration?.type === "ClassDeclaration") {
        if (statement.declaration.id != null) {
          addModuleBinding(statement.declaration.id, statement.declaration.id.name, "class");
        }
      }
      registerExport(exports, "default", "__default_export__", "default");
    }
  }

  function resolveIdentifier(node, activeScope, functionScope = null, functionNode = null) {
    const binding = resolveBinding(activeScope, node.name);
    if (binding == null || binding.node?.start > node.start) {
      diagnostics.push(createSemanticDiagnostic(sourceText, node, `Undefined identifier '${node.name}'`));
      return null;
    }
    if (
      functionScope != null
      && functionNode != null
      && binding.scope != null
      && binding.scope.kind !== "module"
      && binding.scope.kind !== "module-body"
      && !scopeBelongsToFunction(binding.scope, functionScope)
    ) {
      const captures = new Set(functionNode.captures ?? []);
      captures.add(node.name);
      functionNode.captures = [...captures].sort();
    }
    return binding;
  }

  function walk(
    node,
    activeScope,
    loopDepth = 0,
    switchDepth = 0,
    functionScope = null,
    functionNode = null,
    inAsyncFunction = false,
    inGeneratorFunction = false,
    currentClass = null,
    currentMethod = null
  ) {
    if (node == null) {
      return;
    }

    switch (node.type) {
      case "Program":
        for (const statement of node.body) {
          walk(statement, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        }
        return;
      case "BlockStatement": {
        const blockScope = createScope(activeScope, "block");
        bindBlockDeclarations(node.body, blockScope, diagnostics, sourceText);
        for (const statement of node.body) {
          walk(statement, blockScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        }
        return;
      }
      case "FunctionDeclaration": {
        const nestedFunctionScope = createScope(activeScope, "function");
        for (const param of node.params) {
          walk(param.defaultValue, nestedFunctionScope, 0, 0, nestedFunctionScope, null, node.async === true, node.generator === true, currentClass, null);
          addScopedBinding(nestedFunctionScope, diagnostics, sourceText, param, param.name, {
            name: param.name,
            kind: "param",
            node: param
          });
        }
        walk(node.body, nestedFunctionScope, 0, 0, nestedFunctionScope, null, node.async === true, node.generator === true, currentClass, null);
        return;
      }
      case "ClassDeclaration": {
        if (node.base != null) {
          if (node.base.type !== "Identifier") {
            diagnostics.push(
              createSemanticDiagnostic(
                sourceText,
                node.base,
                "Jayess inheritance currently supports only named Jayess class bases in the first semantic slice"
              )
            );
          } else {
            const baseBinding = resolveIdentifier(node.base, activeScope, functionScope, functionNode);
            if (baseBinding != null && baseBinding.kind !== "class") {
              diagnostics.push(
                createSemanticDiagnostic(
                  sourceText,
                  node.base,
                  `Base class '${node.base.name}' must resolve to a Jayess class`
                )
              );
            }
          }
        }
        initializePrivateFieldMap(node, diagnostics, sourceText);
        const classScope = createScope(activeScope, "class");
        for (const method of node.methods) {
          if (method.type === "MethodDefinition" && method.static && method.key.name === "constructor") {
            diagnostics.push(createSemanticDiagnostic(sourceText, method.key, "Constructors cannot be declared static"));
            continue;
          }
          walk(method, classScope, 0, 0, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, node, null);
        }
        return;
      }
      case "ClassFieldDefinition": {
        if (node.computed) {
          walk(node.key, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        }
        const fieldScope = createScope(activeScope, "class-field");
        if (!node.static) {
          addScopedBinding(fieldScope, diagnostics, sourceText, node.key, "this", {
            name: "this",
            kind: "this",
            node: node.key
          });
        }
        walk(node.init, fieldScope, 0, 0, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, null);
        return;
      }
      case "MethodDefinition": {
        if (node.computed) {
          walk(node.key, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        }
        const methodScope = createScope(activeScope, "function");
        addScopedBinding(methodScope, diagnostics, sourceText, node.key, "this", {
          name: "this",
          kind: "this",
          node: node.key
        });
        for (const param of node.params) {
          walk(param.defaultValue, methodScope, 0, 0, methodScope, null, false, false, currentClass, node);
          addScopedBinding(methodScope, diagnostics, sourceText, param, param.name, {
            name: param.name,
            kind: "param",
            node: param
          });
        }
        walk(node.body, methodScope, 0, 0, methodScope, null, false, false, currentClass, node);
        return;
      }
      case "StaticInitializationBlock": {
        const staticBlockScope = createScope(activeScope, "class-static-block");
        bindBlockDeclarations(node.body.body, staticBlockScope, diagnostics, sourceText);
        for (const statement of node.body.body) {
          walk(statement, staticBlockScope, 0, 0, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, null);
        }
        return;
      }
      case "FunctionExpression": {
        node.captures = [];
        if (node.generator) {
          reportGeneratorExpressionNotImplemented(node, diagnostics, sourceText);
        }
        const nestedFunctionScope = createScope(activeScope, "function");
        if (node.id != null) {
          addScopedBinding(nestedFunctionScope, diagnostics, sourceText, node.id, node.id.name, {
            name: node.id.name,
            kind: "function-expression-name",
            node: node.id
          });
        }
        for (const param of node.params) {
          walk(param.defaultValue, nestedFunctionScope, 0, 0, nestedFunctionScope, node, node.async === true, node.generator === true, currentClass, null);
          addScopedBinding(nestedFunctionScope, diagnostics, sourceText, param, param.name, {
            name: param.name,
            kind: "param",
            node: param
          });
        }
        walk(node.body, nestedFunctionScope, 0, 0, nestedFunctionScope, node, node.async === true, node.generator === true, currentClass, null);
        return;
      }
      case "ArrowFunctionExpression": {
        node.captures = [];
        const nestedFunctionScope = createScope(activeScope, "function");
        for (const param of node.params) {
          walk(param.defaultValue, nestedFunctionScope, 0, 0, nestedFunctionScope, node, node.async === true, node.generator === true, currentClass, null);
          addScopedBinding(nestedFunctionScope, diagnostics, sourceText, param, param.name, {
            name: param.name,
            kind: "param",
            node: param
          });
        }
        walk(node.body, nestedFunctionScope, 0, 0, nestedFunctionScope, node, node.async === true, node.generator === true, currentClass, null);
        return;
      }
      case "VariableDeclaration":
        for (const declaration of node.declarations) {
          walk(declaration.init, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        }
        return;
      case "ExportDefaultDeclaration":
        walk(node.declaration, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        return;
      case "ReturnStatement":
        walk(node.argument, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        return;
      case "ThrowStatement":
        walk(node.argument, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        return;
      case "ExpressionStatement":
        walk(node.expression, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        return;
      case "AssignmentExpression": {
        if (node.left.type === "MemberExpression") {
          validatePrivateMemberAccess(node.left, currentClass, diagnostics, sourceText);
          walk(node.left.object, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
          if (node.left.computed) {
            walk(node.left.property, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
          }
        } else if (node.left.type !== "Identifier") {
          diagnostics.push(
            createSemanticDiagnostic(
              sourceText,
              node.left,
              `Jayess semantic analysis does not support '${node.operator}' on this assignment target`
            )
          );
        }
        if (node.left.type === "Identifier") {
          const binding = resolveIdentifier(node.left, activeScope, functionScope, functionNode);
          if (binding?.kind === "const") {
            const verb = node.operator === "=" ? "reassign" : "update";
            diagnostics.push(createSemanticDiagnostic(sourceText, node.left, `Cannot ${verb} const '${node.left.name}'`));
          }
        }
        walk(node.right, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        return;
      }
      case "BinaryExpression":
        walk(node.left, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        walk(node.right, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        return;
      case "ConditionalExpression":
        walk(node.test, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        walk(node.consequent, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        walk(node.alternate, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        return;
      case "UnaryExpression":
        walk(node.argument, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        return;
      case "AwaitExpression":
        if (!inAsyncFunction) {
          diagnostics.push(createSemanticDiagnostic(sourceText, node, "'await' is only valid inside async functions"));
        }
        walk(node.argument, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        return;
      case "YieldExpression":
        if (!inGeneratorFunction) {
          diagnostics.push(createSemanticDiagnostic(sourceText, node, "'yield' is only valid inside generator functions"));
        }
        walk(node.argument, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        return;
      case "UpdateExpression": {
        if (node.argument.type === "MemberExpression") {
          validatePrivateMemberAccess(node.argument, currentClass, diagnostics, sourceText);
          walk(node.argument.object, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
          if (node.argument.computed) {
            walk(node.argument.property, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
          }
          return;
        }
        if (node.argument.type !== "Identifier") {
          diagnostics.push(
            createSemanticDiagnostic(
              sourceText,
              node.argument,
              `Jayess semantic analysis does not support '${node.operator}' on this update target`
            )
          );
          return;
        }
        const binding = resolveIdentifier(node.argument, activeScope, functionScope, functionNode);
        if (binding?.kind === "const") {
          diagnostics.push(createSemanticDiagnostic(sourceText, node.argument, `Cannot update const '${node.argument.name}'`));
        }
        return;
      }
      case "CallExpression":
      case "OptionalCallExpression":
        if (node.callee.type === "SuperExpression") {
          const validSuperConstructorCall = (
            currentClass?.base != null
            && currentMethod?.kind === "constructor"
            && currentMethod?.static !== true
          );
          if (!validSuperConstructorCall) {
            diagnostics.push(
              createSemanticDiagnostic(
                sourceText,
                node.callee,
                "Jayess currently allows 'super(...)' only inside derived constructors"
              )
            );
          }
        }
        if (node.callee.type === "MemberExpression") {
          const builtin = getSupportedBuiltinProperty(node.callee);
          if (builtin?.property === "length") {
            diagnostics.push(
              createSemanticDiagnostic(
                sourceText,
                node.callee.property,
                `${builtin.receiver} property '${builtin.property}' is not callable`
              )
            );
          }
          if (builtin?.property === "toString" && node.arguments.length > 0) {
            diagnostics.push(
              createSemanticDiagnostic(
                sourceText,
                node.callee.property,
                `${builtin.receiver} method '${builtin.property}' does not accept arguments`
              )
            );
          }
          if (builtin?.property === "pop" && node.arguments.length > 0) {
            diagnostics.push(
              createSemanticDiagnostic(
                sourceText,
                node.callee.property,
                `${builtin.receiver} method '${builtin.property}' does not accept arguments`
              )
            );
          }
          if (builtin?.property === "join" && node.arguments.length > 1) {
            diagnostics.push(
              createSemanticDiagnostic(
                sourceText,
                node.callee.property,
                `${builtin.receiver} method '${builtin.property}' accepts at most one argument`
              )
            );
          }
          if ((builtin?.property === "slice" || builtin?.property === "substring") && (node.arguments.length < 1 || node.arguments.length > 2)) {
            diagnostics.push(
              createSemanticDiagnostic(
                sourceText,
                node.callee.property,
                `${builtin.receiver} method '${builtin.property}' requires one or two arguments`
              )
            );
          }
          if (builtin?.property === "startsWith" && node.arguments.length !== 1) {
            diagnostics.push(
              createSemanticDiagnostic(
                sourceText,
                node.callee.property,
                `${builtin.receiver} method '${builtin.property}' requires exactly one argument`
              )
            );
          }
        }
        walk(node.callee, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        for (const argument of node.arguments) {
          walk(argument, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        }
        return;
      case "NewExpression":
        walk(node.callee, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        for (const argument of node.arguments) {
          walk(argument, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        }
        return;
      case "MemberExpression":
      case "OptionalMemberExpression":
        validatePrivateMemberAccess(node, currentClass, diagnostics, sourceText);
        if (node.object.type === "SuperExpression") {
          const validSuperMemberLookup = (
            currentClass?.base != null
            && currentMethod?.kind === "method"
            && currentMethod?.static !== true
          );
          if (!validSuperMemberLookup) {
            diagnostics.push(
              createSemanticDiagnostic(
                sourceText,
                node.object,
                "Jayess currently allows 'super.name' only inside derived instance methods"
              )
            );
          }
        }
        {
          const builtin = getSupportedBuiltinProperty(node);
          if (builtin?.unsupported) {
            diagnostics.push(
              createSemanticDiagnostic(
                sourceText,
                node.property,
                `Unsupported built-in ${builtin.receiver} property '${builtin.property}'`
              )
            );
          }
        }
        walk(node.object, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        if (node.computed) {
          walk(node.property, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        }
        return;
      case "ArrayExpression":
        for (const element of node.elements) {
          walk(element, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        }
        return;
      case "ObjectExpression":
        for (const property of node.properties) {
          if (property.type === "SpreadElement") {
            walk(property.argument, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
            continue;
          }
          walk(property.value, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        }
        return;
      case "TemplateLiteral":
        for (const expression of node.expressions) {
          walk(expression, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        }
        return;
      case "SpreadElement":
        walk(node.argument, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        return;
      case "IfStatement":
        walk(node.test, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        walk(node.consequent, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        walk(node.alternate, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        return;
      case "SwitchStatement": {
        walk(node.discriminant, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        for (const clause of node.cases) {
          const clauseScope = createScope(activeScope, "switch-case");
          bindBlockDeclarations(clause.consequent, clauseScope, diagnostics, sourceText);
          for (const statement of clause.consequent) {
            walk(statement, clauseScope, loopDepth, switchDepth + 1, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
          }
        }
        return;
      }
      case "TryStatement": {
        walk(node.block, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        if (node.handler != null) {
          const catchScope = createScope(activeScope, "catch");
          if (node.handler.param != null) {
            addScopedBinding(catchScope, diagnostics, sourceText, node.handler.param, node.handler.param.name, {
              name: node.handler.param.name,
              kind: "catch",
              node: node.handler.param
            });
          }
          bindBlockDeclarations(node.handler.body.body, catchScope, diagnostics, sourceText);
          for (const statement of node.handler.body.body) {
            walk(statement, catchScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
          }
        }
        if (node.finalizer != null) {
          validateFinallyControlFlow(node.finalizer, diagnostics, sourceText);
          walk(node.finalizer, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        }
        return;
      }
      case "WhileStatement":
        walk(node.test, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        walk(node.body, activeScope, loopDepth + 1, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        return;
      case "DoWhileStatement":
        walk(node.body, activeScope, loopDepth + 1, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        walk(node.test, activeScope, loopDepth + 1, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        return;
      case "ForStatement": {
        const loopScope = createScope(activeScope, "loop");
        if (node.init?.type === "VariableDeclaration") {
          for (const declaration of node.init.declarations) {
            if (isBindingPattern(declaration.id)) {
              diagnostics.push(
                createSemanticDiagnostic(
                  sourceText,
                  declaration.id,
                  "Destructuring declarations are not yet supported in for-loop initializers"
                )
              );
            }
            for (const identifier of collectBindingIdentifiers(declaration.id)) {
              addScopedBinding(loopScope, diagnostics, sourceText, identifier, identifier.name, {
                name: identifier.name,
                kind: node.init.kind,
                node: identifier
              });
            }
          }
        }
        walk(node.init, loopScope, loopDepth + 1, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        walk(node.test, loopScope, loopDepth + 1, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        walk(node.update, loopScope, loopDepth + 1, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        walk(node.body, loopScope, loopDepth + 1, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, currentMethod);
        return;
      }
      case "BreakStatement":
        if (loopDepth === 0 && switchDepth === 0) {
          diagnostics.push(createSemanticDiagnostic(sourceText, node, "break is only valid inside a loop or switch"));
        }
        return;
      case "ContinueStatement":
        if (loopDepth === 0) {
          diagnostics.push(createSemanticDiagnostic(sourceText, node, "continue is only valid inside a loop"));
        }
        return;
      case "Identifier":
        if (functionNode?.type === "ArrowFunctionExpression" && node.name === "arguments") {
          diagnostics.push(
            createSemanticDiagnostic(
              sourceText,
              node,
              "Jayess arrow functions do not support 'arguments'; use named parameters instead"
            )
          );
          return;
        }
        resolveIdentifier(node, activeScope, functionScope, functionNode);
        return;
      case "ThisExpression":
        resolveIdentifier({ ...node, name: "this" }, activeScope, functionScope, functionNode);
        return;
      case "SuperExpression":
        if (currentClass?.base == null || currentMethod == null) {
          diagnostics.push(
            createSemanticDiagnostic(
              sourceText,
              node,
              "Jayess currently allows 'super' only inside derived classes"
            )
          );
        }
        return;
      default:
        return;
    }
  }

  const rootScope = createScope(null, "module-body");
  for (const [name, binding] of moduleScope.bindings.entries()) {
    defineBinding(rootScope, name, binding);
  }
  walk(ast, rootScope);

  for (const specifier of localExportsToValidate) {
    if (resolveBinding(rootScope, specifier.localName) == null) {
      diagnostics.push(
        createSemanticDiagnostic(sourceText, specifier, `Cannot export undefined local binding '${specifier.localName}'`)
      );
    }
  }

  if (diagnostics.length > 0 && options.throwOnError !== false) {
    throwDiagnostics(diagnostics);
  }

  return { diagnostics, imports, exports, scope: rootScope };
}
