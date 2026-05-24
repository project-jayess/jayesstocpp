export function defaultBitmapFont() {
  return {
    charWidth: 5,
    charHeight: 7,
    spacing: 1,
    lineSpacing: 1
  };
}

function blankRows() {
  return [
    "00000",
    "00000",
    "00000",
    "00000",
    "00000",
    "00000",
    "00000"
  ];
}

function fallbackRows() {
  return [
    "11111",
    "10001",
    "10001",
    "10001",
    "10001",
    "10001",
    "11111"
  ];
}

export function glyphRows(char) {
  if (char === " " || char === "\n") {
    return blankRows();
  }

  if (char === "A") {
    return [
      "01110",
      "10001",
      "10001",
      "11111",
      "10001",
      "10001",
      "10001"
    ];
  }

  if (char === "H") {
    return [
      "10001",
      "10001",
      "10001",
      "11111",
      "10001",
      "10001",
      "10001"
    ];
  }

  if (char === "i") {
    return [
      "00100",
      "00000",
      "01100",
      "00100",
      "00100",
      "00100",
      "01110"
    ];
  }

  return fallbackRows();
}
