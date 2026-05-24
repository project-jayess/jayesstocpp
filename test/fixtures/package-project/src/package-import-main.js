import { tool } from "#tools";
import { selectedSelf } from "#condition";
import { tool as patternTool } from "#features/tools";

export function run() {
  return tool() + selectedSelf + patternTool();
}
