// utils/photo/gallery.js
import {requestMediaPermission} from './requestMediaPermission';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';

import uuid from 'react-native-uuid';
export async function loadGalleryPhotos(after = null, pageSize = 60) {
  const hasPermission = await requestMediaPermission();
  if (!hasPermission) {
    return {photos: [], endCursor: null, hasNextPage: false};
  }

  const res = await CameraRoll.getPhotos({
    first: pageSize,
    assetType: 'All',
    ...(after ? {after} : {}),
  });

  const photoData = res.edges.map(edge => {
    const node = edge.node;
    const {image, type, timestamp} = node;

    const filename =
      image?.filename || node?.image?.filename || node?.filename || '';

    const durationSec =
      typeof node.duration === 'number'
        ? node.duration
        : typeof node.image?.playableDuration === 'number'
        ? node.image.playableDuration
        : typeof node.playableDuration === 'number'
        ? node.playableDuration
        : 0;

    const typeLower = String(type || '').toLowerCase();
    const fileLower = String(filename || '').toLowerCase();

    const isVideo =
      typeLower.startsWith('video') ||
      durationSec > 0 ||
      fileLower.endsWith('.mp4') ||
      fileLower.endsWith('.mov');

    return {
      uri: image?.uri,
      type: type ?? (isVideo ? 'video/mp4' : 'image/jpeg'),
      isVideo,
      duration: durationSec,
      timestamp: timestamp ?? 0,
      filename,
    };
  });

  return {
    photos: photoData,
    endCursor: res.page_info?.end_cursor ?? null,
    hasNextPage: !!res.page_info?.has_next_page,
  };
}

// utils/photo/gallery.js

export function getFileNameWithExtension(file, index) {
  const id = uuid.v4();

  // ✅ 0) isVideo 최우선
  if (file?.isVideo) {
    const mime = String(file?.type || '').toLowerCase();
    if (mime.includes('quicktime') || mime.includes('mov')) {
      return `${id}_${index}.mov`;
    }
    return `${id}_${index}.mp4`;
  }

  const mime = String(file?.type || '').toLowerCase();
  if (mime === 'image/png') return `${id}_${index}.png`;
  if (mime === 'image/webp') return `${id}_${index}.webp`;
  if (mime === 'image/jpeg' || mime === 'image/jpg')
    return `${id}_${index}.jpg`;

  const uri = String(file?.uri || '').toLowerCase();
  if (uri.endsWith('.png')) return `${id}_${index}.png`;
  if (uri.endsWith('.webp')) return `${id}_${index}.webp`;
  if (uri.endsWith('.jpeg')) return `${id}_${index}.jpeg`;
  if (uri.endsWith('.jpg')) return `${id}_${index}.jpg`;

  return `${id}_${index}.jpg`;
}
