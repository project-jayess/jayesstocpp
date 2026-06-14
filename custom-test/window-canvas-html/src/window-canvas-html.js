import { htmlRenderer, runHtmlRenderer } from "jayess:gui/html-renderer";
import { packCss, packHtml } from "jayess:canvas";
import { rgb } from "jayess:color";
import { writeLine } from "jayess:console";

export function main()
{
  writeLine("startup: begin");
  var renderer = htmlRenderer({
    title: "Jayess Canvas + Window",
    width: 960,
    height: 540,
    background: rgb(8, 12, 18),
    html: packHtml("./window-canvas-html.html"),
    css: packCss("./window-canvas-html.css")
  });
  writeLine("Window is open. Use the native close button to exit.");
  return runHtmlRenderer(renderer);
}
