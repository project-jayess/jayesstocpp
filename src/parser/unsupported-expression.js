export function unsupportedExpressionMessage(token) {
  if (token.type === "operator" && token.value === "/") {
    return "Jayess does not support regex literal syntax like /.../; it is unsupported by design, so use 'jayess:regex' helpers instead";
  }

  if (token.type === "punctuator") {
    if (token.value === "...") {
      return "Spread syntax is only valid inside array literals, object literals, call arguments, or binding patterns";
    }
    if (token.value === "," || token.value === ";" || token.value === ")" || token.value === "]" || token.value === "}") {
      return `Expected expression before '${token.value}'`;
    }
  }

  if (token.type === "operator" && token.value === "=>") {
    return "Arrow function syntax requires a parameter list before '=>'";
  }

  return `Jayess syntax does not support expressions starting with '${token.value}'`;
}
