import { argv as processArgv } from "jayess:process";

function emptyParseResult() {
  return {
    flags: {},
    options: {},
    positionals: []
  };
}

function withoutPrefix(text, count) {
  return text.slice(count);
}

function optionParts(text) {
  var equals = text.indexOf("=");
  if (equals < 0) {
    return [text, null];
  }
  return [
    text.slice(0, equals),
    text.slice(equals + 1)
  ];
}

export function parse(args) {
  var result = emptyParseResult();
  for (var index = 0; index < args.length; index = index + 1) {
    var current = args[index];
    if (current.startsWith("--")) {
      var parts = optionParts(withoutPrefix(current, 2));
      var name = parts[0];
      var value = parts[1];
      if (value === null) {
        if (index + 1 < args.length && !args[index + 1].startsWith("-")) {
          result.options[name] = args[index + 1];
          index = index + 1;
        } else {
          result.flags[name] = true;
        }
      } else {
        result.options[name] = value;
      }
    } else if (current.startsWith("-") && current.length > 1) {
      result.flags[withoutPrefix(current, 1)] = true;
    } else {
      result.positionals.push(current);
    }
  }
  return result;
}

export function parseArgv() {
  var args = processArgv();
  if (args.length <= 2) {
    return parse([]);
  }
  var userArgs = [];
  for (var index = 2; index < args.length; index = index + 1) {
    userArgs.push(args[index]);
  }
  return parse(userArgs);
}

export function flag(parsed, name) {
  return parsed.flags[name] === true;
}

export function option(parsed, name, defaultValue) {
  var value = parsed.options[name];
  if (value === null) {
    return defaultValue;
  }
  return value;
}

export function positional(parsed, index, defaultValue) {
  if (index < parsed.positionals.length) {
    return parsed.positionals[index];
  }
  return defaultValue;
}
