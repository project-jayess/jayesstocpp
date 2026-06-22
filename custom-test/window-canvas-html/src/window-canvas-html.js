import {
  closeHtmlRenderer,
  drainHtmlRendererActions,
  htmlRenderer,
  shouldCloseHtmlRenderer,
  showHtmlRenderer,
  updateHtmlRenderer
} from "jayess:gui/html-renderer";
import { packCss, packHtml } from "jayess:canvas";
import { rgb } from "jayess:color";
import { writeLine } from "jayess:console";
import { sleep } from "jayess:thread";

function reportActions(renderer) {
  var actions = drainHtmlRendererActions(renderer);
  for (var index = 0; index < actions.length; index = index + 1) {
    var action = actions[index];
    if (action.type === "htmlClick") {
      writeLine("clicked: " + action.targetId);
    }
  }
  return renderer;
}

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
  showHtmlRenderer(renderer);
  while (!shouldCloseHtmlRenderer(renderer)) {
    updateHtmlRenderer(renderer);
    reportActions(renderer);
    sleep(16);
  }
  closeHtmlRenderer(renderer);
  return 0;
}
