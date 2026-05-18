import test from "node:test";
import assert from "node:assert/strict";
import { collectBindingIdentifiers, isBindingPattern } from "../../src/ast/binding-patterns.js";
import {
  arrayPattern,
  assignmentPattern,
  bindingProperty,
  identifier,
  objectPattern,
  restElement
} from "../../src/ast/nodes.js";

test("nested array and object binding patterns are treated as binding patterns", () => {
  const nested = arrayPattern(
    [
      identifier("head", 1, 5),
      objectPattern(
        [
          bindingProperty(
            identifier("name", 8, 12),
            identifier("value", 14, 19),
            8,
            19
          )
        ],
        7,
        20
      )
    ],
    0,
    21
  );

  assert.equal(isBindingPattern(nested), true);
  assert.equal(isBindingPattern(nested.elements[1]), true);
  assert.equal(nested.elements[1].type, "ObjectPattern");
  assert.equal(nested.elements[1].properties[0].value.name, "value");
});

test("collectBindingIdentifiers walks nested binding patterns recursively", () => {
  const pattern = objectPattern(
    [
      bindingProperty(
        identifier("meta", 1, 5),
        objectPattern(
          [
            bindingProperty(identifier("name", 8, 12), identifier("name", 14, 18), 8, 18),
            bindingProperty(
              identifier("coords", 20, 26),
              arrayPattern(
                [
                  identifier("x", 29, 30),
                  restElement(identifier("tail", 35, 39), 32, 39)
                ],
                28,
                40
              ),
              20,
              40
            )
          ],
          7,
          41
        ),
        1,
        41
      )
    ],
    0,
    42
  );

  const names = collectBindingIdentifiers(pattern).map((node) => node.name);
  assert.deepEqual(names, ["name", "x", "tail"]);
});

test("collectBindingIdentifiers ignores default-value expressions and walks defaulted bindings", () => {
  const pattern = arrayPattern(
    [
      assignmentPattern(identifier("head", 1, 5), identifier("fallback", 8, 16), 1, 16),
      objectPattern(
        [
          bindingProperty(
            identifier("name", 20, 24),
            assignmentPattern(identifier("value", 27, 32), identifier("backup", 35, 41), 27, 41),
            20,
            41
          )
        ],
        18,
        42
      )
    ],
    0,
    43
  );

  const names = collectBindingIdentifiers(pattern).map((node) => node.name);
  assert.deepEqual(names, ["head", "value"]);
});
