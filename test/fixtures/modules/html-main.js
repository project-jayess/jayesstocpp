import { escapeAttribute, escapeText, fragment, tag } from "jayess:html";

export function run() {
  var text = escapeText("Jayess <native> & C++");
  var attr = escapeAttribute("\"quoted\" & 'single'");
  var linkAttributes = { href: "/docs?q=Jayess & C++" };
  linkAttributes["class"] = "nav-link";
  var link = tag("a", linkAttributes, [escapeText("Read <docs>")]);
  var page = tag("section", { id: "intro" }, [
    tag("h1", {}, [escapeText("Jayess")]),
    tag("p", {}, [escapeText("Native <C++>")])
  ]);
  return [
    text,
    attr,
    fragment(["a", "b", "c"]),
    link,
    page
  ];
}

export function invalidTag() {
  return tag("bad name", {}, []);
}

export function invalidAttribute() {
  var attributes = {};
  attributes["bad name"] = "value";
  return tag("p", attributes, []);
}

export function invalidChild() {
  return fragment([null]);
}
