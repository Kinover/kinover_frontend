// utils/normalizeImageforSave.js

const CLOUD_FRONT = 'https://dzqa9jgkeds0b.cloudfront.net/';

export function normalizeImageForSave(rawImg) {
  if (!rawImg) return '';

  const trimmed = rawImg.trim();

  // 1) 카카오 URL은 그대로 저장
  if (trimmed.startsWith('https://k.kakao')) {
    return trimmed;
  }

  // 2) CloudFront + 카카오 URL (예전에 꼬여서 저장된 케이스 복구)
  if (trimmed.startsWith(CLOUD_FRONT + 'https://k.kakao')) {
    return trimmed.slice(CLOUD_FRONT.length);
  }

  // 3) CloudFront + key -> key만 저장
  if (trimmed.startsWith(CLOUD_FRONT)) {
    return trimmed.slice(CLOUD_FRONT.length);
  }

  // 4) 이미 key이거나, 다른 http URL인 경우 그대로
  return trimmed;
}
