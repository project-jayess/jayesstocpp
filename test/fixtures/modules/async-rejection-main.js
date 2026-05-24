import { catchError, finallyDo, rejected, resolved, timeout } from "jayess:async";

export async function run(value) {
  var recovered = await catchError(rejected(value), function (error) {
    return error;
  });
  await finallyDo(timeout(resolved(value), 1), function () {
    return value;
  });
  return recovered;
}
