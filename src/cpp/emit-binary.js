export function renderBinary(operator, left, right) {
  if (operator === "&&") {
    return `([&]() -> jayess::value {
  jayess::value jayess_left = ${left};
  if (!jayess::truthy(jayess_left)) {
    return jayess_left;
  }
  return ${right};
})()`;
  }

  if (operator === "||") {
    return `([&]() -> jayess::value {
  jayess::value jayess_left = ${left};
  if (jayess::truthy(jayess_left)) {
    return jayess_left;
  }
  return ${right};
})()`;
  }

  if (operator === "??") {
    return `([&]() -> jayess::value {
  jayess::value jayess_left = ${left};
  if (!jayess::is_null(jayess_left)) {
    return jayess_left;
  }
  return ${right};
})()`;
  }

  const helpers = {
    "+": "add",
    "-": "subtract",
    "*": "multiply",
    "/": "divide",
    "%": "modulo",
    "**": "power",
    ">": "greater_than",
    "<": "less_than",
    ">=": "greater_than_equal",
    "<=": "less_than_equal",
    "==": "equal",
    "!=": "not_equal",
    "===": "equal",
    "!==": "not_equal"
  };
  return `jayess::${helpers[operator]}(${left}, ${right})`;
}
