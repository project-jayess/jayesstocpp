import { join } from "jayess:array";
import { includes, replaceAll, slice, split } from "jayess:string";

function pushCell(row, cell) {
  row.push(cell);
  return "";
}

export function parse(text) {
  var rows = [];
  var row = [];
  var cell = "";
  var quoted = false;
  var index = 0;
  while (index < text.length) {
    var current = slice(text, index, index + 1);
    var next = slice(text, index + 1, index + 2);
    if (quoted && current === "\"" && next === "\"") {
      cell = cell + "\"";
      index = index + 2;
    } else if (current === "\"") {
      quoted = !quoted;
      index = index + 1;
    } else if (!quoted && current === ",") {
      cell = pushCell(row, cell);
      index = index + 1;
    } else if (!quoted && current === "\n") {
      cell = pushCell(row, cell);
      rows.push(row);
      row = [];
      index = index + 1;
    } else if (!quoted && current === "\r") {
      index = index + 1;
    } else {
      cell = cell + current;
      index = index + 1;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    cell = pushCell(row, cell);
    rows.push(row);
  }
  return rows;
}

function quoteCell(value) {
  if (includes(value, "\"") || includes(value, ",") || includes(value, "\n")) {
    return "\"" + replaceAll(value, "\"", "\"\"") + "\"";
  }
  return value;
}

export function stringify(rows) {
  var lines = [];
  for (var rowIndex = 0; rowIndex < rows.length; rowIndex = rowIndex + 1) {
    var row = rows[rowIndex];
    var cells = [];
    for (var cellIndex = 0; cellIndex < row.length; cellIndex = cellIndex + 1) {
      cells.push(quoteCell(row[cellIndex]));
    }
    lines.push(join(cells, ","));
  }
  return join(lines, "\n");
}
