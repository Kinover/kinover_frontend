// utils/photo/gallery.js
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import {requestMediaPermission} from './requestMediaPermission';
import uuid from 'react-native-uuid';

// 📸 사진만 로드
export async function loadGalleryPhotos(after = null, pageSize = 60) {
  const hasPermission = await requestMediaPermission();
  if (!hasPermission) {
    return {photos: [], endCursor: null, hasNextPage: false};
  }

  const res = await CameraRoll.getPhotos({
    first: pageSize,
    assetType: 'Photos', // ✅ 사진만
    ...(after ? {after} : {}),
  });

  const photoData = res.edges.map(edge => {
    const {image, type} = edge.node;

    return {
      uri: image.uri,
      type,          // 필요 없으면 이것도 제거 가능
      isVideo: false, // 사진만 사용
      duration: 0,    // 영상 길이 안 씀
    };
  });

  return {
    photos: photoData,
    endCursor: res.page_info?.end_cursor ?? null,
    hasNextPage: !!res.page_info?.has_next_page,
  };
}

// 📂 파일 확장자 자동 맞추기
export function getFileNameWithExtension(file, index) {
  if (!file?.uri) return `${uuid.v4()}_${index}.jpg`;

  let extension = 'jpg';
  const lower = file.uri.toLowerCase();

  if (lower.endsWith('.png')) {
    extension = 'png';
  } else if (lower.endsWith('.jpeg')) {
    extension = 'jpeg';
  } else if (lower.endsWith('.jpg')) {
    extension = 'jpg';
  }

  return `${uuid.v4()}_${index}.${extension}`;
}
