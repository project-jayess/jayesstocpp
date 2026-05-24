import { parse as parseCsv, stringify as stringifyCsv } from "jayess:csv";
import { globSync, matches } from "jayess:glob";
import { parse as parseIni, stringify as stringifyIni } from "jayess:ini";
import { createDirectoriesSync, writeTextSync } from "jayess:fs";

export function run(root) {
  var csvRows = parseCsv("name,value\nalpha,\"one, two\"\nquote,\"a\"\"b\"");
  var csvText = stringifyCsv(csvRows);

  var ini = parseIni("[server]\nhost=localhost\nport=8080\n[client]\nname=jayess");
  var iniText = stringifyIni(ini);

  createDirectoriesSync(root + "/src/core");
  createDirectoriesSync(root + "/docs");
  writeTextSync(root + "/src/core/main.js", "main");
  writeTextSync(root + "/src/core/helper.txt", "helper");
  writeTextSync(root + "/docs/readme.md", "readme");
  var files = globSync(root, "src/**/*.js");

  return [
    csvRows[1][1],
    csvText,
    ini.server.host,
    iniText,
    matches("src/core/main.js", "src/**/*.js"),
    files.length
  ];
}
