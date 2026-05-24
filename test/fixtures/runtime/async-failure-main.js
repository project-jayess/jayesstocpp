import { all, rejected, resolved } from "jayess:async";

export async function run() {
  return await all([resolved(1), rejected("boom")]);
}
