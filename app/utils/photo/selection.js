export function toggleSelectImage(selectedImages, uri) {
  if (selectedImages.includes(uri)) {
    return selectedImages.filter(img => img !== uri);
    
  } else {
    return [...selectedImages, uri];
  }
}

export function getSelectOrder(selectedImages, uri) {
  const idx = selectedImages.indexOf(uri);
  return idx === -1 ? null : idx + 1;
}
