import {
  arrayExpression,
  arrayPattern,
  assignmentPattern,
  arrowFunctionExpression,
  assignmentExpression,
  awaitExpression,
  binaryExpression,
  bindingProperty,
  breakStatement,
  blockStatement,
  callExpression,
  classFieldDefinition,
  classDeclaration,
  catchClause,
  conditionalExpression,
  continueStatement,
  doWhileStatement,
  exportAllDeclaration,
  exportDefaultDeclaration,
  exportNamedDeclaration,
  expressionStatement,
  forStatement,
  functionDeclaration,
  functionExpression,
  identifier,
  ifStatement,
  importDeclaration,
  importSpecifier,
  literal,
  memberExpression,
  methodDefinition,
  newExpression,
  objectExpression,
  objectProperty,
  objectPattern,
  optionalCallExpression,
  optionalMemberExpression,
  parameter,
  privateIdentifier,
  program,
  returnStatement,
  restElement,
  switchCase,
  switchStatement,
  templateLiteral,
  spreadElement,
  staticInitializationBlock,
  superExpression,
  thisExpression,
  throwStatement,
  unaryExpression,
  tryStatement,
  updateExpression,
  yieldExpression,
  whileStatement,
  variableDeclaration,
  variableDeclarator
} from "../ast/nodes.js";
import { throwDiagnostics } from "../diagnostics.js";
import { createSyntaxDiagnostic } from "../diagnostics/syntax-diagnostic.js";
import { lex } from "../lexer/lex.js";
import { tokenTypes } from "../lexer/tokens.js";
import { createSourceText } from "../source/source-text.js";

const precedence = new Map([
  ["||", 1],
  ["&&", 2],
  ["==", 3],
  ["!=", 3],
  ["===", 3],
  ["!==", 3],
  [">", 4],
  ["<", 4],
  [">=", 4],
  ["<=", 4],
  ["+", 5],
  ["-", 5],
  ["*", 6],
  ["/", 6],
  ["%", 6],
  ["**", 7]
]);

function parserError(sourceText, token, message) {
  throwDiagnostics([createSyntaxDiagnostic(sourceText, token.start, message)]);
}

const unsupportedStatementMessages = new Map([
  ["catch", "Unexpected 'catch' without a matching try block"],
  ["extends", "Jayess does not support 'extends' yet; inheritance depends on a future class-runtime design"],
  ["finally", "Unexpected 'finally' without a matching try block"],
  ["with", "Jayess does not support 'with'; it is unsupported by design because Jayess keeps lexical name resolution explicit"]
]);

export function parse(sourceText) {
  const tokens = lex(sourceText);
  let index = 0;

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
    if (match(tokenTypes.keyword) && unsupportedStatementMessages.has(current().value)) {
      parserError(sourceText, current(), unsupportedStatementMessages.get(current().value));
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

  function parseImportDeclaration() {
    const start = expect(tokenTypes.keyword, "import").start;

    if (match(tokenTypes.string)) {
      const sourceToken = advance();
      const end = expect(tokenTypes.punctuator, ";", "Expected ';' after import").end;
      return importDeclaration([], sourceToken.value, start, end);
    }

    const specifiers = [];
    if (match(tokenTypes.identifier)) {
      const local = parseIdentifier();
      specifiers.push(importSpecifier("default", local.name, "default", local.start, local.end));
      if (match(tokenTypes.punctuator, ",")) {
        advance();
      }
    }

    if (match(tokenTypes.operator, "*")) {
      const startToken = advance();
      expect(tokenTypes.keyword, "as", "Malformed namespace import: expected 'as' before the local namespace name");
      const local = parseIdentifier();
      specifiers.push(importSpecifier("*", local.name, "namespace", startToken.start, local.end));
    }

    if (match(tokenTypes.punctuator, "{")) {
      advance();
      while (!match(tokenTypes.punctuator, "}")) {
        const imported = parseIdentifier();
        let localName = imported.name;
        if (match(tokenTypes.keyword, "as")) {
          advance();
          localName = parseIdentifier().name;
        }
        specifiers.push(importSpecifier(imported.name, localName, "named", imported.start, imported.end));
        if (match(tokenTypes.punctuator, ",")) {
          advance();
        } else {
          break;
        }
      }
      expect(tokenTypes.punctuator, "}", "Malformed import clause: expected '}' to close the import specifier list");
    }

    expect(tokenTypes.keyword, "from", "Malformed import declaration: expected 'from' before the source string");
    const sourceToken = expect(tokenTypes.string, null, "Malformed import declaration: expected a string source after 'from'");
    const end = expect(tokenTypes.punctuator, ";", "Expected ';' after import").end;
    return importDeclaration(specifiers, sourceToken.value, start, end);
  }

  function parseExportDeclaration() {
    const start = expect(tokenTypes.keyword, "export").start;

    if (match(tokenTypes.keyword, "default")) {
      advance();
      if (isAsyncFunctionDeclarationStart()) {
        const declaration = parseAsyncFunctionDeclaration(true);
        return exportDefaultDeclaration(declaration, start, declaration.end);
      }
      if (match(tokenTypes.keyword, "function")) {
        const declaration = lookahead().type === tokenTypes.identifier
          ? parseFunctionDeclaration(true)
          : parseFunctionExpression();
        return exportDefaultDeclaration(declaration, start, declaration.end);
      }
      if (match(tokenTypes.keyword, "class")) {
        const declaration = lookahead().type === tokenTypes.identifier
          ? parseClassDeclaration(true)
          : parseAnonymousClassDeclaration(true);
        return exportDefaultDeclaration(declaration, start, declaration.end);
      }
      const declaration = parseExpression();
      const end = expect(tokenTypes.punctuator, ";", "Expected ';' after export default").end;
      return exportDefaultDeclaration(declaration, start, end);
    }

    if (isAsyncFunctionDeclarationStart()) {
      const declaration = parseAsyncFunctionDeclaration(true);
      return exportNamedDeclaration(declaration, [], null, start, declaration.end);
    }

    if (match(tokenTypes.keyword, "function")) {
      const declaration = parseFunctionDeclaration(true);
      return exportNamedDeclaration(declaration, [], null, start, declaration.end);
    }

    if (match(tokenTypes.keyword, "class")) {
      const declaration = parseClassDeclaration(true);
      return exportNamedDeclaration(declaration, [], null, start, declaration.end);
    }

    if (match(tokenTypes.keyword, "const") || match(tokenTypes.keyword, "var")) {
      const declaration = parseVariableDeclaration(true);
      return exportNamedDeclaration(declaration, [], null, start, declaration.end);
    }

    if (match(tokenTypes.operator, "*")) {
      advance();
      expect(tokenTypes.keyword, "from", "Malformed export-all declaration: expected 'from' before the source string");
      const sourceToken = expect(tokenTypes.string, null, "Malformed export declaration: expected a string source after 'from'");
      const end = expect(tokenTypes.punctuator, ";", "Expected ';' after export *").end;
      return exportAllDeclaration(sourceToken.value, start, end);
    }

    if (match(tokenTypes.punctuator, "{")) {
      const specifiers = parseExportSpecifiers();
      let source = null;
      if (match(tokenTypes.keyword, "from")) {
        advance();
        source = expect(tokenTypes.string, null, "Expected export source string").value;
      }
      const end = expect(tokenTypes.punctuator, ";", "Expected ';' after export").end;
      return exportNamedDeclaration(null, specifiers, source, start, end);
    }

    parserError(
      sourceText,
      current(),
      "Jayess syntax does not support this export form; expected 'export default ...', 'export { ... }', 'export * from ...', or an exported declaration"
    );
  }

  function parseExportSpecifiers() {
    const specifiers = [];
    expect(tokenTypes.punctuator, "{", "Malformed export clause: expected '{' to start the export specifier list");
    while (!match(tokenTypes.punctuator, "}")) {
      const local = parseIdentifier();
      let exportedName = local.name;
      if (match(tokenTypes.keyword, "as")) {
        advance();
        exportedName = parseIdentifier().name;
      }
      specifiers.push({
        localName: local.name,
        exportedName,
        start: local.start,
        end: local.end
      });
      if (match(tokenTypes.punctuator, ",")) {
        advance();
      } else {
        break;
      }
    }
    expect(tokenTypes.punctuator, "}", "Malformed export clause: expected '}' to close the export specifier list");
    return specifiers;
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

  function parseClassMember() {
    let isStatic = false;
    let { key, computed, start } = parseClassMemberKey();
    if (key.name === "static") {
      if (match(tokenTypes.punctuator, "{")) {
        const body = parseBlockStatement();
        return staticInitializationBlock(body, start, body.end);
      }
      if (match(tokenTypes.identifier) || match(tokenTypes.privateIdentifier) || match(tokenTypes.punctuator, "[")) {
        isStatic = true;
        ({ key, computed, start } = parseClassMemberKey());
      }
    }
    if (isStatic && key.type === "PrivateIdentifier") {
      parserError(
        sourceText,
        current(),
        "Jayess does not support private static fields yet; the first private-member slice starts with private instance fields only"
      );
    }
    if (match(tokenTypes.punctuator, "(")) {
      const { params, body } = parseFunctionSignatureAndBody();
      const kind = !computed && key.name === "constructor" ? "constructor" : "method";
      return methodDefinition(key, params, body, start, body.end, kind, isStatic, computed);
    }

    let init = null;
    if (match(tokenTypes.operator, "=")) {
      advance();
      init = parseExpression();
    }
    const end = expect(tokenTypes.punctuator, ";", "Expected ';' after class field").end;
    return classFieldDefinition(key, init, start, end, isStatic, computed);
  }

  function parseMethodDefinition() {
    const key = parseIdentifier();
    const { params, body } = parseFunctionSignatureAndBody();
    const kind = key.name === "constructor" ? "constructor" : "method";
    return methodDefinition(key, params, body, key.start, body.end, kind);
  }

  function parseFunctionSignatureAndBody() {
    expect(tokenTypes.punctuator, "(", "Expected '(' after function");
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
    expect(tokenTypes.punctuator, ")", "Expected ')' after parameters");
    const body = parseBlockStatement();
    return { params, body };
  }

  function parseParameter() {
    const id = parseIdentifier();
    let defaultValue = null;
    if (match(tokenTypes.operator, "=")) {
      advance();
      defaultValue = parseExpression();
    }
    return parameter(id, defaultValue, id.start, defaultValue?.end ?? id.end, false);
  }

  function parseRestParameter() {
    const start = expect(tokenTypes.punctuator, "...", "Expected '...' before rest parameter").start;
    const id = parseIdentifier();
    if (match(tokenTypes.operator, "=")) {
      parserError(sourceText, current(), "Rest parameters cannot have default values");
    }
    return parameter(id, null, start, id.end, true);
  }

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
    parserError(sourceText, current(), "Expected binding target");
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
          parserError(sourceText, current(), "Rest bindings in destructuring must bind to a single identifier");
        }
        const argument = parseIdentifier();
        elements.push(restElement(argument, restStart, argument.end));
        if (match(tokenTypes.punctuator, ",")) {
          parserError(sourceText, current(), "Rest bindings must be the last element in an array destructuring pattern");
        }
        break;
      }
      if (match(tokenTypes.punctuator, ",")) {
        parserError(sourceText, current(), "Array destructuring elisions are not supported");
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
          parserError(sourceText, current(), "Rest bindings in destructuring must bind to a single identifier");
        }
        const argument = parseIdentifier();
        properties.push(restElement(argument, restStart, argument.end));
        if (match(tokenTypes.punctuator, ",")) {
          parserError(sourceText, current(), "Rest bindings must be the last property in an object destructuring pattern");
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
        parserError(sourceText, current(), "Expected object binding property");
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
      if (!match(tokenTypes.identifier)) {
        parserError(
          sourceText,
          current(),
          "Arrow function parameters must be identifiers with optional defaults, or a final rest parameter"
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

  function parseArrowFunctionBody() {
    if (match(tokenTypes.punctuator, "{")) {
      const body = parseBlockStatement();
      return { body, expressionBody: false, end: body.end };
    }

    const body = parseAssignment();
    return { body, expressionBody: true, end: body.end };
  }

  function parseArrowFunctionWithParentheses() {
    const savedIndex = index;
    let parameterList = null;

    try {
      parameterList = parseArrowFunctionParameterList();
    } catch {
      index = savedIndex;
      return null;
    }

    if (!match(tokenTypes.operator, "=>")) {
      index = savedIndex;
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

  function parseParenthesizedExpression() {
    advance();
    const expression = parseExpression();
    expect(tokenTypes.punctuator, ")", "Expected ')'");
    if (match(tokenTypes.operator, "=>")) {
      parserError(
        sourceText,
        current(),
        "Arrow function parameters must be identifiers with optional defaults; parenthesized expressions are not valid parameter lists"
      );
    }
    return expression;
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

  function parseExpression() {
    return parseAssignment();
  }

  function isArrowParameterStart(token) {
    return token.type === tokenTypes.identifier
      || token.type === tokenTypes.punctuator && token.value === "..."
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

  function parseAssignment() {
    if (match(tokenTypes.punctuator, "[") || match(tokenTypes.punctuator, "{")) {
      const savedIndex = index;
      try {
        const pattern = match(tokenTypes.punctuator, "[")
          ? parseArrayBindingPattern()
          : parseObjectBindingPattern();
        if (match(tokenTypes.operator, "=")) {
          advance();
          const right = parseAssignment();
          return assignmentExpression(pattern, "=", right, pattern.start, right.end);
        }
      } catch {
        // Fall through to ordinary expression parsing if the left-hand side is not a destructuring pattern.
      }
      index = savedIndex;
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

    while (match(tokenTypes.operator) && precedence.has(current().value)) {
      const operator = current().value;
      const operatorPrecedence = precedence.get(operator);
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
        parserError(sourceText, current(), "Jayess syntax does not support tagged template literals");
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
          const args = parseArgumentList("Expected ')' after optional call arguments");
          const end = expect(tokenTypes.punctuator, ")", "Expected ')' after optional call arguments").end;
          expression = optionalCallExpression(expression, args, expression.start, end);
          continue;
        }

        parserError(sourceText, current(), "Optional chaining must be followed by a property, index expression, or call");
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
        const args = parseArgumentList("Expected ')' after arguments");
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
        current(),
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
        current(),
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
    parserError(sourceText, current(), "Jayess syntax does not support this expression form");
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
    parserError(sourceText, current(), "Expected object property key");
  }

  function parseNewExpression() {
    const start = expect(tokenTypes.keyword, "new").start;
    const callee = parsePrimaryExpression();
    expect(tokenTypes.punctuator, "(", "Expected '(' after constructor target");
    const args = parseArgumentList("Expected ')' after constructor arguments");
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

  function parseIdentifier() {
    const token = expect(tokenTypes.identifier, null, "Expected identifier");
    return identifier(token.value, token.start, token.end);
  }

  function parsePrivateIdentifier() {
    const token = expect(tokenTypes.privateIdentifier, null, "Expected private identifier");
    return privateIdentifier(token.value, token.start, token.end);
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
    const key = parseIdentifier();
    return { key, computed: false, start: key.start, end: key.end };
  }

  function parseMemberProperty() {
    if (match(tokenTypes.privateIdentifier)) {
      return parsePrivateIdentifier();
    }
    return parseIdentifier();
  }

  return parseProgram();
}
