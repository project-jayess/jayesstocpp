import { extra, plus, renamed } from "./graph-reexport.js";
import { parseInt } from "jayess:number";
import { keys } from "jayess:object";
import { join } from "jayess:path";

export function run(input) {
  var parsed = parseInt(input);
  var data = { value: renamed, extra: extra };
  var names = keys(data);
  var shaped = join("temp", "graph.txt");
  return plus(parsed, extra) + names.length + shaped.length;
}
