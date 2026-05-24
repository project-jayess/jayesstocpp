import {
  arrayPattern,
  assignmentPattern,
  bindingProperty,
  literal,
  memberExpression,
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
  function parseMemberTargetSuffix(target) {
    let currentTarget = target;
    while (true) {
      if (match(tokenTypes.punctuator, ".")) {
        advance();
        const property = parseIdentifier();
        currentTarget = memberExpression(currentTarget, property, currentTarget.start, property.end, false);
        continue;
      }
      if (match(tokenTypes.punctuator, "[")) {
        advance();
        const property = parseAssignment();
        const end = expect(tokenTypes.punctuator, "]", "Expected ']' after computed destructuring assignment target").end;
        currentTarget = memberExpression(currentTarget, property, currentTarget.start, end, true);
        continue;
      }
      return currentTarget;
    }
  }

  function parseBindingTarget(options = {}) {
    if (match(tokenTypes.identifier)) {
      const identifier = parseIdentifier();
      return options.allowMemberTargets ? parseMemberTargetSuffix(identifier) : identifier;
    }
    if (match(tokenTypes.punctuator, "[")) {
      return parseArrayBindingPattern(options);
    }
    if (match(tokenTypes.punctuator, "{")) {
      return parseObjectBindingPattern(options);
    }
    parserError(sourceText, currentToken(), "Expected binding target");
  }

  function currentToken() {
    return current();
  }

  function parseBindingTargetWithDefault(options = {}) {
    const target = parseBindingTarget(options);
    if (!match(tokenTypes.operator, "=")) {
      return target;
    }
    advance();
    const defaultValue = parseAssignment();
    return assignmentPattern(target, defaultValue, target.start, defaultValue.end);
  }

  function parseArrayBindingPattern(options = {}) {
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
        const comma = advance();
        elements.push(null);
        if (match(tokenTypes.punctuator, "]")) {
          parserError(sourceText, comma, "Trailing array destructuring elisions require another binding element");
        }
        continue;
      }
      elements.push(parseBindingTargetWithDefault(options));
      if (match(tokenTypes.punctuator, ",")) {
        advance();
      } else {
        break;
      }
    }

    const end = expect(tokenTypes.punctuator, "]", "Expected ']' after array binding pattern").end;
    return arrayPattern(elements, start, end);
  }

  function parseObjectBindingPattern(options = {}) {
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
          value = parseBindingTargetWithDefault(options);
        } else if (match(tokenTypes.operator, "=")) {
          advance();
          const defaultValue = parseAssignment();
          value = assignmentPattern(value, defaultValue, value.start, defaultValue.end);
        }
      } else if (match(tokenTypes.string)) {
        const token = advance();
        key = literal("string", token.value, token.start, token.end);
        expect(tokenTypes.punctuator, ":", "String-key object destructuring entries require a local binding");
        value = parseBindingTargetWithDefault(options);
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
