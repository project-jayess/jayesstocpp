import {
  classFieldDefinition,
  identifier,
  methodDefinition,
  staticInitializationBlock
} from "../ast/nodes.js";
import { tokenTypes } from "../lexer/tokens.js";

export function createClassMemberParser({
  advance,
  expect,
  match,
  parseBlockStatement,
  parseExpression,
  parseFunctionSignatureAndBody,
  parseIdentifier,
  parsePrivateIdentifier,
  parserError,
  sourceText
}) {
  function isClassMemberKeyStart() {
    return match(tokenTypes.identifier)
      || match(tokenTypes.keyword)
      || match(tokenTypes.privateIdentifier)
      || match(tokenTypes.punctuator, "[");
  }

  function parseClassMemberKey() {
    if (match(tokenTypes.punctuator, "[")) {
      const start = expect(tokenTypes.punctuator, "[", "Expected '[' to start computed class member name").start;
      const key = parseExpression();
      const end = expect(tokenTypes.punctuator, "]", "Expected ']' after computed class member name").end;
      return { key, computed: true, start, end };
    }
    if (match(tokenTypes.privateIdentifier)) {
      const key = parsePrivateIdentifier();
      return { key, computed: false, start: key.start, end: key.end };
    }
    if (match(tokenTypes.keyword)) {
      const token = advance();
      const key = identifier(token.value, token.start, token.end);
      return { key, computed: false, start: key.start, end: key.end };
    }
    const key = parseIdentifier();
    return { key, computed: false, start: key.start, end: key.end };
  }

  function parseClassMemberKeyOrGeneratorPrefix() {
    if (!match(tokenTypes.operator, "*")) {
      return { ...parseClassMemberKey(), generator: false };
    }
    const start = advance().start;
    const member = parseClassMemberKey();
    member.start = start;
    member.generator = true;
    return member;
  }

  function parseClassMember() {
    let isStatic = false;
    let isAsync = false;
    let isGenerator = false;
    let member = parseClassMemberKeyOrGeneratorPrefix();
    let { key, computed, start } = member;
    isGenerator = member.generator;
    if (key.name === "static") {
      if (match(tokenTypes.punctuator, "{")) {
        const body = parseBlockStatement();
        return staticInitializationBlock(body, start, body.end);
      }
      if (isClassMemberKeyStart() || match(tokenTypes.operator, "*")) {
        isStatic = true;
        const member = parseClassMemberKeyOrGeneratorPrefix();
        ({ key, computed, start } = member);
        isGenerator = member.generator;
      }
    }
    if (!computed && key.name === "async" && !match(tokenTypes.punctuator, "(") && (isClassMemberKeyStart() || match(tokenTypes.operator, "*"))) {
      isAsync = true;
      const member = parseClassMemberKeyOrGeneratorPrefix();
      ({ key, computed, start } = member);
      isGenerator = member.generator;
    }
    if (match(tokenTypes.punctuator, "(")) {
      if (isAsync && !computed && key.name === "constructor") {
        parserError(sourceText, key, "Jayess does not support async constructors");
      }
      if (isGenerator && !computed && key.name === "constructor") {
        parserError(sourceText, key, "Jayess does not support generator constructors");
      }
      if (isAsync && isGenerator) {
        parserError(sourceText, key, "Jayess does not support async generator methods");
      }
      const { params, body } = parseFunctionSignatureAndBody();
      const kind = !computed && key.name === "constructor" ? "constructor" : "method";
      return methodDefinition(key, params, body, start, body.end, kind, isStatic, computed, isAsync, isGenerator);
    }

    let init = null;
    if (match(tokenTypes.operator, "=")) {
      advance();
      init = parseExpression();
    }
    const end = expect(tokenTypes.punctuator, ";", "Expected ';' after class field").end;
    return classFieldDefinition(key, init, start, end, isStatic, computed);
  }

  return { parseClassMember };
}
