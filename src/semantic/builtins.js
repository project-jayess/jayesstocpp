const supportedArrayLiteralProperties = new Set(["length", "push", "pop", "join", "includes"]);
const supportedStringLiteralProperties = new Set([
  "length",
  "toString",
  "slice",
  "substring",
  "startsWith",
  "includes",
  "indexOf",
  "endsWith"
]);
const supportedPrimitiveLiteralProperties = new Set(["toString"]);

export function unsupportedBuiltinIdentifierMessage(name) {
  switch (name) {
    case "parseInt":
      return "Jayess does not expose ambient global 'parseInt'; import { parseInt } from 'jayess:number' instead";
    case "parseFloat":
      return "Jayess does not expose ambient global 'parseFloat'; import { parseFloat } from 'jayess:number' instead";
    case "Object":
      return "Jayess does not expose ambient global 'Object'; import { keys, values, entries } from 'jayess:object' instead";
    case "Date":
      return "Jayess does not expose ambient global 'Date'; import helpers from 'jayess:date' instead";
    case "JSON":
      return "Jayess does not expose ambient global 'JSON'; import helpers from 'jayess:json' instead";
    case "Map":
      return "Jayess does not expose ambient global 'Map'; import helpers from 'jayess:collections/map' instead";
    case "Set":
      return "Jayess does not expose ambient global 'Set'; import helpers from 'jayess:collections/set' instead";
    case "Promise":
      return "Jayess does not expose JavaScript 'Promise'; use Jayess async/await and Jayess-owned 'jayess:async' helpers instead";
    case "RegExp":
      return "Jayess does not expose ambient global 'RegExp'; import helpers from 'jayess:regex' instead";
    case "eval":
      return "Jayess does not support ambient global 'eval'; runtime source evaluation is unsupported by design in Jayess";
    case "Function":
      return "Jayess does not support the JavaScript 'Function' constructor; runtime source evaluation is unsupported by design in Jayess";
    default:
      return null;
  }
}

export function getSupportedBuiltinProperty(node) {
  if (node.type !== "MemberExpression" || node.computed || node.property.type !== "Identifier") {
    return null;
  }

  const property = node.property.name;

  if (node.object.type === "ArrayExpression") {
    return classifyLiteralBuiltinProperty("array", property, supportedArrayLiteralProperties);
  }

  if (node.object.type === "Literal" && node.object.kind === "string") {
    return classifyLiteralBuiltinProperty("string", property, supportedStringLiteralProperties);
  }

  if (node.object.type === "Literal" && (node.object.kind === "number" || node.object.kind === "boolean" || node.object.kind === "null")) {
    return classifyLiteralBuiltinProperty(node.object.kind, property, supportedPrimitiveLiteralProperties);
  }

  return null;
}

function classifyLiteralBuiltinProperty(receiver, property, supportedProperties) {
  if (supportedProperties.has(property)) {
    return { receiver, property };
  }
  return { receiver, property, unsupported: true };
}
