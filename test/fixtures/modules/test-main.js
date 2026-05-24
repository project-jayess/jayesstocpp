import {
  assertEqual,
  assertNotEqual,
  assertOk,
  assertThrows,
  run,
  test
} from "jayess:test";
import { resolved } from "jayess:async";

function throwsValue() {
  throw "expected";
}

export async function runSuite() {
  return await run([
    test("sync pass", function () {
      assertEqual(2 + 2, 4);
      assertNotEqual("left", "right");
      assertOk(true);
    }),
    test("async pass", async function () {
      var value = await resolved("ready");
      assertEqual(value, "ready");
    }),
    test("throws pass", function () {
      assertEqual(assertThrows(throwsValue), "expected");
    }),
    test("failure capture", function () {
      assertEqual("actual", "expected");
    })
  ]);
}

export function invalidName() {
  return test("", function () {
    return null;
  });
}
