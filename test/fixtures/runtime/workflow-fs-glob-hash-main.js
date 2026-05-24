import { globSync } from "jayess:glob";
import { sha256TextFileSync } from "jayess:hash";
import { join } from "jayess:path";
import { endsWith } from "jayess:string";

export function run(root) {
  var matches = globSync(root, "**/*.txt");
  var alphaHash = "";
  var betaHash = "";
  for (var index = 0; index < matches.length; index = index + 1) {
    var current = matches[index];
    if (endsWith(current, "alpha.txt")) {
      alphaHash = sha256TextFileSync(join(root, current));
    }
    if (endsWith(current, "beta.txt")) {
      betaHash = sha256TextFileSync(join(root, current));
    }
  }
  return [matches.length, alphaHash.length, betaHash.length];
}
