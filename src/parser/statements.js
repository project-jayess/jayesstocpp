import {
  breakStatement,
  blockStatement,
  catchClause,
  continueStatement,
  doWhileStatement,
  expressionStatement,
  forStatement,
  ifStatement,
  literal,
  returnStatement,
  switchCase,
  switchStatement,
  throwStatement,
  tryStatement,
  variableDeclaration,
  variableDeclarator,
  whileStatement
} from "../ast/nodes.js";
import { getUnsupportedStatementMessage } from "./unsupported-syntax.js";

export function createStatementParser(deps) {
  const {
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
  } = deps;

  function parseStatement() {
    if (match(tokenTypes.keyword, "import")) {
      return parseImportDeclaration();
    }
    if (match(tokenTypes.keyword, "export")) {
      return parseExportDeclaration();
    }
    if (match(tokenTypes.keyword, "class")) {
      return parseClassDeclaration(false);
    }
    if (isAsyncFunctionDeclarationStart()) {
      return parseAsyncFunctionDeclaration(false);
    }
    if (match(tokenTypes.keyword, "function")) {
      return parseFunctionDeclaration(false);
    }
    if (match(tokenTypes.keyword, "let")) {
      parserError(sourceText, current(), "Jayess does not support 'let'; it is unsupported by design in Jayess, so use 'var' or 'const'");
    }
    const unsupportedStatementMessage = match(tokenTypes.keyword) ? getUnsupportedStatementMessage(current().value) : null;
    if (unsupportedStatementMessage != null) {
      parserError(sourceText, current(), unsupportedStatementMessage);
    }
    if (match(tokenTypes.keyword, "const") || match(tokenTypes.keyword, "var")) {
      return parseVariableDeclaration(false);
    }
    if (match(tokenTypes.keyword, "return")) {
      return parseReturnStatement();
    }
    if (match(tokenTypes.keyword, "if")) {
      return parseIfStatement();
    }
    if (match(tokenTypes.keyword, "while")) {
      return parseWhileStatement();
    }
    if (match(tokenTypes.keyword, "do")) {
      return parseDoWhileStatement();
    }
    if (match(tokenTypes.keyword, "for")) {
      return parseForStatement();
    }
    if (match(tokenTypes.keyword, "switch")) {
      return parseSwitchStatement();
    }
    if (match(tokenTypes.keyword, "try")) {
      return parseTryStatement();
    }
    if (match(tokenTypes.keyword, "throw")) {
      return parseThrowStatement();
    }
    if (match(tokenTypes.keyword, "break")) {
      return parseBreakStatement();
    }
    if (match(tokenTypes.keyword, "continue")) {
      return parseContinueStatement();
    }
    if (match(tokenTypes.punctuator, "{")) {
      return parseBlockStatement();
    }
    return parseExpressionStatement();
  }

  function parseVariableDeclaration(exported) {
    return parseVariableDeclarationWithSemicolon(exported, true);
  }

  function parseVariableDeclarationWithSemicolon(exported, requireSemicolon) {
    const kindToken = advance();
    const id = parseBindingTarget();
    let init = null;
    if (match(tokenTypes.operator, "=")) {
      advance();
      init = parseExpression();
    }
    if ((id.type === "ArrayPattern" || id.type === "ObjectPattern") && init == null) {
      parserError(sourceText, current(), "Destructuring declarations require an initializer");
    }
    if (kindToken.value === "const" && init == null) {
      parserError(sourceText, current(), "const declarations require an initializer");
    }
    const end = requireSemicolon
      ? expect(tokenTypes.punctuator, ";", "Expected ';' after variable declaration").end
      : (init?.end ?? id.end);
    const declarator = variableDeclarator(id, init, id.start, init?.end ?? id.end);
    return variableDeclaration(kindToken.value, [declarator], kindToken.start, end, exported);
  }

  function parseReturnStatement() {
    const start = expect(tokenTypes.keyword, "return").start;
    const argument = parseExpression();
    const end = expect(tokenTypes.punctuator, ";", "Expected ';' after return").end;
    return returnStatement(argument, start, end);
  }

  function parseThrowStatement() {
    const start = expect(tokenTypes.keyword, "throw").start;
    if (match(tokenTypes.punctuator, ";")) {
      parserError(sourceText, current(), "Throw statements require an expression");
    }
    const argument = parseExpression();
    const end = expect(tokenTypes.punctuator, ";", "Expected ';' after throw").end;
    return throwStatement(argument, start, end);
  }

  function parseIfStatement() {
    const start = expect(tokenTypes.keyword, "if").start;
    expect(tokenTypes.punctuator, "(", "Expected '(' after if");
    const test = parseExpression();
    expect(tokenTypes.punctuator, ")", "Expected ')' after if test");
    const consequent = parseBlockStatement();
    let alternate = null;
    if (match(tokenTypes.keyword, "else")) {
      advance();
      alternate = match(tokenTypes.punctuator, "{") ? parseBlockStatement() : parseStatement();
    }
    return ifStatement(test, consequent, alternate, start, alternate?.end ?? consequent.end);
  }

  function parseWhileStatement() {
    const start = expect(tokenTypes.keyword, "while").start;
    expect(tokenTypes.punctuator, "(", "Expected '(' after while");
    const test = parseExpression();
    expect(tokenTypes.punctuator, ")", "Expected ')' after while test");
    const body = parseStatement();
    return whileStatement(test, body, start, body.end);
  }

  function parseDoWhileStatement() {
    const start = expect(tokenTypes.keyword, "do").start;
    const body = parseStatement();
    expect(tokenTypes.keyword, "while", "Malformed do-while statement: expected 'while' after the body");
    expect(tokenTypes.punctuator, "(", "Expected '(' after while");
    const test = parseExpression();
    expect(tokenTypes.punctuator, ")", "Expected ')' after do-while test");
    const end = expect(tokenTypes.punctuator, ";", "Expected ';' after do-while").end;
    return doWhileStatement(body, test, start, end);
  }

  function parseForStatement() {
    const start = expect(tokenTypes.keyword, "for").start;
    expect(tokenTypes.punctuator, "(", "Expected '(' after for");

    let init = null;
    if (!match(tokenTypes.punctuator, ";")) {
      if (match(tokenTypes.keyword, "const") || match(tokenTypes.keyword, "var")) {
        init = parseVariableDeclarationWithSemicolon(false, false);
      } else {
        init = parseExpression();
      }
    }
    expect(tokenTypes.punctuator, ";", "Expected ';' after for initializer");

    let test = null;
    if (!match(tokenTypes.punctuator, ";")) {
      test = parseExpression();
    }
    expect(tokenTypes.punctuator, ";", "Expected ';' after for test");

    let update = null;
    if (!match(tokenTypes.punctuator, ")")) {
      update = parseExpression();
    }
    expect(tokenTypes.punctuator, ")", "Expected ')' after for clauses");

    const body = parseStatement();
    return forStatement(init, test, update, body, start, body.end);
  }

  function parseBreakStatement() {
    const start = expect(tokenTypes.keyword, "break").start;
    const end = expect(tokenTypes.punctuator, ";", "Expected ';' after break").end;
    return breakStatement(start, end);
  }

  function parseContinueStatement() {
    const start = expect(tokenTypes.keyword, "continue").start;
    const end = expect(tokenTypes.punctuator, ";", "Expected ';' after continue").end;
    return continueStatement(start, end);
  }

  function parseSwitchStatement() {
    const start = expect(tokenTypes.keyword, "switch").start;
    expect(tokenTypes.punctuator, "(", "Expected '(' after switch");
    const discriminant = parseExpression();
    expect(tokenTypes.punctuator, ")", "Expected ')' after switch discriminant");
    expect(tokenTypes.punctuator, "{", "Expected '{' after switch discriminant");

    const cases = [];
    let hasDefault = false;

    while (!match(tokenTypes.punctuator, "}")) {
      if (match(tokenTypes.keyword, "case")) {
        cases.push(parseSwitchCaseClause());
        continue;
      }
      if (match(tokenTypes.keyword, "default")) {
        if (hasDefault) {
          parserError(sourceText, current(), "Switch statements may only contain one default clause");
        }
        hasDefault = true;
        cases.push(parseSwitchDefaultClause());
        continue;
      }
      parserError(sourceText, current(), "Malformed switch statement: expected 'case', 'default', or '}'");
    }

    const end = expect(tokenTypes.punctuator, "}", "Expected '}' after switch statement").end;
    return switchStatement(discriminant, cases, start, end);
  }

  function parseSwitchCaseTest() {
    if (match(tokenTypes.number)) {
      const token = advance();
      return literal("number", Number(token.value), token.start, token.end);
    }
    if (match(tokenTypes.string)) {
      const token = advance();
      return literal("string", token.value, token.start, token.end);
    }
    if (match(tokenTypes.keyword, "true") || match(tokenTypes.keyword, "false")) {
      const token = advance();
      return literal("boolean", token.value === "true", token.start, token.end);
    }
    if (match(tokenTypes.keyword, "null")) {
      const token = advance();
      return literal("null", null, token.start, token.end);
    }
    parserError(sourceText, current(), "Switch case labels in this slice must be literal values");
  }

  function parseSwitchCaseClause() {
    const start = expect(tokenTypes.keyword, "case").start;
    const test = parseSwitchCaseTest();
    expect(tokenTypes.punctuator, ":", "Expected ':' after switch case label");
    const consequent = [];
    while (!match(tokenTypes.punctuator, "}") && !match(tokenTypes.keyword, "case") && !match(tokenTypes.keyword, "default")) {
      consequent.push(parseStatement());
    }
    const end = consequent.at(-1)?.end ?? test.end;
    return switchCase(test, consequent, start, end);
  }

  function parseSwitchDefaultClause() {
    const start = expect(tokenTypes.keyword, "default").start;
    expect(tokenTypes.punctuator, ":", "Expected ':' after default");
    const consequent = [];
    while (!match(tokenTypes.punctuator, "}") && !match(tokenTypes.keyword, "case") && !match(tokenTypes.keyword, "default")) {
      consequent.push(parseStatement());
    }
    const end = consequent.at(-1)?.end ?? current().start;
    return switchCase(null, consequent, start, end);
  }

  function parseTryStatement() {
    const start = expect(tokenTypes.keyword, "try").start;
    const block = parseBlockStatement();
    let handler = null;
    let finalizer = null;

    if (match(tokenTypes.keyword, "catch")) {
      handler = parseCatchClause();
    }

    if (match(tokenTypes.keyword, "finally")) {
      advance();
      if (!match(tokenTypes.punctuator, "{")) {
        parserError(sourceText, current(), "Expected '{' to start finally block");
      }
      finalizer = parseBlockStatement();
    }

    if (handler == null && finalizer == null) {
      parserError(sourceText, current(), "Try statements require a catch or finally clause");
    }

    return tryStatement(block, handler, finalizer, start, (finalizer ?? handler ?? block).end);
  }

  function parseCatchClause() {
    const start = expect(tokenTypes.keyword, "catch").start;
    let param = null;

    if (match(tokenTypes.punctuator, "(")) {
      advance();
      if (!match(tokenTypes.identifier)) {
        parserError(sourceText, current(), "Catch bindings must be identifiers");
      }
      param = parseIdentifier();
      expect(tokenTypes.punctuator, ")", "Expected ')' after catch binding");
    }

    if (!match(tokenTypes.punctuator, "{")) {
      parserError(sourceText, current(), "Expected '{' to start catch block");
    }

    const body = parseBlockStatement();
    return catchClause(param, body, start, body.end);
  }

  function parseBlockStatement() {
    const start = expect(tokenTypes.punctuator, "{", "Expected '{'").start;
    const body = [];
    while (!match(tokenTypes.punctuator, "}")) {
      body.push(parseStatement());
    }
    const end = expect(tokenTypes.punctuator, "}", "Expected '}'").end;
    return blockStatement(body, start, end);
  }

  function parseExpressionStatement() {
    const expression = parseExpression();
    const end = expect(tokenTypes.punctuator, ";", "Expected ';' after expression").end;
    return expressionStatement(expression, expression.start, end);
  }

  return {
    parseBlockStatement,
    parseStatement,
    parseVariableDeclaration,
    parseVariableDeclarationWithSemicolon
  };
}
