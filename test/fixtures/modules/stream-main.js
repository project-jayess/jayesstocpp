import { createReadStream, createWriteStream } from "jayess:fs";
import { streamSha256 } from "jayess:hash";
import { createCancellationToken } from "jayess:async";
import { close, collectBytes, collectText, copy, openRead, openWrite, pipe, pipeAll, pipeText, pipeWithCancellation, readAllText, readChunk, readLines, readText, tee, toBytes, toText, writeChunk, writeLine, writeText } from "jayess:stream";
import { concat, fromUtf8, toUtf8 } from "jayess:bytes";

export async function run(root) {
  var path = root + "/stream.txt";
  var writer = await openWrite(path);
  await writeChunk(writer, fromUtf8("Jay"));
  await writeChunk(writer, fromUtf8("ess"));
  await close(writer);

  var reader = await openRead(path);
  var first = await readChunk(reader, 3);
  var second = await readChunk(reader, 3);
  await close(reader);

  var copied = root + "/stream-copy.txt";
  await copy(path, copied, 2);
  var copiedReader = await openRead(copied);
  var copiedText = await readText(copiedReader, 2, 4);
  await close(copiedReader);

  var piped = root + "/stream-pipe.txt";
  var pipeReader = await openRead(path);
  var pipeWriter = await openWrite(piped);
  await pipe(pipeReader, pipeWriter, 2);
  await close(pipeReader);
  await close(pipeWriter);

  var allReader = await createReadStream(path);
  var allText = await readAllText(allReader, 2);
  await close(allReader);

  var hashReader = await createReadStream(path);
  var digest = await streamSha256(hashReader, 2);
  await close(hashReader);

  var fsWriter = await createWriteStream(root + "/fs-stream.txt");
  await writeChunk(fsWriter, fromUtf8("!"));
  await close(fsWriter);

  var textPath = root + "/stream-text.txt";
  var textWriter = await openWrite(textPath);
  await writeText(textWriter, "one");
  await writeLine(textWriter, "two");
  await close(textWriter);

  var textReader = await openRead(textPath);
  var lines = await readLines(textReader, 4);
  await close(textReader);

  var pipeTextPath = root + "/stream-pipe-text.txt";
  var pipeTextReader = await openRead(textPath);
  var pipeTextWriter = await openWrite(pipeTextPath);
  await pipeText(pipeTextReader, pipeTextWriter, 4);
  await close(pipeTextReader);
  await close(pipeTextWriter);

  var teeLeft = root + "/stream-tee-left.txt";
  var teeRight = root + "/stream-tee-right.txt";
  var teeReader = await openRead(path);
  var teeLeftWriter = await openWrite(teeLeft);
  var teeRightWriter = await openWrite(teeRight);
  await tee(teeReader, teeLeftWriter, teeRightWriter, 2);
  await close(teeReader);
  await close(teeLeftWriter);
  await close(teeRightWriter);

  var pipeAllLeft = root + "/stream-pipe-all-left.txt";
  var pipeAllRight = root + "/stream-pipe-all-right.txt";
  var pipeAllReaderOne = await openRead(path);
  var pipeAllWriterOne = await openWrite(pipeAllLeft);
  var pipeAllReaderTwo = await openRead(path);
  var pipeAllWriterTwo = await openWrite(pipeAllRight);
  await pipeAll([
    { read: pipeAllReaderOne, write: pipeAllWriterOne },
    { read: pipeAllReaderTwo, write: pipeAllWriterTwo }
  ], 2);
  await close(pipeAllReaderOne);
  await close(pipeAllWriterOne);
  await close(pipeAllReaderTwo);
  await close(pipeAllWriterTwo);

  var cancelReader = await openRead(path);
  var cancelWriter = await openWrite(root + "/stream-cancel-pipe.txt");
  await pipeWithCancellation(cancelReader, cancelWriter, 2, createCancellationToken());
  await close(cancelReader);
  await close(cancelWriter);

  var textPipeReader = await openRead(pipeTextPath);
  var textPipeValue = await readAllText(textPipeReader, 4);
  await close(textPipeReader);
  var teeLeftReader = await openRead(teeLeft);
  var teeLeftText = await readAllText(teeLeftReader, 2);
  await close(teeLeftReader);

  var collectReader = await openRead(path);
  var collectedText = await collectText(collectReader, 2, 16);
  await close(collectReader);

  var collectBytesReader = await openRead(path);
  var collectedBytes = await collectBytes(collectBytesReader, 2, 16);
  await close(collectBytesReader);

  var pipeAllReader = await openRead(pipeAllRight);
  var pipeAllText = await readAllText(pipeAllReader, 2);
  await close(pipeAllReader);

  var aliasTextReader = await openRead(path);
  var aliasText = await toText(aliasTextReader, 2);
  await close(aliasTextReader);
  var aliasBytesReader = await openRead(path);
  var aliasBytes = await toBytes(aliasBytesReader, 2);
  await close(aliasBytesReader);

  return [toUtf8(concat(first, second)), copiedText, allText, digest.length, lines[0], lines[1], textPipeValue, teeLeftText, collectedText, toUtf8(collectedBytes), pipeAllText, aliasText, toUtf8(aliasBytes)];
}
