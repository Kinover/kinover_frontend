export function toggleSelectImage(selectedImages, item) {
  const exists = selectedImages.find(img => img.uri === item.uri);
  if (exists) {
    return selectedImages.filter(img => img.uri !== item.uri);
  } else {
    return [...selectedImages, item];
  }
}

export function getSelectOrder(selectedImages, uri) {
  const idx = selectedImages.findIndex(img => img.uri === uri);
  return idx === -1 ? null : idx + 1;
}