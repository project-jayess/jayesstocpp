import {
  arrayOf,
  assertValid,
  boolean,
  config,
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
  var configSchema = config({
    host: string(),
    port: number(),
    secure: optional(boolean())
  });
  var configResult = validate(configSchema, { host: "127.0.0.1", port: 8080 });
  var extraConfigResult = validate(configSchema, { host: "127.0.0.1", port: 8080, debug: true });
  return [
    validResult.ok,
    invalidResult.ok,
    invalidResult.errors.length,
    asserted.name,
    configResult.ok,
    extraConfigResult.ok,
    extraConfigResult.errors[0]
  ];
}

export function invalidAssert() {
  return assertValid(objectOf({ name: string() }), { name: 7 });
}
