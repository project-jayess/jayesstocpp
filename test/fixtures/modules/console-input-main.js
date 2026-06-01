import { prompt, readLine, readStdin } from "jayess:console";

export function inspectInput() {
  var first = readLine();
  var second = prompt("name: ");
  var rest = readStdin();
  var eof = readLine();
  return [first, second, rest, eof];
}

export function invalidPrompt() {
  return prompt(123);
}
