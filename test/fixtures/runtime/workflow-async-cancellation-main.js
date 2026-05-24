import { createCancellationToken } from "jayess:async";
import { runWithCancellation, runWithTimeoutAndCancellation } from "jayess:subprocess";

export async function run() {
  var token = createCancellationToken();
  var plain = await runWithCancellation("printf", ["token"], {}, token);
  var timed = await runWithTimeoutAndCancellation("printf", ["timeout"], {}, 1000, token);
  return [plain.stdout, timed.stdout];
}
