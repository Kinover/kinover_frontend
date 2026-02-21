// utils/mediaUrl.js

const CLOUDFRONT_DOMAIN = 'https://dzqa9jgkeds0b.cloudfront.net';

const trimSlash = s => String(s || '').replace(/\/+$/, '');
const trimLeadingSlash = s => String(s || '').replace(/^\/+/, '');

/**
 * key 또는 이미 URL인 값을 받아
 * - URL이면 그대로 반환
 * - key면 CloudFront URL로 변환
 */
export const toCdnUrl = v => {
  if (!v) return null;

  const clean = String(v).split('?')[0];

  // 로컬 파일·이미지 URI 그대로 사용
  if (/^file:\/\//i.test(clean)) return v;
  // 이미 URL이면 그대로 사용 (카카오 프로필 등)
  if (/^https?:\/\//i.test(clean)) return clean;

  // key면 CloudFront로 조합
  return `${trimSlash(CLOUDFRONT_DOMAIN)}/${trimLeadingSlash(clean)}`;
};
