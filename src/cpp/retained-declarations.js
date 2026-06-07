import { shouldRetainTopLevelStatement } from "../modules/top-level-retention.js";

export function shouldEmitRetainedTopLevelStatement(statement, retainedDeclarationNames) {
  return shouldRetainTopLevelStatement(statement, retainedDeclarationNames);
}
