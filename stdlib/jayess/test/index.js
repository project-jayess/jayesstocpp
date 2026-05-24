import {
  equal,
  notEqual,
  ok,
  throws
} from "jayess:assert";

function requireTestName(name) {
  if (name === null || name === "") {
    throw "jayess:test requires a non-empty test name";
  }
  return name;
}

function requireTestFunction(fn) {
  if (fn === null) {
    throw "jayess:test requires a test function";
  }
  return fn;
}

function requireTestArray(tests) {
  if (tests === null) {
    throw "jayess:test run requires an array of tests";
  }
  return tests;
}

function passResult(name) {
  return {
    name: name,
    passed: true,
    failed: false,
    error: null,
    durationMillis: 0
  };
}

function failResult(name, error) {
  return {
    name: name,
    passed: false,
    failed: true,
    error: error,
    durationMillis: 0
  };
}

export function test(name, fn) {
  return {
    name: requireTestName(name),
    fn: requireTestFunction(fn)
  };
}

async function runOne(testCase) {
  if (testCase === null) {
    throw "jayess:test run received an invalid test case";
  }

  var name = requireTestName(testCase.name);
  var fn = requireTestFunction(testCase.fn);

  try {
    await fn();
    return passResult(name);
  } catch (error) {
    return failResult(name, error);
  }
}

export async function run(tests) {
  requireTestArray(tests);

  var results = [];
  var passed = 0;
  var failed = 0;

  for (var index = 0; index < tests.length; index = index + 1) {
    var result = await runOne(tests[index]);
    results.push(result);
    if (result.passed) {
      passed = passed + 1;
    } else {
      failed = failed + 1;
    }
  }

  return {
    total: results.length,
    passed: passed,
    failed: failed,
    results: results
  };
}

export function assertEqual(actual, expected) {
  return equal(actual, expected);
}

export function assertNotEqual(actual, expected) {
  return notEqual(actual, expected);
}

export function assertOk(value) {
  return ok(value);
}

export function assertThrows(fn) {
  return throws(fn);
}
