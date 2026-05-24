import { get, load, loadJsonSync, loadSync, merge, requireKey } from "jayess:config";

export async function run(root) {
  var json = await load(root + "/settings.json");
  var toml = await load(root + "/settings.toml");
  var combined = merge(json, { mode: toml.package.name });
  return [
    get(combined, "name", "missing"),
    requireKey(combined, "mode")
  ];
}

export function runSync(root) {
  var json = loadJsonSync(root + "/settings.json");
  var dotenv = loadSync(root + "/settings.env");
  var combined = merge(json, dotenv);
  return [
    requireKey(combined, "name"),
    get(combined, "MODE", "missing")
  ];
}
