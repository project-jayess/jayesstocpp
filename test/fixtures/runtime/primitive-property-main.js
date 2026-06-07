export function inspect() {
  var numeric = 0;
  var text = "value";
  var missingNumeric = numeric.top;
  var missingText = text.unknown;
  return missingNumeric === null && missingText === null;
}
