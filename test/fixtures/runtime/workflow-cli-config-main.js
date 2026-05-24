import { flag, option, parse, positional } from "jayess:cli";
import { loadJsonSync } from "jayess:config";
import { readTextSync, writeTextSync } from "jayess:fs";
import { join } from "jayess:path";

export function run(root) {
  var configPath = join(root, "workflow-config.json");
  var outputPath = join(root, "workflow-output.txt");
  var parsed = parse(["--config", configPath, "--output", outputPath, "-v", "input.txt"]);
  var config = loadJsonSync(option(parsed, "config", configPath));
  var text = config.name + ":" + config.mode + ":" + positional(parsed, 0, "missing") + ":" + flag(parsed, "v");
  writeTextSync(option(parsed, "output", outputPath), text);
  return readTextSync(outputPath);
}
