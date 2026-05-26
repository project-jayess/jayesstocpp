import { includes } from "jayess:array";
import { has as objectHas, keys } from "jayess:object";
import { jayessValidateTypeOf } from "./validate-primitives.hpp";

function primitive(name) {
  return { kind: "primitive", name: name };
}

export function string() {
  return primitive("string");
}

export function number() {
  return primitive("number");
}

export function boolean() {
  return primitive("boolean");
}

export function array() {
  return primitive("array");
}

export function object() {
  return primitive("object");
}

export function nullable(schema) {
  return { kind: "nullable", schema: schema };
}

export function optional(schema) {
  return { kind: "optional", schema: schema };
}

export function arrayOf(schema) {
  return { kind: "arrayOf", schema: schema };
}

export function objectOf(shape) {
  return { kind: "objectOf", shape: shape };
}

export function strictObjectOf(shape) {
  return { kind: "objectOf", shape: shape, strict: true };
}

export function config(shape) {
  return strictObjectOf(shape);
}

export function oneOf(values) {
  return { kind: "oneOf", values: values };
}

function success(value) {
  return { ok: true, value: value, errors: [] };
}

function failure(message) {
  return { ok: false, value: null, errors: [message] };
}

function mergeErrors(errors, nested) {
  for (var index = 0; index < nested.length; index = index + 1) {
    errors.push(nested[index]);
  }
  return errors;
}

function validateAt(schema, value, path) {
  if (schema === null) {
    return failure(path + " schema is required");
  }

  if (schema.kind === "primitive") {
    var actual = jayessValidateTypeOf(value);
    if (actual === schema.name) {
      return success(value);
    }
    return failure(path + " expected " + schema.name + " but received " + actual);
  }

  if (schema.kind === "nullable") {
    if (value === null) {
      return success(value);
    }
    return validateAt(schema.schema, value, path);
  }

  if (schema.kind === "optional") {
    if (value === null) {
      return success(value);
    }
    return validateAt(schema.schema, value, path);
  }

  if (schema.kind === "arrayOf") {
    if (jayessValidateTypeOf(value) !== "array") {
      return failure(path + " expected array");
    }
    var arrayErrors = [];
    for (var arrayIndex = 0; arrayIndex < value.length; arrayIndex = arrayIndex + 1) {
      var itemResult = validateAt(schema.schema, value[arrayIndex], path + "[" + arrayIndex + "]");
      if (!itemResult.ok) {
        mergeErrors(arrayErrors, itemResult.errors);
      }
    }
    if (arrayErrors.length > 0) {
      return { ok: false, value: null, errors: arrayErrors };
    }
    return success(value);
  }

  if (schema.kind === "objectOf") {
    if (jayessValidateTypeOf(value) !== "object") {
      return failure(path + " expected object");
    }
    var names = keys(schema.shape);
    var objectErrors = [];
    for (var fieldIndex = 0; fieldIndex < names.length; fieldIndex = fieldIndex + 1) {
      var name = names[fieldIndex];
      var fieldSchema = schema.shape[name];
      if (!objectHas(value, name)) {
        if (fieldSchema.kind !== "optional") {
          objectErrors.push(path + "." + name + " is required");
        }
        continue;
      }
      var fieldResult = validateAt(fieldSchema, value[name], path + "." + name);
      if (!fieldResult.ok) {
        mergeErrors(objectErrors, fieldResult.errors);
      }
    }
    if (schema.strict) {
      var valueNames = keys(value);
      for (var valueIndex = 0; valueIndex < valueNames.length; valueIndex = valueIndex + 1) {
        var valueName = valueNames[valueIndex];
        if (!objectHas(schema.shape, valueName)) {
          objectErrors.push(path + "." + valueName + " is not allowed");
        }
      }
    }
    if (objectErrors.length > 0) {
      return { ok: false, value: null, errors: objectErrors };
    }
    return success(value);
  }

  if (schema.kind === "oneOf") {
    if (includes(schema.values, value)) {
      return success(value);
    }
    return failure(path + " expected one of the allowed values");
  }

  return failure(path + " has unsupported schema kind");
}

export function validate(schema, value) {
  return validateAt(schema, value, "$");
}

export function assertValid(schema, value) {
  var result = validate(schema, value);
  if (!result.ok) {
    throw "jayess:validate " + result.errors[0];
  }
  return result.value;
}
