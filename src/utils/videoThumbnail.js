// utils/videoThumbnail.js
import {Platform} from 'react-native';
import {createThumbnail} from 'react-native-create-thumbnail';

const thumbCache = new Map(); // key: uri, value: { uri, width, height } | null

const ensureAndroidFileScheme = p => {
  if (!p) return p;
  const s = String(p);
  if (s.startsWith('file://')) return s;
  return `file://${s}`;
};

export async function getVideoThumbnail(uri) {
  if (!uri) return null;

  const key = String(uri);
  if (thumbCache.has(key)) return thumbCache.get(key);

  try {
    const res = await createThumbnail({
      url: key, // 원격 URL 그대로
      timeStamp: 1000,
      format: 'jpeg',
      cacheName: `kino_thumb_${hash(key)}`,
    });

    const rawPath = res?.path || res?.uri || null;
    if (!rawPath) {
      thumbCache.set(key, null);
      return null;
    }

    const thumbUri =
      Platform.OS === 'android'
        ? ensureAndroidFileScheme(rawPath)
        : rawPath;

    const thumb = {
      uri: thumbUri,
      width: res?.width,
      height: res?.height,
    };

    thumbCache.set(key, thumb);
    return thumb;
  } catch (e) {
    thumbCache.set(key, null);
    return null;
  }
}

function hash(str) {
  const s = String(str || '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return String(Math.abs(h));
}
