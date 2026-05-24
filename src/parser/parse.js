import {
  classDeclaration,
  functionDeclaration,
  functionExpression,
  identifier,
  privateIdentifier,
  program,
  templateLiteral
} from "../ast/nodes.js";
import { throwDiagnostics } from "../diagnostics.js";
import { createSyntaxDiagnostic } from "../diagnostics/syntax-diagnostic.js";
import { lex } from "../lexer/lex.js";
import { tokenTypes } from "../lexer/tokens.js";
import { createSourceText } from "../source/source-text.js";
import { createBindingPatternParser } from "./binding-patterns.js";
import { createClassMemberParser } from "./classes.js";
import { createExpressionParser } from "./expressions.js";
import { createFunctionParameterParser } from "./functions.js";
import { createImportExportParser } from "./import-export.js";
import { createStatementParser } from "./statements.js";

function parserError(sourceText, token, message) {
  throwDiagnostics([createSyntaxDiagnostic(sourceText, token.start, message)]);
}

export function parse(sourceText) {
  const tokens = lex(sourceText);
  let index = 0;
  let expressionParser = null;
  let statementParser = null;

  function current() {
    return tokens[index];
  }

  function advance() {
    const token = current();
    index += 1;
    return token;
  }

  function lookahead(offset = 1) {
    return tokens[index + offset] ?? tokens[tokens.length - 1];
  }

  function getIndex() {
    return index;
  }

  function setIndex(nextIndex) {
    index = nextIndex;
  }

  function match(type, value = null) {
    const token = current();
    return token.type === type && (value == null || token.value === value);
  }

  function expect(type, value = null, message = "Unexpected token") {
    if (!match(type, value)) {
      parserError(sourceText, current(), message);
    }
    return advance();
  }

  const {
    parseArrayBindingPattern,
    parseBindingTarget,
    parseBindingTargetWithDefault,
    parseObjectBindingPattern
  } = createBindingPatternParser({
    advance,
    current,
    expect,
    match,
    parseAssignment,
    parseIdentifier,
    parserError,
    sourceText
  });

  const {
    parseExportDeclaration,
    parseImportDeclaration
  } = createImportExportParser({
    advance,
    current,
    expect,
    isAsyncFunctionDeclarationStart,
    lookahead,
    match,
    parseAnonymousClassDeclaration,
    parseAsyncFunctionDeclaration,
    parseClassDeclaration,
    parseExpression,
    parseFunctionDeclaration,
    parseFunctionExpression,
    parseIdentifier,
    parseVariableDeclaration,
    parserError,
    sourceText
  });

  const {
    parseArrowFunctionParameterList,
    parseFunctionSignatureAndBody,
    parseRestParameter
  } = createFunctionParameterParser({
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
  });

  const { parseClassMember } = createClassMemberParser({
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
  });

  expressionParser = createExpressionParser({
    advance,
    current,
    expect,
    getIndex,
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
    setIndex,
    sourceText,
    tokenTypes
  });

  statementParser = createStatementParser({
    advance,
    current,
    expect,
    isAsyncFunctionDeclarationStart,
    match,
    parseAsyncFunctionDeclaration,
    parseBindingTarget,
    parseClassDeclaration,
    parseExportDeclaration,
    parseExpression,
    parseFunctionDeclaration,
    parseIdentifier,
    parseImportDeclaration,
    parserError,
    sourceText,
    tokenTypes
  });

  function parseProgram() {
    const body = [];
    while (!match(tokenTypes.eof)) {
      body.push(parseStatement());
    }
    return program(body, 0, current().end);
  }

  function isAsyncFunctionDeclarationStart() {
    return match(tokenTypes.keyword, "async")
      && lookahead().type === tokenTypes.keyword
      && lookahead().value === "function";
  }

  function parseStatement() {
    return statementParser.parseStatement();
  }

  function parseFunctionDeclaration(exported) {
    const start = expect(tokenTypes.keyword, "function").start;
    return parseFunctionDeclarationAfterKeyword(start, exported, false);
  }

  function parseAsyncFunctionDeclaration(exported) {
    const start = expect(tokenTypes.keyword, "async").start;
    expect(tokenTypes.keyword, "function", "Expected 'function' after 'async'");
    return parseFunctionDeclarationAfterKeyword(start, exported, true);
  }

  function parseFunctionDeclarationAfterKeyword(start, exported, isAsync) {
    const isGenerator = match(tokenTypes.operator, "*");
    if (isGenerator) {
      advance();
    }
    const id = parseIdentifier();
    const { params, body } = parseFunctionSignatureAndBody();
    return functionDeclaration(id, params, body, start, body.end, exported, isAsync, isGenerator);
  }

  function parseFunctionExpression() {
    const start = expect(tokenTypes.keyword, "function").start;
    return parseFunctionExpressionAfterKeyword(start, false);
  }

  function parseAsyncFunctionExpression() {
    const start = expect(tokenTypes.keyword, "async").start;
    expect(tokenTypes.keyword, "function", "Expected 'function' after 'async'");
    return parseFunctionExpressionAfterKeyword(start, true);
  }

  function parseFunctionExpressionAfterKeyword(start, isAsync) {
    const isGenerator = match(tokenTypes.operator, "*");
    if (isGenerator) {
      advance();
    }
    const id = match(tokenTypes.identifier) ? parseIdentifier() : null;
    const { params, body } = parseFunctionSignatureAndBody();
    return functionExpression(params, body, start, body.end, [], id, isAsync, isGenerator);
  }

  function parseClassDeclaration(exported) {
    const start = expect(tokenTypes.keyword, "class").start;
    const id = parseIdentifier();
    return parseClassBody(start, id, exported);
  }

  function parseAnonymousClassDeclaration(exported) {
    const start = expect(tokenTypes.keyword, "class").start;
    return parseClassBody(start, null, exported);
  }

  function parseClassBody(start, id, exported) {
    let base = null;
    if (match(tokenTypes.keyword, "extends")) {
      advance();
      base = parseCallExpression();
    }
    expect(tokenTypes.punctuator, "{", "Expected '{' after class name");
    const methods = [];
    while (!match(tokenTypes.punctuator, "}")) {
      methods.push(parseClassMember());
    }
    const end = expect(tokenTypes.punctuator, "}", "Expected '}' after class body").end;
    return classDeclaration(id, base, methods, start, end, exported);
  }

  function parseVariableDeclaration(exported) {
    return statementParser.parseVariableDeclaration(exported);
  }

  function parseVariableDeclarationWithSemicolon(exported, requireSemicolon) {
    return statementParser.parseVariableDeclarationWithSemicolon(exported, requireSemicolon);
  }

  function parseBlockStatement() {
    return statementParser.parseBlockStatement();
  }

  function parseExpression() {
    return expressionParser.parseExpression();
  }

  function parseAssignment() {
    return expressionParser.parseAssignment();
  }

  function parseCallExpression() {
    return expressionParser.parseCallExpression();
  }

  function parseTemplateExpression(expressionSource, absoluteOffset) {
    const prefix = sourceText.text.slice(0, absoluteOffset).replace(/[^\n]/g, " ");
    const expressionSourceText = createSourceText(`${prefix}${expressionSource};`, sourceText.filename);
    const expressionProgram = parse(expressionSourceText);

    if (expressionProgram.body.length !== 1 || expressionProgram.body[0].type !== "ExpressionStatement") {
      parserError(sourceText, current(), "Template interpolation must contain a single expression");
    }

    return expressionProgram.body[0].expression;
  }

  function parseTemplateLiteralToken(token) {
    let cursor = token.start + 1;
    const expressions = token.value.expressions.map((expressionSource, index) => {
      cursor += token.value.segments[index].length;
      cursor += 2;
      const interpolationStart = cursor;
      cursor += expressionSource.length;
      cursor += 1;
      return parseTemplateExpression(expressionSource, interpolationStart);
    });

    return templateLiteral(token.value.segments, expressions, token.start, token.end);
  }

  function parseIdentifier() {
    const token = expect(tokenTypes.identifier, null, "Expected identifier");
    return identifier(token.value, token.start, token.end);
  }

  function parsePrivateIdentifier() {
    const token = expect(tokenTypes.privateIdentifier, null, "Expected private identifier");
    return privateIdentifier(token.value, token.start, token.end);
  }

  return parseProgram();
}
