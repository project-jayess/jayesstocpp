const precedence = new Map([
  ["||", 1],
  ["&&", 2],
  ["==", 3],
  ["!=", 3],
  ["===", 3],
  ["!==", 3],
  [">", 4],
  ["<", 4],
  [">=", 4],
  ["<=", 4],
  ["+", 5],
  ["-", 5],
  ["*", 6],
  ["/", 6],
  ["%", 6],
  ["**", 7]
]);

export function hasBinaryOperatorPrecedence(operator) {
  return precedence.has(operator);
}

export function getBinaryOperatorPrecedence(operator) {
  return precedence.get(operator);
}
