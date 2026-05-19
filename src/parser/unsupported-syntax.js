const unsupportedStatementMessages = new Map([
  ["catch", "Unexpected 'catch' without a matching try block"],
  ["extends", "Jayess does not support 'extends' yet; inheritance depends on a future class-runtime design"],
  ["finally", "Unexpected 'finally' without a matching try block"],
  ["with", "Jayess does not support 'with'; it is unsupported by design because Jayess keeps lexical name resolution explicit"]
]);

export function getUnsupportedStatementMessage(keyword) {
  return unsupportedStatementMessages.get(keyword) ?? null;
}
