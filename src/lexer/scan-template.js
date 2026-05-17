import { createDiagnostic, throwDiagnostics } from "../diagnostics.js";
import { offsetToLineColumn } from "../source/source-text.js";
import { tokenTypes } from "./tokens.js";

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

function scanQuoted(text, start, quote) {
  let index = start + 1;

  while (index < text.length) {
    if (text[index] === "\\") {
      index += 2;
      continue;
    }
    if (text[index] === quote) {
      return index + 1;
    }
    index += 1;
  }

  return -1;
}

function scanTemplateContent(text, start) {
  let index = start + 1;

  while (index < text.length) {
    if (text[index] === "\\") {
      index += 2;
      continue;
    }

    if (text[index] === "$" && text[index + 1] === "{") {
      index += 2;
      let depth = 1;

      while (index < text.length && depth > 0) {
        const char = text[index];

        if (char === "'" || char === "\"") {
          const nextIndex = scanQuoted(text, index, char);
          if (nextIndex === -1) {
            return -1;
          }
          index = nextIndex;
          continue;
        }

        if (char === "`") {
          const nextIndex = scanTemplateContent(text, index);
          if (nextIndex === -1) {
            return -1;
          }
          index = nextIndex;
          continue;
        }

        if (char === "{") {
          depth += 1;
          index += 1;
          continue;
        }

        if (char === "}") {
          depth -= 1;
          index += 1;
          continue;
        }

        if (char === "\\") {
          index += 2;
          continue;
        }

        index += 1;
      }

      if (depth !== 0) {
        return -1;
      }
      continue;
    }

    if (text[index] === "`") {
      return index + 1;
    }

    index += 1;
  }

  return -1;
}

export function scanTemplateLiteral(sourceText, start) {
  const { text } = sourceText;
  let index = start + 1;
  let currentSegment = "";
  const segments = [];
  const expressions = [];

  while (index < text.length) {
    const char = text[index];

    if (char === "\\") {
      const escaped = text[index + 1];
      if (escaped == null) {
        syntaxError(sourceText, start, "Unterminated template literal");
      }
      currentSegment += escaped;
      index += 2;
      continue;
    }

    if (char === "$" && text[index + 1] === "{") {
      segments.push(currentSegment);
      currentSegment = "";
      index += 2;
      const expressionStart = index;
      let depth = 1;

      while (index < text.length && depth > 0) {
        const expressionChar = text[index];

        if (expressionChar === "'" || expressionChar === "\"") {
          const nextIndex = scanQuoted(text, index, expressionChar);
          if (nextIndex === -1) {
            syntaxError(sourceText, start, "Unterminated template interpolation");
          }
          index = nextIndex;
          continue;
        }

        if (expressionChar === "`") {
          const nextIndex = scanTemplateContent(text, index);
          if (nextIndex === -1) {
            syntaxError(sourceText, start, "Unterminated template interpolation");
          }
          index = nextIndex;
          continue;
        }

        if (expressionChar === "{") {
          depth += 1;
          index += 1;
          continue;
        }

        if (expressionChar === "}") {
          depth -= 1;
          if (depth === 0) {
            expressions.push(text.slice(expressionStart, index));
            index += 1;
            break;
          }
          index += 1;
          continue;
        }

        if (expressionChar === "\\") {
          index += 2;
          continue;
        }

        index += 1;
      }

      if (depth !== 0) {
        syntaxError(sourceText, start, "Unterminated template interpolation");
      }
      continue;
    }

    if (char === "`") {
      segments.push(currentSegment);
      return {
        token: {
          type: tokenTypes.template,
          value: { segments, expressions },
          start,
          end: index + 1
        },
        nextIndex: index + 1
      };
    }

    currentSegment += char;
    index += 1;
  }

  syntaxError(sourceText, start, "Unterminated template literal");
}
