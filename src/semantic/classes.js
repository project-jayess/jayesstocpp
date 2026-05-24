import { createSemanticDiagnostic } from "../diagnostics/semantic-diagnostic.js";

function currentClassLabel(currentClass) {
  return currentClass?.id?.name != null ? `class '${currentClass.id.name}'` : "the current class";
}

function privateMemberKindLabel(member) {
  if (member.type === "ClassFieldDefinition") {
    return "field";
  }
  if (member.type === "MethodDefinition") {
    return "method";
  }
  return "member";
}

export function initializePrivateMemberMap(classNode, diagnostics, sourceText) {
  if (classNode.privateMemberMap != null) {
    return classNode.privateMemberMap;
  }

  const privateMemberMap = new Map();
  for (const member of classNode.methods) {
    if (member.key?.type !== "PrivateIdentifier") {
      continue;
    }

    if (privateMemberMap.has(member.key.name)) {
      const existing = privateMemberMap.get(member.key.name);
      diagnostics.push(
        createSemanticDiagnostic(
          sourceText,
          member.key,
          `Duplicate private ${privateMemberKindLabel(member)} '#${member.key.name}' conflicts with existing private ${privateMemberKindLabel(existing)} in ${currentClassLabel(classNode)}`
        )
      );
      continue;
    }
    privateMemberMap.set(member.key.name, member);
  }

  classNode.privateMemberMap = privateMemberMap;
  return privateMemberMap;
}

export function validatePrivateMemberAccess(node, currentClass, currentMethod, diagnostics, sourceText) {
  if (node.property?.type !== "PrivateIdentifier") {
    return;
  }

  if (currentClass == null) {
    diagnostics.push(
      createSemanticDiagnostic(
        sourceText,
        node.property,
        "Jayess private member access is only valid inside methods or field initializers of the declaring class"
      )
    );
    return;
  }

  const privateMemberMap = currentClass.privateMemberMap ?? new Map();
  if (!privateMemberMap.has(node.property.name)) {
    diagnostics.push(
      createSemanticDiagnostic(
        sourceText,
        node.property,
        `Private member '#${node.property.name}' is not declared in ${currentClassLabel(currentClass)}`
      )
    );
    return;
  }

  const member = privateMemberMap.get(node.property.name);
  const staticAccess = isPrivateStaticAccessTarget(node.object, currentClass, currentMethod);
  if (member.static && !staticAccess) {
    diagnostics.push(
      createSemanticDiagnostic(
        sourceText,
        node.property,
        `Private static member '#${node.property.name}' must be accessed through the declaring class`
      )
    );
  }
  if (!member.static && staticAccess) {
    diagnostics.push(
      createSemanticDiagnostic(
        sourceText,
        node.property,
        `Private instance member '#${node.property.name}' must be accessed through an instance`
      )
    );
  }
}

function isPrivateStaticAccessTarget(objectNode, currentClass, currentMethod) {
  if (objectNode?.type === "Identifier" && currentClass?.id?.name === objectNode.name) {
    return true;
  }
  return objectNode?.type === "ThisExpression" && currentMethod?.static === true;
}

function isSuperConstructorStatement(node) {
  return node?.type === "ExpressionStatement"
    && node.expression?.type === "CallExpression"
    && node.expression.callee?.type === "SuperExpression";
}

export function walkClassDeclaration(node, context) {
  const {
    activeScope,
    addScopedBinding,
    bindBlockDeclarations,
    bindParameter,
    createScope,
    diagnostics,
    functionNode,
    functionScope,
    inAsyncFunction,
    inGeneratorFunction,
    resolveIdentifier,
    sourceText,
    walk,
    walkBindingPattern
  } = context;

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

  initializePrivateMemberMap(node, diagnostics, sourceText);
  const classScope = createScope(activeScope, "class");
  const childContext = {
    ...context,
    addScopedBinding,
    activeScope: classScope,
    bindBlockDeclarations,
    bindParameter,
    currentClass: node,
    functionNode,
    functionScope,
    inAsyncFunction,
    inGeneratorFunction,
    walk,
    walkBindingPattern
  };
  for (const method of node.methods) {
    if (method.type === "MethodDefinition" && method.static && method.key.name === "constructor") {
      diagnostics.push(createSemanticDiagnostic(sourceText, method.key, "Constructors cannot be declared static"));
      continue;
    }
    walkClassMember(method, childContext);
  }
}

export function walkClassMember(node, context) {
  if (node.type === "ClassFieldDefinition") {
    walkClassFieldDefinition(node, context);
    return;
  }
  if (node.type === "MethodDefinition") {
    walkMethodDefinition(node, context);
    return;
  }
  if (node.type === "StaticInitializationBlock") {
    walkStaticInitializationBlock(node, context);
  }
}

export function walkClassFieldDefinition(node, context) {
  const {
    activeScope,
    addScopedBinding,
    createScope,
    currentClass,
    diagnostics,
    functionNode,
    functionScope,
    inAsyncFunction,
    inGeneratorFunction,
    loopDepth,
    sourceText,
    switchDepth,
    walk
  } = context;

  if (node.computed) {
    walk(node.key, activeScope, loopDepth, switchDepth, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, null);
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
}

export function walkMethodDefinition(node, context) {
  const {
    activeScope,
    addScopedBinding,
    bindParameter,
    createScope,
    currentClass,
    diagnostics,
    sourceText,
    walk,
    walkBindingPattern
  } = context;

  if (node.computed) {
    walk(node.key, activeScope, context.loopDepth, context.switchDepth, context.functionScope, context.functionNode, context.inAsyncFunction, context.inGeneratorFunction, currentClass, context.currentMethod);
  }
  if (node.async === true && node.kind === "constructor") {
    diagnostics.push(createSemanticDiagnostic(sourceText, node.key, "Jayess does not support async constructors"));
  }
  if (node.async === true && node.generator === true) {
    diagnostics.push(createSemanticDiagnostic(sourceText, node.key, "Jayess does not support async generator methods"));
  }
  if (currentClass?.base != null && node.kind === "constructor" && node.static !== true && !isSuperConstructorStatement(node.body.body[0])) {
    diagnostics.push(createSemanticDiagnostic(sourceText, node.key, "Derived constructors currently require 'super(...)' as their first statement"));
  }
  const methodScope = createScope(activeScope, "function");
  addScopedBinding(methodScope, diagnostics, sourceText, node.key, "this", {
    name: "this",
    kind: "this",
    node: node.key
  });
  for (const param of node.params) {
    walk(param.defaultValue, methodScope, 0, 0, methodScope, node, node.async === true, node.generator === true, currentClass, node);
    walkBindingPattern(param.id, methodScope, 0, 0, methodScope, node, node.async === true, node.generator === true, currentClass, node, true);
    bindParameter(param, methodScope, diagnostics, sourceText);
  }
  walk(node.body, methodScope, 0, 0, methodScope, node, node.async === true, node.generator === true, currentClass, node);
}

export function walkStaticInitializationBlock(node, context) {
  const {
    activeScope,
    bindBlockDeclarations,
    createScope,
    currentClass,
    diagnostics,
    functionNode,
    functionScope,
    inAsyncFunction,
    inGeneratorFunction,
    sourceText,
    walk
  } = context;
  const staticBlockScope = createScope(activeScope, "class-static-block");
  bindBlockDeclarations(node.body.body, staticBlockScope, diagnostics, sourceText);
  for (const statement of node.body.body) {
    walk(statement, staticBlockScope, 0, 0, functionScope, functionNode, inAsyncFunction, inGeneratorFunction, currentClass, null);
  }
}
