// utils/photo/gallery.js
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import {requestMediaPermission} from './permissions';

export async function loadGalleryPhotos(after = null, pageSize = 60) {
  const hasPermission = await requestMediaPermission();
  if (!hasPermission) return {photos: [], endCursor: null, hasNextPage: false};

  const res = await CameraRoll.getPhotos({
    first: pageSize,
    assetType: 'All',
    ...(after ? {after} : {}),
  });

  const photoData = res.edges.map(edge => {
    const {image, type, playableDuration} = edge.node;
    return {
      ...image,
      type,
      isVideo: type.startsWith('video'),
      duration: playableDuration,
    };
  });

  return {
    photos: photoData,
    endCursor: res.page_info?.end_cursor ?? null,
    hasNextPage: !!res.page_info?.has_next_page,
  };
}
