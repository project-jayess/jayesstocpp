import { createDiagnostic, throwDiagnostics } from "../diagnostics.js";
import { offsetToLineColumn } from "../source/source-text.js";
import { scanTemplateLiteral } from "./scan-template.js";
import { keywords, tokenTypes } from "./tokens.js";

const threeCharOperators = new Set(["===", "!==", "**="]);
const threeCharPunctuators = new Set(["..."]);
const twoCharOperators = new Set(["==", "!=", ">=", "<=", "&&", "||", "??", "**", "++", "--", "+=", "-=", "*=", "/=", "%=", "=>"]);
const twoCharPunctuators = new Set(["?."]);
const oneCharOperators = new Set(["+", "-", "*", "/", "%", "=", ">", "<", "!"]);
const punctuators = new Set(["(", ")", "{", "}", "[", "]", ";", ",", ".", ":", "?"]);

function createToken(type, value, start, end) {
  return { type, value, start, end };
}

function syntaxError(sourceText, start, message) {
  const { line, column } = offsetToLineColumn(sourceText, start);
  throwDiagnostics([
    createDiagnostic({
      phase: "syntax",
      message,
      filename: sourceText.filename,
      line,
      column
    })
  ]);
}

export function lex(sourceText) {
  const { text } = sourceText;
  const tokens = [];
  let index = 0;

  while (index < text.length) {
    const char = text[index];

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (char === "/" && text[index + 1] === "/") {
      index += 2;
      while (index < text.length && text[index] !== "\n") {
        index += 1;
      }
      continue;
    }

    if (char === "/" && text[index + 1] === "*") {
      index += 2;
      while (index < text.length && !(text[index] === "*" && text[index + 1] === "/")) {
        index += 1;
      }
      if (index >= text.length) {
        syntaxError(sourceText, text.length - 1, "Unterminated block comment");
      }
      index += 2;
      continue;
    }

    if (/[A-Za-z_]/.test(char)) {
      const start = index;
      index += 1;
      while (index < text.length && /[A-Za-z0-9_]/.test(text[index])) {
        index += 1;
      }
      const value = text.slice(start, index);
      tokens.push(createToken(keywords.has(value) ? tokenTypes.keyword : tokenTypes.identifier, value, start, index));
      continue;
    }

    if (/[0-9]/.test(char)) {
      const start = index;
      index += 1;
      while (index < text.length && /[0-9]/.test(text[index])) {
        index += 1;
      }
      if (text[index] === ".") {
        index += 1;
        while (index < text.length && /[0-9]/.test(text[index])) {
          index += 1;
        }
      }
      tokens.push(createToken(tokenTypes.number, text.slice(start, index), start, index));
      continue;
    }

    if (char === "\"" || char === "'") {
      const quote = char;
      const start = index;
      index += 1;
      let value = "";
      while (index < text.length && text[index] !== quote) {
        if (text[index] === "\\") {
          const escaped = text[index + 1];
          if (escaped == null) {
            syntaxError(sourceText, start, "Unterminated string literal");
          }
          value += escaped;
          index += 2;
          continue;
        }
        value += text[index];
        index += 1;
      }
      if (text[index] !== quote) {
        syntaxError(sourceText, start, "Unterminated string literal");
      }
      index += 1;
      tokens.push(createToken(tokenTypes.string, value, start, index));
      continue;
    }

    if (char === "`") {
      const { token, nextIndex } = scanTemplateLiteral(sourceText, index);
      tokens.push(token);
      index = nextIndex;
      continue;
    }

    if (char === "#") {
      const start = index;
      index += 1;
      if (index >= text.length || !/[A-Za-z_]/.test(text[index])) {
        syntaxError(sourceText, start, "Expected private identifier after '#'");
      }
      while (index < text.length && /[A-Za-z0-9_]/.test(text[index])) {
        index += 1;
      }
      tokens.push(createToken(tokenTypes.privateIdentifier, text.slice(start + 1, index), start, index));
      continue;
    }

    const threeChar = text.slice(index, index + 3);
    if (threeCharOperators.has(threeChar)) {
      tokens.push(createToken(tokenTypes.operator, threeChar, index, index + 3));
      index += 3;
      continue;
    }
    if (threeCharPunctuators.has(threeChar)) {
      tokens.push(createToken(tokenTypes.punctuator, threeChar, index, index + 3));
      index += 3;
      continue;
    }

    const twoChar = text.slice(index, index + 2);
    if (twoCharOperators.has(twoChar)) {
      tokens.push(createToken(tokenTypes.operator, twoChar, index, index + 2));
      index += 2;
      continue;
    }

    if (twoCharPunctuators.has(twoChar)) {
      tokens.push(createToken(tokenTypes.punctuator, twoChar, index, index + 2));
      index += 2;
      continue;
    }

    if (oneCharOperators.has(char)) {
      tokens.push(createToken(tokenTypes.operator, char, index, index + 1));
      index += 1;
      continue;
    }

    if (punctuators.has(char)) {
      tokens.push(createToken(tokenTypes.punctuator, char, index, index + 1));
      index += 1;
      continue;
    }

    syntaxError(sourceText, index, `Unsupported character '${char}'`);
  }

  tokens.push(createToken(tokenTypes.eof, "", text.length, text.length));
  return tokens;
}
