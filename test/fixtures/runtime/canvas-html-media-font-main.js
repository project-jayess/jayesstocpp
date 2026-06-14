import { createHtmlDocument, layoutHtml } from "jayess:canvas";

export function inspectMediaFontBreakpoint() {
  var document = createHtmlDocument(
    "<div><p id=\"message\">Breakpoint</p></div>",
    "p { width: 80; font-size: 14px; line-height: 20px; } @media (min-width: 720px) { p { width: 120px; font-size: 20px; line-height: 32px; } } @media (max-width: 719px) { p { width: 40px; font-size: 12px; line-height: 16px; } }",
    null
  );
  layoutHtml(document, { x: 0, y: 0, width: 800, height: 80 });
  var wide = document.tree.children[0].children[0];
  var wideWidth = wide.layout.width;
  var wideFontSize = wide.layout.fontSize;
  var wideLineHeight = wide.layout.lineHeight;
  layoutHtml(document, { x: 0, y: 0, width: 600, height: 80 });
  var narrow = document.tree.children[0].children[0];
  return [
    document.stylesheet.rules.length,
    wideWidth,
    wideFontSize,
    wideLineHeight,
    narrow.layout.width,
    narrow.layout.fontSize,
    narrow.layout.lineHeight
  ];
}
