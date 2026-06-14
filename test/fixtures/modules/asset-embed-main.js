import { packCss, packHtml } from "jayess:canvas";

export function inspectEmbeddedAssets() {
  return [
    packHtml("./asset-embed.html"),
    packCss("./asset-embed.css")
  ];
}
