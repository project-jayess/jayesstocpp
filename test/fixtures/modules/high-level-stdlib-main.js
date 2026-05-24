import { flag, option, parse, positional } from "jayess:cli";
import { parse as parseDotenv, stringify as stringifyDotenv } from "jayess:dotenv";
import { sha256Text } from "jayess:hash";
import { isUuid, v4 } from "jayess:uuid";

export function run() {
  var parsed = parse(["--name=Jayess", "-v", "input.txt"]);
  var uuid = v4();
  var env = parseDotenv("NAME=Jayess\n# ignored\nMODE=native");
  return [
    option(parsed, "name", "missing"),
    flag(parsed, "v"),
    positional(parsed, 0, "none"),
    isUuid(uuid),
    uuid.length,
    sha256Text("abc"),
    env.NAME,
    env.MODE,
    stringifyDotenv({ A: "1", B: "2" }).includes("A=1")
  ];
}
