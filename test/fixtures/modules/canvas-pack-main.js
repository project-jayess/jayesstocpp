import { getPixel as getCanvasPixel, packImage, packXml, renderScene } from "jayess:canvas";
import { getPixel as getImagePixel } from "jayess:image";

export function packedAssets() {
  var xml = packXml("./packed-scene.xml");
  var image = packImage("./packed-icon.png");
  var canvas = renderScene(xml, {
    images: {
      icon: image
    }
  });
  return [xml, getImagePixel(image, 0, 0), getCanvasPixel(canvas, 1, 1)];
}
