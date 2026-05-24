import { createSemanticDiagnostic } from "../diagnostics/semantic-diagnostic.js";
import { getSupportedBuiltinProperty } from "./builtins.js";
import { containsDelegatedYieldExpression, containsYieldExpression, hasSpreadArgumentWithYield } from "./generator-forms.js";

const supportedGeneratorYieldExpressionTypes = new Set([
  "AssignmentExpression",
  "ArrayExpression",
  "BinaryExpression",
  "CallExpression",
  "ConditionalExpression",
  "ObjectExpression"
]);

export function validateGeneratorExpressionYieldShape(node, inGeneratorFunction, diagnostics, sourceText) {
  if (!inGeneratorFunction || !containsYieldExpression(node)) {
    return;
  }
  if (containsDelegatedYieldExpression(node)) {
    diagnostics.push(
      createSemanticDiagnostic(
        sourceText,
        node,
        "Jayess generator expression lowering supports 'yield*' only as a direct yield statement, variable initializer, or return expression"
      )
    );
    return;
  }
  if (!supportedGeneratorYieldExpressionTypes.has(node.type)) {
    diagnostics.push(
      createSemanticDiagnostic(
        sourceText,
        node,
        "Jayess generator lowering currently supports selected expression-yield positions only"
      )
    );
  }
}

export function validateAssignmentExpressionShape(node, inGeneratorFunction, diagnostics, sourceText) {
  if (node.left.type === "MemberExpression" && node.left.object.type === "SuperExpression") {
    diagnostics.push(
      createSemanticDiagnostic(
        sourceText,
        node.left,
        "Jayess does not support assigning to 'super' properties"
      )
    );
  }
  validateGeneratorExpressionYieldShape(node, inGeneratorFunction, diagnostics, sourceText);
  if (!inGeneratorFunction || !containsYieldExpression(node)) {
    return;
  }
  if (node.operator !== "=" || containsYieldExpression(node.left)) {
    diagnostics.push(
      createSemanticDiagnostic(
        sourceText,
        node,
        "Jayess generator expression lowering supports only simple assignments with yield on the right-hand side"
      )
    );
  }
  if (node.left.type !== "Identifier" && node.left.type !== "MemberExpression") {
    diagnostics.push(
      createSemanticDiagnostic(
        sourceText,
        node.left,
        "Jayess generator expression lowering supports identifier and public member assignment targets"
      )
    );
  }
}

export function validateUpdateExpressionShape(node, diagnostics, sourceText) {
  if (node.argument.type === "MemberExpression" && node.argument.object.type === "SuperExpression") {
    diagnostics.push(
      createSemanticDiagnostic(
        sourceText,
        node.argument,
        "Jayess does not support updating 'super' properties"
      )
    );
  }
}

export function validateBinaryExpressionShape(node, inGeneratorFunction, diagnostics, sourceText) {
  validateGeneratorExpressionYieldShape(node, inGeneratorFunction, diagnostics, sourceText);
}

export function validateCallExpressionShape(node, inGeneratorFunction, currentClass, currentMethod, diagnostics, sourceText) {
  validateGeneratorExpressionYieldShape(node, inGeneratorFunction, diagnostics, sourceText);
  if (inGeneratorFunction && containsYieldExpression(node) && node.arguments.some((argument) => argument.type === "SpreadElement")) {
    diagnostics.push(
      createSemanticDiagnostic(
        sourceText,
        node,
        "Jayess generator lowering does not support spread call arguments containing 'yield' or in calls that contain 'yield'"
      )
    );
  } else if (inGeneratorFunction && hasSpreadArgumentWithYield(node.arguments)) {
    diagnostics.push(
      createSemanticDiagnostic(
        sourceText,
        node,
        "Jayess generator lowering does not support spread call arguments containing 'yield'"
      )
    );
  }

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

  if (node.callee.type === "MemberExpression" && node.callee.object.type === "SuperExpression") {
    const validInstanceSuperCall = (
      currentClass?.base != null
      && currentMethod?.kind === "method"
      && currentMethod?.static !== true
    );
    if (validInstanceSuperCall) {
      node.callee.jayessInstanceSuperCall = true;
    }

    const validStaticSuperCall = (
      currentClass?.base != null
      && currentMethod?.kind === "method"
      && currentMethod?.static === true
    );
    if (validStaticSuperCall) {
      node.callee.jayessStaticSuperCall = true;
    }
  }

  if (node.callee.type === "MemberExpression") {
    validateBuiltinCallArguments(node, diagnostics, sourceText);
  }
}

export function validateMemberExpressionShape(node, currentClass, currentMethod, diagnostics, sourceText) {
  if (node.object.type === "SuperExpression") {
    const validComputedInstanceSuperLookup = (
      node.computed
      && currentClass?.base != null
      && currentMethod?.kind === "method"
      && currentMethod?.static !== true
    );
    const validComputedStaticSuperLookup = (
      node.computed
      && currentClass?.base != null
      && currentMethod?.kind === "method"
      && currentMethod?.static === true
    );
    if (node.computed && !validComputedInstanceSuperLookup && !validComputedStaticSuperLookup) {
      diagnostics.push(
        createSemanticDiagnostic(
          sourceText,
          node,
          "Jayess supports computed 'super[expr]' only inside derived instance or static methods"
        )
      );
    }
    const validSuperMemberLookup = node.jayessStaticSuperCall === true
      || (
        currentClass?.base != null
        && currentMethod?.kind === "method"
        && currentMethod?.static === true
      )
      || validComputedInstanceSuperLookup
      || (
        currentClass?.base != null
        && currentMethod?.kind === "method"
        && currentMethod?.static !== true
        && node.computed !== true
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

export function validateUnaryExpressionShape(node, inGeneratorFunction, diagnostics, sourceText) {
  if (node.operator !== "!" && node.operator !== "+" && node.operator !== "-") {
    diagnostics.push(createSemanticDiagnostic(sourceText, node, `Unsupported unary operator '${node.operator}'`));
  }
  validateGeneratorExpressionYieldShape(node, inGeneratorFunction, diagnostics, sourceText);
}

export function validateArrayExpressionShape(node, inGeneratorFunction, diagnostics, sourceText) {
  validateGeneratorExpressionYieldShape(node, inGeneratorFunction, diagnostics, sourceText);
  if (inGeneratorFunction && containsYieldExpression(node) && node.elements.some((element) => element.type === "SpreadElement")) {
    diagnostics.push(
      createSemanticDiagnostic(
        sourceText,
        node,
        "Jayess generator lowering does not support array spread elements containing 'yield' or in arrays that contain 'yield'"
      )
    );
  }
}

export function validateObjectExpressionShape(node, inGeneratorFunction, diagnostics, sourceText) {
  validateGeneratorExpressionYieldShape(node, inGeneratorFunction, diagnostics, sourceText);
  if (inGeneratorFunction && containsYieldExpression(node) && node.properties.some((property) => property.type === "SpreadElement")) {
    diagnostics.push(
      createSemanticDiagnostic(
        sourceText,
        node,
        "Jayess generator lowering does not support object spread properties containing 'yield' or in objects that contain 'yield'"
      )
    );
  }
}

function validateBuiltinCallArguments(node, diagnostics, sourceText) {
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
  if (builtin?.property === "includes" && node.arguments.length !== 1) {
    diagnostics.push(
      createSemanticDiagnostic(
        sourceText,
        node.callee.property,
        `${builtin.receiver} method '${builtin.property}' requires exactly one argument`
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
  if ((builtin?.property === "includes" || builtin?.property === "indexOf" || builtin?.property === "endsWith") && builtin.receiver === "string" && node.arguments.length !== 1) {
    diagnostics.push(
      createSemanticDiagnostic(
        sourceText,
        node.callee.property,
        `${builtin.receiver} method '${builtin.property}' requires exactly one argument`
      )
    );
  }
}
