import {
  arrayExpression,
  arrowFunctionExpression,
  assignmentExpression,
  awaitExpression,
  binaryExpression,
  callExpression,
  conditionalExpression,
  literal,
  memberExpression,
  newExpression,
  objectExpression,
  objectProperty,
  optionalCallExpression,
  optionalMemberExpression,
  parameter,
  spreadElement,
  superExpression,
  thisExpression,
  unaryExpression,
  updateExpression,
  yieldExpression
} from "../ast/nodes.js";
import { getBinaryOperatorPrecedence, hasBinaryOperatorPrecedence } from "./precedence.js";
import { unsupportedExpressionMessage } from "./unsupported-expression.js";

export function createExpressionParser(deps) {
  const {
    advance,
    expect,
    lookahead,
    match,
    parseArrayBindingPattern,
    parseArrowFunctionParameterList,
    parseAsyncFunctionExpression,
    parseBlockStatement,
    parseFunctionExpression,
    parseIdentifier,
    parseObjectBindingPattern,
    parsePrivateIdentifier,
    parseTemplateLiteralToken,
    parserError,
    sourceText,
    tokenTypes
  } = deps;

  function parseExpression() {
    return parseAssignment();
  }

  function isArrowParameterStart(token) {
    return token.type === tokenTypes.identifier
      || token.type === tokenTypes.punctuator && token.value === "..."
      || token.type === tokenTypes.punctuator && token.value === "["
      || token.type === tokenTypes.punctuator && token.value === "{"
      || token.type === tokenTypes.punctuator && token.value === ")";
  }

  function isArrowFunctionStart() {
    if (match(tokenTypes.identifier) && lookahead().type === tokenTypes.operator && lookahead().value === "=>") {
      return true;
    }

    if (!match(tokenTypes.punctuator, "(")) {
      return false;
    }

    const next = lookahead();
    if (next.type === tokenTypes.punctuator && next.value === ")") {
      return lookahead(2).type === tokenTypes.operator && lookahead(2).value === "=>";
    }

    return isArrowParameterStart(next);
  }

  function isAsyncArrowFunctionStart() {
    if (!match(tokenTypes.keyword, "async")) {
      return false;
    }

    if (lookahead().type === tokenTypes.identifier) {
      return lookahead(2).type === tokenTypes.operator && lookahead(2).value === "=>";
    }

    if (!(lookahead().type === tokenTypes.punctuator && lookahead().value === "(")) {
      return false;
    }

    const next = lookahead(2);
    if (next.type === tokenTypes.punctuator && next.value === ")") {
      return lookahead(3).type === tokenTypes.operator && lookahead(3).value === "=>";
    }

    return isArrowParameterStart(next);
  }

  function parseAssignment() {
    if (match(tokenTypes.punctuator, "[") || match(tokenTypes.punctuator, "{")) {
      const savedIndex = deps.getIndex();
      try {
        const pattern = match(tokenTypes.punctuator, "[")
          ? parseArrayBindingPattern({ allowMemberTargets: true })
          : parseObjectBindingPattern({ allowMemberTargets: true });
        if (match(tokenTypes.operator, "=")) {
          advance();
          const right = parseAssignment();
          return assignmentExpression(pattern, "=", right, pattern.start, right.end);
        }
      } catch {
        // Fall through to ordinary expression parsing if the left-hand side is not a destructuring pattern.
      }
      deps.setIndex(savedIndex);
    }

    if (match(tokenTypes.keyword, "yield")) {
      return parseYieldExpression();
    }
    const left = parseConditionalExpression();
    if (
      match(tokenTypes.operator, "=")
      || match(tokenTypes.operator, "+=")
      || match(tokenTypes.operator, "-=")
      || match(tokenTypes.operator, "*=")
      || match(tokenTypes.operator, "/=")
      || match(tokenTypes.operator, "%=")
      || match(tokenTypes.operator, "**=")
    ) {
      const operator = advance();
      const right = parseAssignment();
      return assignmentExpression(left, operator.value, right, left.start, right.end ?? operator.end);
    }
    return left;
  }

  function parseYieldExpression() {
    const startToken = expect(tokenTypes.keyword, "yield");
    const delegate = match(tokenTypes.operator, "*");
    if (delegate) {
      advance();
    }
    const argument = parseAssignment();
    return yieldExpression(argument, delegate, startToken.start, argument.end);
  }

  function parseConditionalExpression() {
    const test = parseNullishCoalescingExpression();
    if (!match(tokenTypes.punctuator, "?")) {
      return test;
    }

    advance();
    const consequent = parseAssignment();
    expect(tokenTypes.punctuator, ":", "Expected ':' in ternary expression");
    const alternate = parseAssignment();
    return conditionalExpression(test, consequent, alternate, test.start, alternate.end);
  }

  function parseNullishCoalescingExpression() {
    let left = parseBinaryExpression(0);

    while (match(tokenTypes.operator, "??")) {
      advance();
      const right = parseBinaryExpression(0);
      left = binaryExpression("??", left, right, left.start, right.end);
    }

    return left;
  }

  function parseBinaryExpression(minPrecedence) {
    let left = parseUnaryExpression();

    while (match(tokenTypes.operator) && hasBinaryOperatorPrecedence(deps.current().value)) {
      const operator = deps.current().value;
      const operatorPrecedence = getBinaryOperatorPrecedence(operator);
      if (operatorPrecedence < minPrecedence) {
        break;
      }
      advance();
      const nextMinPrecedence = operator === "**" ? operatorPrecedence : operatorPrecedence + 1;
      const right = parseBinaryExpression(nextMinPrecedence);
      left = binaryExpression(operator, left, right, left.start, right.end);
    }

    return left;
  }

  function parseUnaryExpression() {
    if (match(tokenTypes.keyword, "await")) {
      const awaitToken = advance();
      const argument = parseUnaryExpression();
      return awaitExpression(argument, awaitToken.start, argument.end);
    }

    if (match(tokenTypes.operator, "++") || match(tokenTypes.operator, "--")) {
      const operator = advance();
      const argument = parseUnaryExpression();
      return updateExpression(operator.value, argument, true, operator.start, argument.end);
    }

    if (match(tokenTypes.operator, "!") || match(tokenTypes.operator, "-") || match(tokenTypes.operator, "+")) {
      const operator = advance();
      const argument = parseUnaryExpression();
      return unaryExpression(operator.value, argument, operator.start, argument.end);
    }

    return parseCallExpression();
  }

  function parseCallExpression() {
    let expression = parsePrimaryExpression();

    while (true) {
      if (match(tokenTypes.template)) {
        parserError(sourceText, deps.current(), "Jayess syntax does not support tagged template literals");
      }

      if (match(tokenTypes.punctuator, ".")) {
        advance();
        const property = parseMemberProperty();
        expression = memberExpression(expression, property, expression.start, property.end, false);
        continue;
      }

      if (match(tokenTypes.punctuator, "?.")) {
        advance();

        if (match(tokenTypes.identifier)) {
          const property = parseIdentifier();
          expression = optionalMemberExpression(expression, property, expression.start, property.end, false);
          continue;
        }

        if (match(tokenTypes.punctuator, "[")) {
          advance();
          const property = parseExpression();
          const end = expect(tokenTypes.punctuator, "]", "Expected ']' after optional computed member access").end;
          expression = optionalMemberExpression(expression, property, expression.start, end, true);
          continue;
        }

        if (match(tokenTypes.punctuator, "(")) {
          advance();
          const args = parseArgumentList();
          const end = expect(tokenTypes.punctuator, ")", "Expected ')' after optional call arguments").end;
          expression = optionalCallExpression(expression, args, expression.start, end);
          continue;
        }

        parserError(sourceText, deps.current(), "Optional chaining must be followed by a property, index expression, or call");
      }

      if (match(tokenTypes.punctuator, "[")) {
        advance();
        const property = parseExpression();
        const end = expect(tokenTypes.punctuator, "]", "Expected ']' after computed member access").end;
        expression = memberExpression(expression, property, expression.start, end, true);
        continue;
      }

      if (match(tokenTypes.punctuator, "(")) {
        advance();
        const args = parseArgumentList();
        const end = expect(tokenTypes.punctuator, ")", "Expected ')' after arguments").end;
        expression = callExpression(expression, args, expression.start, end);
        continue;
      }

      if (match(tokenTypes.operator, "++") || match(tokenTypes.operator, "--")) {
        const operator = advance();
        expression = updateExpression(operator.value, expression, false, expression.start, operator.end);
        continue;
      }

      break;
    }

    return expression;
  }

  function parsePrimaryExpression() {
    if (isAsyncArrowFunctionStart()) {
      if (lookahead().type === tokenTypes.identifier) {
        return parseAsyncArrowFunctionWithIdentifier();
      }
      return parseAsyncArrowFunctionWithParentheses();
    }

    if (isArrowFunctionStart()) {
      if (match(tokenTypes.identifier)) {
        return parseArrowFunctionWithIdentifier();
      }

      const arrow = parseArrowFunctionWithParentheses();
      if (arrow != null) {
        return arrow;
      }
    }

    if (match(tokenTypes.identifier)) {
      return parseIdentifier();
    }
    if (match(tokenTypes.keyword, "this")) {
      const token = advance();
      return thisExpression(token.start, token.end);
    }
    if (match(tokenTypes.keyword, "super")) {
      const token = advance();
      return superExpression(token.start, token.end);
    }
    if (match(tokenTypes.keyword, "new")) {
      return parseNewExpression();
    }
    if (match(tokenTypes.keyword, "async")) {
      if (lookahead().type === tokenTypes.keyword && lookahead().value === "function") {
        return parseAsyncFunctionExpression();
      }
      parserError(
        sourceText,
        deps.current(),
        "Jayess does not support this async form yet; the next async slice is limited to async function expressions and async arrow functions"
      );
    }
    if (match(tokenTypes.keyword, "yield")) {
      return parseYieldExpression();
    }
    if (match(tokenTypes.keyword, "function")) {
      return parseFunctionExpression();
    }
    if (match(tokenTypes.keyword, "import")) {
      parserError(
        sourceText,
        deps.current(),
        "Jayess does not support dynamic import(); it is unsupported by design because Jayess keeps module resolution closed at compile time"
      );
    }
    if (match(tokenTypes.keyword, "null")) {
      const token = advance();
      return literal("null", null, token.start, token.end);
    }
    if (match(tokenTypes.keyword, "true") || match(tokenTypes.keyword, "false")) {
      const token = advance();
      return literal("boolean", token.value === "true", token.start, token.end);
    }
    if (match(tokenTypes.number)) {
      const token = advance();
      return literal("number", Number(token.value), token.start, token.end);
    }
    if (match(tokenTypes.string)) {
      const token = advance();
      return literal("string", token.value, token.start, token.end);
    }
    if (match(tokenTypes.template)) {
      return parseTemplateLiteralToken(advance());
    }
    if (match(tokenTypes.punctuator, "(")) {
      return parseParenthesizedExpression();
    }
    if (match(tokenTypes.punctuator, "[")) {
      return parseArrayExpression();
    }
    if (match(tokenTypes.punctuator, "{")) {
      return parseObjectExpression();
    }
    parserError(sourceText, deps.current(), unsupportedExpressionMessage(deps.current()));
  }

  function parseParenthesizedExpression() {
    advance();
    const expression = parseExpression();
    expect(tokenTypes.punctuator, ")", "Expected ')'");
    if (match(tokenTypes.operator, "=>")) {
      parserError(
        sourceText,
        deps.current(),
        "Arrow function parameters must be identifiers with optional defaults; parenthesized expressions are not valid parameter lists"
      );
    }
    return expression;
  }

  function parseArrowFunctionBody() {
    if (match(tokenTypes.punctuator, "{")) {
      const body = parseBlockStatement();
      return { body, expressionBody: false, end: body.end };
    }

    const body = parseAssignment();
    return { body, expressionBody: true, end: body.end };
  }

  function parseArrowFunctionWithParentheses() {
    const savedIndex = deps.getIndex();
    let parameterList = null;

    try {
      parameterList = parseArrowFunctionParameterList();
    } catch {
      deps.setIndex(savedIndex);
      return null;
    }

    if (!match(tokenTypes.operator, "=>")) {
      deps.setIndex(savedIndex);
      return null;
    }

    advance();
    const { body, expressionBody, end } = parseArrowFunctionBody();
    return arrowFunctionExpression(parameterList.params, body, expressionBody, parameterList.start, end, []);
  }

  function parseAsyncArrowFunctionWithParentheses() {
    const start = expect(tokenTypes.keyword, "async").start;
    const parameterList = parseArrowFunctionParameterList();
    expect(tokenTypes.operator, "=>", "Expected '=>' after arrow function parameters");
    const { body, expressionBody, end } = parseArrowFunctionBody();
    return arrowFunctionExpression(parameterList.params, body, expressionBody, start, end, [], true);
  }

  function parseArrowFunctionWithIdentifier() {
    const id = parseIdentifier();
    const param = parameter(id, null, id.start, id.end);
    expect(tokenTypes.operator, "=>", "Expected '=>' after arrow function parameter");
    const { body, expressionBody, end } = parseArrowFunctionBody();
    return arrowFunctionExpression([param], body, expressionBody, id.start, end, []);
  }

  function parseAsyncArrowFunctionWithIdentifier() {
    const start = expect(tokenTypes.keyword, "async").start;
    const id = parseIdentifier();
    const param = parameter(id, null, id.start, id.end);
    expect(tokenTypes.operator, "=>", "Expected '=>' after arrow function parameter");
    const { body, expressionBody, end } = parseArrowFunctionBody();
    return arrowFunctionExpression([param], body, expressionBody, start, end, [], true);
  }

  function parseArrayExpression() {
    const start = expect(tokenTypes.punctuator, "[", "Expected '['").start;
    const elements = [];
    while (!match(tokenTypes.punctuator, "]")) {
      if (match(tokenTypes.punctuator, "...")) {
        const spreadToken = advance();
        const argument = parseAssignment();
        elements.push(spreadElement(argument, spreadToken.start, argument.end));
      } else {
        elements.push(parseExpression());
      }
      if (match(tokenTypes.punctuator, ",")) {
        advance();
      } else {
        break;
      }
    }
    const end = expect(tokenTypes.punctuator, "]", "Expected ']' after array literal").end;
    return arrayExpression(elements, start, end);
  }

  function parseObjectExpression() {
    const start = expect(tokenTypes.punctuator, "{", "Expected '{'").start;
    const properties = [];
    while (!match(tokenTypes.punctuator, "}")) {
      if (match(tokenTypes.punctuator, "...")) {
        const spreadToken = advance();
        const argument = parseAssignment();
        properties.push(spreadElement(argument, spreadToken.start, argument.end));
      } else {
        const key = parseObjectKey();
        expect(tokenTypes.punctuator, ":", "Expected ':' after object key");
        const value = parseExpression();
        properties.push(objectProperty(key, value, key.start, value.end));
      }
      if (match(tokenTypes.punctuator, ",")) {
        advance();
      } else {
        break;
      }
    }
    const end = expect(tokenTypes.punctuator, "}", "Expected '}' after object literal").end;
    return objectExpression(properties, start, end);
  }

  function parseObjectKey() {
    if (match(tokenTypes.identifier)) {
      return parseIdentifier();
    }
    if (match(tokenTypes.string)) {
      const token = advance();
      return literal("string", token.value, token.start, token.end);
    }
    parserError(sourceText, deps.current(), "Expected object property key");
  }

  function parseNewExpression() {
    const start = expect(tokenTypes.keyword, "new").start;
    const callee = parsePrimaryExpression();
    expect(tokenTypes.punctuator, "(", "Expected '(' after constructor target");
    const args = parseArgumentList();
    const end = expect(tokenTypes.punctuator, ")", "Expected ')' after constructor arguments").end;
    return newExpression(callee, args, start, end);
  }

  function parseArgumentList() {
    const args = [];
    while (!match(tokenTypes.punctuator, ")")) {
      if (match(tokenTypes.punctuator, "...")) {
        const spreadToken = advance();
        const argument = parseAssignment();
        args.push(spreadElement(argument, spreadToken.start, argument.end));
      } else {
        args.push(parseExpression());
      }
      if (match(tokenTypes.punctuator, ",")) {
        advance();
      } else {
        break;
      }
    }
    return args;
  }

  function parseMemberProperty() {
    if (match(tokenTypes.privateIdentifier)) {
      return parsePrivateIdentifier();
    }
    return parseIdentifier();
  }

  return {
    parseAssignment,
    parseCallExpression,
    parseExpression
  };
}
