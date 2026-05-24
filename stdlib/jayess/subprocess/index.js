import {
  jayessSubprocessJoin,
  jayessSubprocessKill,
  jayessSubprocessRun,
  jayessSubprocessSpawn,
  jayessSubprocessStderr,
  jayessSubprocessStdout
} from "./subprocess-primitives.hpp";
import { fromUtf8 } from "jayess:bytes";
import { parse as parseJson } from "jayess:json";
import { assign } from "jayess:object";
import { timeoutWithCancellation, withCancellation, withTimeout } from "jayess:async";

export function run(command, args, options) {
  return jayessSubprocessRun(command, args, options);
}

export function runWithCancellation(command, args, options, token) {
  return withCancellation(run(command, args, options), token);
}

export function runWithTimeout(command, args, options, milliseconds) {
  return withTimeout(run(command, args, options), milliseconds);
}

export function runWithTimeoutAndCancellation(command, args, options, milliseconds, token) {
  return timeoutWithCancellation(run(command, args, options), milliseconds, token);
}

export function spawn(command, args, options) {
  return jayessSubprocessSpawn(command, args, options);
}

export function join(handle) {
  return jayessSubprocessJoin(handle);
}

export function kill(handle) {
  return jayessSubprocessKill(handle);
}

export function stdout(handle) {
  return jayessSubprocessStdout(handle);
}

export function stderr(handle) {
  return jayessSubprocessStderr(handle);
}

export function ok(result) {
  return result.exitCode === 0 && result.killed === false;
}

export function requireSuccess(result) {
  if (!ok(result)) {
    throw result.stderr;
  }
  return result;
}

function requireStage(stage) {
  if (stage.command === null) {
    throw "Jayess subprocess pipeline stage requires command";
  }
  if (stage.args === null) {
    throw "Jayess subprocess pipeline stage requires args";
  }
  return stage;
}

function pipelineOptions(options, input) {
  if (input.length === 0) {
    return options;
  }
  var base = {};
  if (options !== null) {
    base = options;
  }
  return assign(assign({}, base), { stdin: input });
}

export async function runText(command, args, options) {
  return requireSuccess(await run(command, args, options)).stdout;
}

export async function runBytes(command, args, options) {
  return fromUtf8(await runText(command, args, options));
}

export async function runJson(command, args, options) {
  return parseJson(await runText(command, args, options));
}

export async function spawnPipeline(commands, options) {
  var input = "";
  var result = null;
  for (var index = 0; index < commands.length; index = index + 1) {
    var stage = requireStage(commands[index]);
    var stageOptions = pipelineOptions(options, input);
    result = requireSuccess(await run(stage.command, stage.args, stageOptions));
    input = result.stdout;
  }
  return result;
}
