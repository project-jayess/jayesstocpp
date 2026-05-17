export function createSourceText(text, filename = "<anonymous>") {
  const lineStarts = [0];

  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === "\n") {
      lineStarts.push(index + 1);
    }
  }

  return { filename, text, lineStarts };
}

export function offsetToLineColumn(sourceText, offset) {
  const { lineStarts } = sourceText;
  let low = 0;
  let high = lineStarts.length - 1;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const start = lineStarts[middle];
    const next = lineStarts[middle + 1] ?? Number.MAX_SAFE_INTEGER;

    if (offset < start) {
      high = middle - 1;
    } else if (offset >= next) {
      low = middle + 1;
    } else {
      return {
        line: middle + 1,
        column: offset - start + 1
      };
    }
  }

  return { line: 1, column: 1 };
}
