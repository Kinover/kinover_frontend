const CLOUDFRONT_DOMAIN = 'dzqa9jgkeds0b.cloudfront.net';

const trim = v => String(v ?? '').trim();

export function normalizeImageForSave(value) {
  const raw = trim(value);
  if (!raw) return '';

  const withoutQuery = raw.split('?')[0];

  if (/^file:\/\//i.test(withoutQuery)) {
    return '';
  }

  if (/^https?:\/\//i.test(withoutQuery)) {
    const m = withoutQuery.match(/^https?:\/\/([^/]+)\/?(.*)$/i);
    const host = String(m?.[1] || '').toLowerCase();
    const path = String(m?.[2] || '').replace(/^\/+/, '');
    if (host.includes(CLOUDFRONT_DOMAIN) && path) return path;
    return withoutQuery;
  }

  return withoutQuery.replace(/^\/+/, '');
}
