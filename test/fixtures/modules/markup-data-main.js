import { toHtml, tokenize } from "jayess:markdown";
import { parse as parseXml, stringify as stringifyXml } from "jayess:xml";
import { parse as parseYaml, stringify as stringifyYaml } from "jayess:yaml";

export function run() {
  var xml = parseXml("<note priority=\"high\"><title>Jayess</title><body>Native C++</body></note>");
  var xmlAttributes = {};
  xmlAttributes["from"] = "jayess";
  var xmlText = stringifyXml({
    name: "message",
    attributes: xmlAttributes,
    children: [{ text: "Hello <native>" }]
  });
  var config = parseYaml("package:\n  name: jayess\n  active: true\n  count: 3\n  tags: [native, cpp]");
  var packageConfig = { name: "jayess", active: true, count: 3 };
  var yamlData = {};
  yamlData["package"] = packageConfig;
  var yamlText = stringifyYaml(yamlData);
  var markdownTokens = tokenize("# Jayess\n\n- native\n- c++\n\n```js\nvar name = \"Jayess\";\n```");
  var html = toHtml("# Jayess\n\nBuild [native](https://example.test) tools.\n\n- fast\n- portable");
  return [
    xml.name,
    xml.attributes.priority,
    xml.children[0].name,
    xml.children[1].children[0].text,
    xmlText,
    config["package"].name,
    config["package"].active,
    config["package"].count,
    config["package"].tags[1],
    yamlText.includes("active: true"),
    markdownTokens[0].type,
    markdownTokens[0].level,
    markdownTokens[3].type,
    html.includes("<h1>Jayess</h1>"),
    html.includes("<a href=\"https://example.test\">native</a>"),
    html.includes("<ul>")
  ];
}

export function invalidXml() {
  return parseXml("<root><child></root>");
}

export function invalidYaml() {
  return parseYaml("bad line");
}

export function invalidMarkdown() {
  return toHtml("```js\nvar broken = true;");
}
