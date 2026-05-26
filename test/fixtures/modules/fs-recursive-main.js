import {
  copyRecursiveSync,
  createDirectoriesSync,
  existsSync,
  readTextSync,
  removeRecursiveSync,
  walkSync,
  writeTextSync
} from "jayess:fs";

export function run(root) {
  var source = root + "/source";
  var child = source + "/child.txt";
  var target = root + "/target";

  createDirectoriesSync(source);
  writeTextSync(child, "recursive");

  var walked = walkSync(source);
  copyRecursiveSync(source, target);
  var copiedText = readTextSync(target + "/child.txt");
  var removed = removeRecursiveSync(source);

  return [
    walked.length,
    walked[0].relativePath,
    walked[0].type,
    copiedText,
    removed,
    existsSync(source)
  ];
}

export function copyIntoSource(root) {
  var source = root + "/inside-source";
  createDirectoriesSync(source);
  writeTextSync(source + "/child.txt", "child");
  copyRecursiveSync(source, source + "/copy");
}

export function walkWithUnsupportedOptions(root) {
  walkSync(root, { recursive: true });
}

export function walkEmptyPath() {
  walkSync("");
}
