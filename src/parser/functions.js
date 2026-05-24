import { parameter } from "../ast/nodes.js";
import { tokenTypes } from "../lexer/tokens.js";

export function createFunctionParameterParser({
  advance,
  current,
  expect,
  match,
  parseBlockStatement,
  parseBindingTarget,
  parseExpression,
  parseIdentifier,
  parserError,
  sourceText
}) {
  function parseParameter() {
    const id = parseBindingTarget();
    let defaultValue = null;
    if (match(tokenTypes.operator, "=")) {
      advance();
      defaultValue = parseExpression();
    }
    return parameter(id, defaultValue, id.start, defaultValue?.end ?? id.end, false);
  }

  function parseRestParameter() {
    const start = expect(tokenTypes.punctuator, "...", "Expected '...' before rest parameter").start;
    const id = parseBindingTarget();
    if (match(tokenTypes.operator, "=")) {
      parserError(sourceText, current(), "Rest parameters cannot have default values");
    }
    return parameter(id, null, start, id.end, true);
  }

  function parseParameterList(closeMessage) {
    const params = [];
    while (!match(tokenTypes.punctuator, ")")) {
      if (match(tokenTypes.punctuator, "...")) {
        params.push(parseRestParameter());
        if (match(tokenTypes.punctuator, ",")) {
          parserError(sourceText, current(), "Rest parameters must be the last parameter");
        }
        break;
      }
      params.push(parseParameter());
      if (match(tokenTypes.punctuator, ",")) {
        advance();
      } else {
        break;
      }
    }
    expect(tokenTypes.punctuator, ")", closeMessage);
    return params;
  }

  function parseFunctionSignatureAndBody() {
    expect(tokenTypes.punctuator, "(", "Expected '(' after function");
    const params = parseParameterList("Expected ')' after parameters");
    const body = parseBlockStatement();
    return { params, body };
  }

  function parseArrowFunctionParameterList() {
    const params = [];
    const start = expect(tokenTypes.punctuator, "(", "Expected '(' before arrow function parameters").start;

    while (!match(tokenTypes.punctuator, ")")) {
      if (match(tokenTypes.punctuator, "...")) {
        params.push(parseRestParameter());
        if (match(tokenTypes.punctuator, ",")) {
          parserError(sourceText, current(), "Rest parameters must be the last parameter");
        }
        break;
      }
      if (!match(tokenTypes.identifier) && !match(tokenTypes.punctuator, "[") && !match(tokenTypes.punctuator, "{")) {
        parserError(
          sourceText,
          current(),
          "Arrow function parameters must be identifiers or binding patterns with optional defaults, or a final rest parameter"
        );
      }
      params.push(parseParameter());
      if (match(tokenTypes.punctuator, ",")) {
        advance();
      } else {
        break;
      }
    }

    const end = expect(tokenTypes.punctuator, ")", "Expected ')' after arrow function parameters").end;
    return { params, start, end };
  }

  return {
    parseArrowFunctionParameterList,
    parseFunctionSignatureAndBody,
    parseParameter,
    parseRestParameter
  };
}
