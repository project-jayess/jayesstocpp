import { rgb } from "jayess:color";
import
{
  create as createCanvas,
  createHtmlDocument,
  drawHtml,
  hitTestHtml,
  layoutHtml
} from "jayess:canvas";
import
{
  close,
  create as createWindow,
  pollEvents,
  present,
  setTitle,
  shouldClose,
  show
} from "jayess:window";
import { writeLine } from "jayess:console";
import { sleep } from "jayess:thread";
import { elapsed, formatDuration, millis } from "jayess:time";

function writeTiming(label, start)
{
  writeLine(label + formatDuration(elapsed(start)));
}

function renderDocument(canvas, start)
{
  var html = "<div><button id=\"ok\">Window Probe</button><p>System font requested: abc xyz 123 !? @#$%</p><p>Jayess fallback covers lowercase and symbols: hello_world (ok).</p></div>";
  var css = "div { width: 100%; height: 100%; background-color: #102030; border-width: 3; border-color: #00ffcc; padding: 28; font-family: jayess-default-5x7; } button { background-color: #ffffff; color: #000000; width: 220; height: 44; margin: 8; padding: 8; font-size: 18; line-height: 24; } p { color: #ffffff; font-size: 18; line-height: 32; width: 780; margin: 18; padding: 4; }";
  var document = createHtmlDocument(html, css, null);
  writeTiming("startup: html/css parsed after ", start);
  layoutHtml(document, { x: 0, y: 0, width: 960, height: 540 });
  writeTiming("startup: html laid out after ", start);
  drawHtml(canvas, document);
  writeTiming("startup: html painted after ", start);
  return document;
}

function handleEvents(document, events)
{
  for (var index = 0; index < events.length; index = index + 1)
  {
    var event = events[index];
    if (event.type === "mouseUp" && event.button === "left")
    {
      var hit = hitTestHtml(document, event.x, event.y);
      if (hit.targetId !== null)
      {
        writeLine("Clicked " + hit.role + " #" + hit.targetId);
      }
    }
  }
}

export function main()
{
  var start = millis();
  writeLine("startup: begin");

  var canvas = createCanvas(960, 540, {
    background: rgb(8, 12, 18),
    title: "Jayess Canvas HTML"
  });
  writeTiming("startup: canvas created after ", start);

  var window = createWindow({
    title: "Jayess Canvas HTML",
    width: 960,
    height: 540
  });
  writeTiming("startup: window created after ", start);

  show(window);
  setTitle(window, "Jayess Canvas + Window");
  writeTiming("startup: window shown after ", start);

  var document = renderDocument(canvas, start);
  writeTiming("startup: html rendered after ", start);

  present(window, canvas);
  writeTiming("startup: first present after ", start);

  writeLine("Window is open. Use the native close button to exit.");
  while (!shouldClose(window))
  {
    handleEvents(document, pollEvents(window));
    present(window, canvas);
    sleep(16);
  }

  close(window);
  writeLine("Window closed.");
  return 0;
}
