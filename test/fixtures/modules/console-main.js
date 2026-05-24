import { error, log, write, writeLine } from "jayess:console";

export function run(value) {
  log(value);
  write("Jayess");
  writeLine(" console");
  error("diagnostic");
  return value;
}
