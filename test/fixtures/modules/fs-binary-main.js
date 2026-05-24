import { fromUtf8, toUtf8 } from "jayess:bytes";
import { appendTextSync, copySync, readBytesSync, readTextSync, writeBytesSync, writeTextSync } from "jayess:fs";

export function run(root) {
  var source = root + "/data.bin";
  var text = root + "/data.txt";
  var copied = root + "/copy.bin";
  writeBytesSync(source, fromUtf8("Jayess"));
  copySync(source, copied);
  writeTextSync(text, "Jay");
  appendTextSync(text, "ess");
  return toUtf8(readBytesSync(copied)) + readTextSync(text);
}
