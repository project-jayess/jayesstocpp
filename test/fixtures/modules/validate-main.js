import {
  arrayOf,
  assertValid,
  boolean,
  nullable,
  number,
  objectOf,
  oneOf,
  optional,
  string,
  validate
} from "jayess:validate";

export function run() {
  var userSchema = objectOf({
    name: string(),
    age: optional(number()),
    tags: arrayOf(string()),
    active: boolean(),
    role: oneOf(["admin", "user"]),
    note: nullable(string())
  });
  var valid = {
    name: "Jayess",
    tags: ["native", "cpp"],
    active: true,
    role: "admin",
    note: null
  };
  var validResult = validate(userSchema, valid);
  var invalidResult = validate(userSchema, {
    name: 12,
    tags: ["ok", 7],
    active: "yes",
    role: "other",
    note: 3
  });
  var asserted = assertValid(userSchema, valid);
  return [
    validResult.ok,
    invalidResult.ok,
    invalidResult.errors.length,
    asserted.name
  ];
}

export function invalidAssert() {
  return assertValid(objectOf({ name: string() }), { name: 7 });
}
