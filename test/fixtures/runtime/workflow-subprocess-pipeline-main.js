import { spawnPipeline } from "jayess:subprocess";
import { writeTextSync } from "jayess:fs";
import { join } from "jayess:path";
import { openReadSync, readText } from "jayess:stream";

export async function run(root) {
  var result = await spawnPipeline([
    { command: "printf", args: ["workflow"] },
    { command: "tr", args: ["a-z", "A-Z"] }
  ], { cwd: root });
  var outputPath = join(root, "pipeline.txt");
  writeTextSync(outputPath, result.stdout);
  var stream = openReadSync(outputPath);
  return [result.stdout, await readText(stream, 64, 2)];
}
