import { equal, notEqual, ok, throws } from "jayess:assert";

export function run(value) {
  var explode = function () {
    throw "boom";
  };
  ok(value);
  equal(value, value);
  notEqual(value, null);
  return throws(explode);
}
