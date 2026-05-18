import { all } from "jayess:async";
import { create, entries, has, set } from "jayess:collections/map";
import { add, create as createSet, values as setValues } from "jayess:collections/set";
import { now, toIsoString } from "jayess:date";
import { keys } from "jayess:object";
import { join } from "jayess:path";
import { Counter } from "./hardening-class.js";
import { expand, parseValue } from "./hardening-helper.js";

export async function run(text) {
  var counter = new Counter();
  var registry = create();
  var labels = createSet();
  var stream = expand([counter.next(1), 2, 3]);
  var stamp = toIsoString(now());
  var location = join("temp", "hardening.txt");
  var shaped = keys({ stamp: stamp, location: location });
  var pending = [parseValue(text)];

  set(registry, "value", counter.next(2));
  add(labels, stamp);

  var results = await all(pending);
  var seen = has(registry, "value");
  var listed = entries(registry);
  var kept = setValues(labels);

  return [results, seen, listed, kept, shaped, stream];
}
