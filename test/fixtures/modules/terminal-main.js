import {
  ansi,
  clearLine,
  clearScreen,
  cursorTo,
  size,
  stripAnsi
} from "jayess:terminal";

export function run() {
  var terminalSize = size();
  var sizeOk = terminalSize === null;
  if (!sizeOk) {
    sizeOk = terminalSize.columns > 0 && terminalSize.rows > 0;
  }

  return [
    ansi("red"),
    stripAnsi(ansi("red") + "Hello" + ansi("reset")),
    cursorTo(2, 3),
    clearScreen(),
    clearLine(),
    sizeOk
  ];
}

export function invalidStyle() {
  return ansi("sparkle");
}

export function invalidCursor() {
  return cursorTo(0, 1);
}
