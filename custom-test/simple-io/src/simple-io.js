import { prompt, writeLine } from "jayess:console";
import { readTextSync, writeTextSync } from "jayess:fs";

function main() {
  var text = prompt("Text to save: ");
  if (text === null) {
    writeLine("No input received.");
    return 1;
  }

  var path = "simple-io-output.txt";
  writeTextSync(path, text);

  var saved = readTextSync(path);
  writeLine("Saved text:");
  writeLine(saved);
  return 0;
}
