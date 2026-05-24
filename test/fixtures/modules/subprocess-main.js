import { readText } from "jayess:stream";
import { join, kill, ok, requireSuccess, run, runBytes, runJson, runText, runWithCancellation, runWithTimeout, runWithTimeoutAndCancellation, spawn, spawnPipeline, stderr, stdout } from "jayess:subprocess";
import { fromUtf8, length as bytesLength } from "jayess:bytes";
import { createCancellationToken } from "jayess:async";

export async function runCommand() {
  var result = await run("printf", ["jayess"], {});
  return result.stdout;
}

export function spawnCommand() {
  var handle = spawn("printf", ["jayess"], {});
  return join(handle).exitCode;
}

export function killCommand() {
  var handle = spawn("sleep", ["1"], {});
  kill(handle);
  return true;
}

export async function streamCommand() {
  var handle = spawn("printf", ["streamed"], {});
  var output = await stdout(handle);
  var result = join(handle);
  return [
    await readText(output, 64, 4),
    result.exitCode,
    ok(result)
  ];
}

export async function streamErrorCommand() {
  var handle = spawn("sh", ["-c", "printf problem >&2; exit 2"], {});
  var output = await stderr(handle);
  var result = join(handle);
  return [
    await readText(output, 64, 4),
    result.exitCode,
    ok(result)
  ];
}

export async function requireCommand() {
  var result = await run("printf", ["required"], {});
  return requireSuccess(result).stdout;
}

export async function timeoutCommand() {
  var result = await run("sleep", ["1"], { timeoutMillis: 1 });
  return [
    result.killed,
    result.timedOut,
    ok(result)
  ];
}

export async function stdinBytesCommand() {
  var result = await run("cat", [], { stdinBytes: fromUtf8("bytes-in") });
  return [
    result.stdout,
    result.exitCode,
    result.timedOut
  ];
}

export async function convenienceCommand() {
  var text = await runText("printf", ["text"], {});
  var bytes = await runBytes("printf", ["bytes"], {});
  var json = await runJson("printf", ["{\"name\":\"jayess\"}"], {});
  var piped = await spawnPipeline([
    { command: "printf", args: ["pipe"] },
    { command: "cat", args: [] }
  ], {});
  return [
    text,
    bytesLength(bytes),
    json.name,
    piped.stdout
  ];
}

export async function cancellableCommand() {
  var token = createCancellationToken();
  var plain = await runWithCancellation("printf", ["token"], {}, token);
  var timed = await runWithTimeout("printf", ["time"], {}, 1000);
  var nested = await runWithTimeoutAndCancellation("printf", ["both"], {}, 1000, token);
  return [plain.stdout, timed.stdout, nested.stdout];
}

export function completedJoinCommand() {
  var handle = spawn("printf", ["done"], {});
  var result = join(handle);
  return [
    result.stdout,
    result.exitCode,
    ok(result)
  ];
}

export function killedJoinCommand() {
  var handle = spawn("sleep", ["1"], {});
  kill(handle);
  var result = join(handle);
  return [
    result.killed,
    ok(result)
  ];
}
