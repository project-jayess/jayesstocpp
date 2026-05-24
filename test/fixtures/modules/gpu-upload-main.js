import { rgb } from "jayess:color";
import { create as createImage, fillRect } from "jayess:image";
import { createDevice, createTexture, uploadImage } from "jayess:gpu";

export function uploadIntoTexture() {
  var device = createDevice({ backend: "validation" });
  var texture = createTexture(device, { width: 2, height: 1 });
  var image = createImage(2, 1, rgb(0, 0, 0));
  fillRect(image, 1, 0, 1, 1, rgb(9, 8, 7));
  uploadImage(texture, image);
  return true;
}

export function uploadWithWrongSize() {
  var device = createDevice({ backend: "validation" });
  var texture = createTexture(device, { width: 2, height: 2 });
  var image = createImage(1, 1, rgb(1, 2, 3));
  return uploadImage(texture, image);
}

export function uploadWithWrongInput() {
  var device = createDevice({ backend: "validation" });
  var texture = createTexture(device, { width: 1, height: 1 });
  return uploadImage(texture, "bad");
}
