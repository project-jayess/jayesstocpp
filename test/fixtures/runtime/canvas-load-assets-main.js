import { loadCss, loadHtml } from "jayess:canvas";

export function inspectRuntimeAssets(htmlPath, cssPath) {
  return [
    loadHtml(htmlPath),
    loadCss(cssPath)
  ];
}
