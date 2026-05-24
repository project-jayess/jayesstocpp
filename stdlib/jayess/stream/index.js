import {
  length,
  concat,
  fromArray,
  fromUtf8,
  toUtf8
} from "jayess:bytes";
import { withCancellation } from "jayess:async";
import { next as nextChunk } from "jayess:iter";
import { split } from "jayess:string";
import {
  jayessStreamClose,
  jayessStreamOpenRead,
  jayessStreamOpenReadSync,
  jayessStreamOpenWrite,
  jayessStreamOpenWriteSync,
  jayessStreamReadChunk,
  jayessStreamWriteChunk
} from "./stream-primitives.hpp";

export function openRead(path) {
  return jayessStreamOpenRead(path);
}

export function openWrite(path) {
  return jayessStreamOpenWrite(path);
}

export function openReadSync(path) {
  return jayessStreamOpenReadSync(path);
}

export function openWriteSync(path) {
  return jayessStreamOpenWriteSync(path);
}

export function readChunk(stream, size) {
  return jayessStreamReadChunk(stream, size);
}

export function writeChunk(stream, bytes) {
  return jayessStreamWriteChunk(stream, bytes);
}

export function close(stream) {
  return jayessStreamClose(stream);
}

export async function pipe(readStream, writeStream, chunkSize) {
  while (true) {
    var chunk = await readChunk(readStream, chunkSize);
    if (length(chunk) === 0) {
      return null;
    }
    await writeChunk(writeStream, chunk);
  }
}

export async function pipeWithCancellation(readStream, writeStream, chunkSize, token) {
  while (true) {
    var chunk = await withCancellation(readChunk(readStream, chunkSize), token);
    if (length(chunk) === 0) {
      return null;
    }
    await withCancellation(writeChunk(writeStream, chunk), token);
  }
}

export async function tee(readStream, leftWriteStream, rightWriteStream, chunkSize) {
  while (true) {
    var chunk = await readChunk(readStream, chunkSize);
    if (length(chunk) === 0) {
      return null;
    }
    await writeChunk(leftWriteStream, chunk);
    await writeChunk(rightWriteStream, chunk);
  }
}

export async function pipeAll(pairs, chunkSize) {
  for (var index = 0; index < pairs.length; index = index + 1) {
    var pair = pairs[index];
    if (pair.read === null) {
      throw "Jayess stream pipeAll stage requires read";
    }
    if (pair.write === null) {
      throw "Jayess stream pipeAll stage requires write";
    }
    await pipe(pair.read, pair.write, chunkSize);
  }
  return null;
}

export async function copy(fromPath, toPath, chunkSize) {
  var reader = await openRead(fromPath);
  var writer = await openWrite(toPath);
  await pipe(reader, writer, chunkSize);
  await close(reader);
  await close(writer);
  return null;
}

export function* chunks(stream, chunkSize, maxChunks) {
  for (var index = 0; index < maxChunks; index = index + 1) {
    yield readChunk(stream, chunkSize);
  }
}

export async function readText(stream, chunkSize, maxChunks) {
  var text = "";
  var iterator = chunks(stream, chunkSize, maxChunks);
  var next = nextChunk(iterator);
  while (next !== null) {
    var chunk = await next;
    if (length(chunk) === 0) {
      return text;
    }
    text = text + toUtf8(chunk);
    next = nextChunk(iterator);
  }
  return text;
}

export async function readAllBytes(stream, chunkSize) {
  var bytes = fromArray([]);
  while (true) {
    var chunk = await readChunk(stream, chunkSize);
    if (length(chunk) === 0) {
      return bytes;
    }
    bytes = concat(bytes, chunk);
  }
}

export async function collectBytes(stream, chunkSize, maxBytes) {
  if (maxBytes < 0) {
    throw "Jayess stream collectBytes maxBytes must be non-negative";
  }
  var bytes = fromArray([]);
  while (true) {
    var chunk = await readChunk(stream, chunkSize);
    if (length(chunk) === 0) {
      return bytes;
    }
    if (length(bytes) + length(chunk) > maxBytes) {
      throw "Jayess stream collectBytes exceeded maxBytes";
    }
    bytes = concat(bytes, chunk);
  }
}

export async function readAllText(stream, chunkSize) {
  return toUtf8(await readAllBytes(stream, chunkSize));
}

export async function toBytes(stream, chunkSize) {
  return readAllBytes(stream, chunkSize);
}

export async function toText(stream, chunkSize) {
  return readAllText(stream, chunkSize);
}

export async function collectText(stream, chunkSize, maxBytes) {
  return toUtf8(await collectBytes(stream, chunkSize, maxBytes));
}

export async function readLines(stream, chunkSize) {
  return split(await readAllText(stream, chunkSize), "\n");
}

export function writeText(stream, text) {
  return writeChunk(stream, fromUtf8(text));
}

export function writeLine(stream, text) {
  return writeText(stream, text + "\n");
}

export async function pipeText(readStream, writeStream, chunkSize) {
  return writeText(writeStream, await readAllText(readStream, chunkSize));
}
