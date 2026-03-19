/** content:// 또는 ph:// URI에서 마지막 경로 세그먼트(보통 스테이블 ID) 추출 */
function getStableUriId(uri) {
  if (!uri || typeof uri !== 'string') return '';
  const s = uri.trim();
  const last = s.split('/').filter(Boolean).pop() || '';
  const num = last.replace(/\D/g, '');
  return num ? num : last || s;
}

/** 같은 에셋인지 (URI가 다르게 올 수 있어서 timestamp+filename, 또는 URI 스테이블 ID로 비교) */
export function isSameAsset(a, b) {
  if (!a || !b) return false;
  if (a.uri && b.uri && a.uri === b.uri) return true;
  const at = a.timestamp;
  const bt = b.timestamp;
  const af = String(a.filename ?? '');
  const bf = String(b.filename ?? '');
  if (
    at != null &&
    bt != null &&
    Number(at) === Number(bt) &&
    af === bf
  ) {
    return true;
  }
  if (a.uri && b.uri && getStableUriId(a.uri) && getStableUriId(a.uri) === getStableUriId(b.uri)) {
    return true;
  }
  return false;
}

export function toggleSelectImage(selectedImages, item) {
  const exists = selectedImages.find(img => isSameAsset(img, item));
  if (exists) {
    return selectedImages.filter(img => !isSameAsset(img, item));
  }
  const withoutSame = selectedImages.filter(img => !isSameAsset(img, item));
  return [...withoutSame, item];
}

export function getSelectOrder(selectedImages, itemOrUri) {
  const item =
    typeof itemOrUri === 'string' ? {uri: itemOrUri} : itemOrUri;
  const idx = selectedImages.findIndex(img => isSameAsset(img, item));
  return idx === -1 ? null : idx + 1;
}

