function assertionMessage(message, fallback) {
  return message ?? fallback;
}

export function ok(value, message = "Expected value to be truthy") {
  if (!value) {
    throw assertionMessage(message, "Expected value to be truthy");
  }
  return value;
}

export function equal(left, right, message = "Expected values to be equal") {
  if (left !== right) {
    throw assertionMessage(message, "Expected values to be equal");
  }
  return left;
}

export function notEqual(left, right, message = "Expected values to be different") {
  if (left === right) {
    throw assertionMessage(message, "Expected values to be different");
  }
  return left;
}

export function fail(message = "Assertion failed") {
  throw assertionMessage(message, "Assertion failed");
}

export function throws(callback, message = "Expected callback to throw") {
  try {
    callback();
  } catch (error) {
    return error;
  }
  throw assertionMessage(message, "Expected callback to throw");
}
