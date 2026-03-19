export const inferContentTypeByName = fileName => {
  const lower = String(fileName || '').toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.mov')) return 'video/quicktime';
  return 'application/octet-stream';
};

export const getExtFromUri = uri => {
  try {
    const clean = String(uri || '').split('?')[0];
    const ext = clean.split('.').pop()?.toLowerCase();
    if (!ext || ext.includes('/') || ext.length > 6) return null;
    return ext;
  } catch {
    return null;
  }
};

export const stripFileScheme = uri =>
  String(uri || '').startsWith('file://')
    ? String(uri).replace('file://', '')
    : String(uri);
