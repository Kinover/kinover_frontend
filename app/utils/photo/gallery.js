// utils/photo/gallery.js
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { requestMediaPermission } from './permissions';
import { createThumbnail } from 'react-native-create-thumbnail';
import { Platform } from 'react-native';
import {
  convertPhUriToFileUri,
  convertContentUriToFileUri,
} from './photoUriConverter';

// 🎥 영상 duration 추출 함수
export async function getVideoDuration(uri, playableDuration) {
  try {
    console.log('🎥 getVideoDuration 호출됨:', uri);

    if (Platform.OS === 'ios') {
      if (playableDuration && playableDuration > 0) {
        console.log('✅ CameraRoll playableDuration 사용:', playableDuration);
        return Math.floor(playableDuration);
      }
    }

    const result = await createThumbnail({ url: uri });
    console.log('📦 createThumbnail 반환값:', result);

    const seconds = result.duration ? Math.floor(result.duration / 1000) : 0;
    console.log('⏱ 최종 duration(초):', seconds);

    return seconds;
  } catch (e) {
    console.error('❌ duration 추출 실패:', e.message, uri);
    return 0;
  }
}

export async function loadGalleryPhotos(after = null, pageSize = 60) {
  const hasPermission = await requestMediaPermission();
  if (!hasPermission) {
    return { photos: [], endCursor: null, hasNextPage: false };
  }

  const res = await CameraRoll.getPhotos({
    first: pageSize,
    assetType: 'All',
    ...(after ? { after } : {}),
  });

  const photoData = await Promise.all(
    res.edges.map(async (edge, index) => {
      console.log('🎬 edge.node:', edge.node);

      const { image, type } = edge.node;
      let duration = 0;
      let fileUri = image.uri;

      if (type.startsWith('video')) {
        if (Platform.OS === 'ios') {
          // iOS → playableDuration 우선
          if (image.playableDuration && image.playableDuration > 0) {
            console.log(
              `✅ [iOS] playableDuration 사용: ${image.playableDuration}s (index=${index})`,
            );
            duration = Math.floor(image.playableDuration);
          } else {
            if (fileUri.startsWith('ph://')) {
              fileUri = await convertPhUriToFileUri(fileUri, index, true);
            }
            if (fileUri) {
              const cleanUri = normalizeUri(fileUri);
              duration = await getVideoDuration(cleanUri);
            }
          }
        } else {
          // Android → 썸네일로 duration 추출
          if (fileUri.startsWith('content://')) {
            fileUri = await convertContentUriToFileUri(fileUri, index, true);
          }
          duration = await getVideoDuration(fileUri);
        }
      }

      return {
        ...image,
        type,
        isVideo: type.startsWith('video'),
        duration,
      };
    }),
  );

  return {
    photos: photoData,
    endCursor: res.page_info?.end_cursor ?? null,
    hasNextPage: !!res.page_info?.has_next_page,
  };
}

function normalizeUri(uri) {
  return uri.split('#')[0];
}
