import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import {requestMediaPermission} from './permissions';

export async function loadGalleryPhotos(after = null, pageSize = 60) {
  const hasPermission = await requestMediaPermission();
  if (!hasPermission) return {photos: [], endCursor: null, hasNextPage: false};

  const res = await CameraRoll.getPhotos({
    first: pageSize,
    assetType: 'Photos',
    ...(after ? {after} : {}),
  });

  const photoData = res.edges.map(edge => edge.node.image);
  return {
    photos: photoData,
    endCursor: res.page_info?.end_cursor ?? null,
    hasNextPage: !!res.page_info?.has_next_page,
  };
}
