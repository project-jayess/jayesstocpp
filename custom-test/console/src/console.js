import { log, prompt, write, writeLine } from "jayess:console";
import { parseFloat } from "jayess:number";

function readNumber(label) {
  var text = prompt(label);
  if (text === null) {
    writeLine("No input received; using 0.");
    return 0;
  }

  var value = parseFloat(text);
  if (value === null) {
    writeLine("Invalid number; using 0.");
    return 0;
  }

  return value;
}

function main ()
{
  var first = readNumber("First number: ");
  var second = readNumber("Second number: ");
  var result = first * second;

  write("Result: ");
  log(result);
  prompt("Press Enter to exit...");

  return 0;
}