import {
  exportAllDeclaration,
  exportDefaultDeclaration,
  exportNamedDeclaration,
  importDeclaration,
  importSpecifier
} from "../ast/nodes.js";
import { tokenTypes } from "../lexer/tokens.js";

export function createImportExportParser({
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
}) {
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

  return {
    parseExportDeclaration,
    parseImportDeclaration
  };
}
