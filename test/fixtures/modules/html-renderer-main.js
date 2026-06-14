import { htmlRenderer, drainHtmlRendererActions, reloadHtmlRenderer } from "jayess:gui/html-renderer";

export function createProbeRenderer() {
  return htmlRenderer({
    title: "Renderer Probe",
    width: 64,
    height: 32,
    html: "<div><button id=\"ok\">Reload</button><p>Hello</p></div>",
    css: [
      "div { width: 100%; height: 100%; background-color: #102030; padding: 4px; }",
      "button { width: 48px; height: 16px; }",
      "p { color: #ffffff; font-size: 8px; line-height: 10px; }"
    ]
  });
}

export function reloadProbeRenderer(renderer) {
  reloadHtmlRenderer(
    renderer,
    "<div><button id=\"ok\">Reloaded</button><p>Updated</p></div>",
    [
      "div { width: 100%; height: 100%; background-color: #203010; padding: 4px; }",
      "button { width: 52px; height: 16px; }",
      "p { color: #ffffff; font-size: 8px; line-height: 10px; }"
    ]
  );
  return drainHtmlRendererActions(renderer).length;
}
