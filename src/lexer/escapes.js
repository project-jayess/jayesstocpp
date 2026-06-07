export function decodeEscape(escaped) {
  if (escaped === "n") {
    return "\n";
  }
  if (escaped === "r") {
    return "\r";
  }
  if (escaped === "t") {
    return "\t";
  }
  if (escaped === "b") {
    return "\b";
  }
  if (escaped === "f") {
    return "\f";
  }
  if (escaped === "v") {
    return "\v";
  }
  return escaped;
}
