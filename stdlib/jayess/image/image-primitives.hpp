#pragma once

#include "runtime/jayess_runtime.hpp"

inline jayess::value jayessImageCreate(const std::vector<jayess::value>& jayessArgs) {
  return jayess::image_create(
    jayess::argument_at(jayessArgs, 0),
    jayess::argument_at(jayessArgs, 1),
    jayess::argument_at(jayessArgs, 2)
  );
}

inline jayess::value jayessImageWidth(const std::vector<jayess::value>& jayessArgs) {
  return jayess::image_width(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessImageHeight(const std::vector<jayess::value>& jayessArgs) {
  return jayess::image_height(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessImageGetPixel(const std::vector<jayess::value>& jayessArgs) {
  return jayess::image_get_pixel(
    jayess::argument_at(jayessArgs, 0),
    jayess::argument_at(jayessArgs, 1),
    jayess::argument_at(jayessArgs, 2)
  );
}

inline jayess::value jayessImageSetPixel(const std::vector<jayess::value>& jayessArgs) {
  return jayess::image_set_pixel(
    jayess::argument_at(jayessArgs, 0),
    jayess::argument_at(jayessArgs, 1),
    jayess::argument_at(jayessArgs, 2),
    jayess::argument_at(jayessArgs, 3)
  );
}

inline jayess::value jayessImageFill(const std::vector<jayess::value>& jayessArgs) {
  return jayess::image_fill(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessImageCopy(const std::vector<jayess::value>& jayessArgs) {
  return jayess::image_copy(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessImageSavePpm(const std::vector<jayess::value>& jayessArgs) {
  return jayess::image_save_ppm(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessImageSaveBmp(const std::vector<jayess::value>& jayessArgs) {
  return jayess::image_save_bmp(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessImageSavePgm(const std::vector<jayess::value>& jayessArgs) {
  return jayess::image_save_pgm(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessImageSaveTga(const std::vector<jayess::value>& jayessArgs) {
  return jayess::image_save_tga(jayess::argument_at(jayessArgs, 0), jayess::argument_at(jayessArgs, 1));
}

inline jayess::value jayessImageLoadPpm(const std::vector<jayess::value>& jayessArgs) {
  return jayess::image_load_ppm(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessImageLoadBmp(const std::vector<jayess::value>& jayessArgs) {
  return jayess::image_load_bmp(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessImageLoadPgm(const std::vector<jayess::value>& jayessArgs) {
  return jayess::image_load_pgm(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessImageLoadTga(const std::vector<jayess::value>& jayessArgs) {
  return jayess::image_load_tga(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessImageMetadataFromFile(const std::vector<jayess::value>& jayessArgs) {
  return jayess::image_metadata_from_file(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessImageEncodePpm(const std::vector<jayess::value>& jayessArgs) {
  return jayess::image_encode_ppm(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessImageDecodePpm(const std::vector<jayess::value>& jayessArgs) {
  return jayess::image_decode_ppm(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessImageCrop(const std::vector<jayess::value>& jayessArgs) {
  return jayess::image_crop(
    jayess::argument_at(jayessArgs, 0),
    jayess::argument_at(jayessArgs, 1),
    jayess::argument_at(jayessArgs, 2),
    jayess::argument_at(jayessArgs, 3),
    jayess::argument_at(jayessArgs, 4)
  );
}

inline jayess::value jayessImageResizeNearest(const std::vector<jayess::value>& jayessArgs) {
  return jayess::image_resize_nearest(
    jayess::argument_at(jayessArgs, 0),
    jayess::argument_at(jayessArgs, 1),
    jayess::argument_at(jayessArgs, 2)
  );
}

inline jayess::value jayessImageBlit(const std::vector<jayess::value>& jayessArgs) {
  return jayess::image_blit(
    jayess::argument_at(jayessArgs, 0),
    jayess::argument_at(jayessArgs, 1),
    jayess::argument_at(jayessArgs, 2),
    jayess::argument_at(jayessArgs, 3)
  );
}

inline jayess::value jayessImageFlipHorizontal(const std::vector<jayess::value>& jayessArgs) {
  return jayess::image_flip_horizontal(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessImageFlipVertical(const std::vector<jayess::value>& jayessArgs) {
  return jayess::image_flip_vertical(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessImageRotate90(const std::vector<jayess::value>& jayessArgs) {
  return jayess::image_rotate_90(jayess::argument_at(jayessArgs, 0));
}

inline jayess::value jayessImageTransparentBlit(const std::vector<jayess::value>& jayessArgs) {
  return jayess::image_transparent_blit(
    jayess::argument_at(jayessArgs, 0),
    jayess::argument_at(jayessArgs, 1),
    jayess::argument_at(jayessArgs, 2),
    jayess::argument_at(jayessArgs, 3)
  );
}

inline jayess::value jayessImageIsImage(const std::vector<jayess::value>& jayessArgs) {
  return jayess::is_image_value(jayess::argument_at(jayessArgs, 0));
}
