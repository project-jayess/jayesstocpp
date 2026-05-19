import {
  arrayPattern,
  assignmentPattern,
  bindingProperty,
  literal,
  objectPattern,
  restElement
} from "../ast/nodes.js";
import { tokenTypes } from "../lexer/tokens.js";

export function createBindingPatternParser({
  advance,
  current,
  expect,
  match,
  parseAssignment,
  parseIdentifier,
  parserError,
  sourceText
}) {
  function parseBindingTarget() {
    if (match(tokenTypes.identifier)) {
      return parseIdentifier();
    }
    if (match(tokenTypes.punctuator, "[")) {
      return parseArrayBindingPattern();
    }
    if (match(tokenTypes.punctuator, "{")) {
      return parseObjectBindingPattern();
    }
    parserError(sourceText, currentToken(), "Expected binding target");
  }

  function currentToken() {
    return current();
  }

  function parseBindingTargetWithDefault() {
    const target = parseBindingTarget();
    if (!match(tokenTypes.operator, "=")) {
      return target;
    }
    advance();
    const defaultValue = parseAssignment();
    return assignmentPattern(target, defaultValue, target.start, defaultValue.end);
  }

  function parseArrayBindingPattern() {
    const start = expect(tokenTypes.punctuator, "[", "Expected '[' to start array binding pattern").start;
    const elements = [];

    while (!match(tokenTypes.punctuator, "]")) {
      if (match(tokenTypes.punctuator, "...")) {
        const restStart = advance().start;
        if (match(tokenTypes.punctuator, "[") || match(tokenTypes.punctuator, "{")) {
          parserError(sourceText, currentToken(), "Rest bindings in destructuring must bind to a single identifier");
        }
        const argument = parseIdentifier();
        elements.push(restElement(argument, restStart, argument.end));
        if (match(tokenTypes.punctuator, ",")) {
          parserError(sourceText, currentToken(), "Rest bindings must be the last element in an array destructuring pattern");
        }
        break;
      }
      if (match(tokenTypes.punctuator, ",")) {
        parserError(sourceText, currentToken(), "Array destructuring elisions are not supported");
      }
      elements.push(parseBindingTargetWithDefault());
      if (match(tokenTypes.punctuator, ",")) {
        advance();
      } else {
        break;
      }
    }

    const end = expect(tokenTypes.punctuator, "]", "Expected ']' after array binding pattern").end;
    return arrayPattern(elements, start, end);
  }

  function parseObjectBindingPattern() {
    const start = expect(tokenTypes.punctuator, "{", "Expected '{' to start object binding pattern").start;
    const properties = [];

    while (!match(tokenTypes.punctuator, "}")) {
      if (match(tokenTypes.punctuator, "...")) {
        const restStart = advance().start;
        if (match(tokenTypes.punctuator, "[") || match(tokenTypes.punctuator, "{")) {
          parserError(sourceText, currentToken(), "Rest bindings in destructuring must bind to a single identifier");
        }
        const argument = parseIdentifier();
        properties.push(restElement(argument, restStart, argument.end));
        if (match(tokenTypes.punctuator, ",")) {
          parserError(sourceText, currentToken(), "Rest bindings must be the last property in an object destructuring pattern");
        }
        break;
      }
      let key = null;
      let value = null;

      if (match(tokenTypes.identifier)) {
        key = parseIdentifier();
        value = key;
        if (match(tokenTypes.punctuator, ":")) {
          advance();
          value = parseBindingTargetWithDefault();
        } else if (match(tokenTypes.operator, "=")) {
          advance();
          const defaultValue = parseAssignment();
          value = assignmentPattern(value, defaultValue, value.start, defaultValue.end);
        }
      } else if (match(tokenTypes.string)) {
        const token = advance();
        key = literal("string", token.value, token.start, token.end);
        expect(tokenTypes.punctuator, ":", "String-key object destructuring entries require a local binding");
        value = parseBindingTargetWithDefault();
      } else {
        parserError(sourceText, currentToken(), "Expected object binding property");
      }

      properties.push(bindingProperty(key, value, key.start, value.end));
      if (match(tokenTypes.punctuator, ",")) {
        advance();
      } else {
        break;
      }
    }

    const end = expect(tokenTypes.punctuator, "}", "Expected '}' after object binding pattern").end;
    return objectPattern(properties, start, end);
  }

  return {
    parseArrayBindingPattern,
    parseBindingTarget,
    parseBindingTargetWithDefault,
    parseObjectBindingPattern
  };
}
