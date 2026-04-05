// utils/photo/photoUriConverter.js
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';

/**
 * iOS: ph:// → file:// (사진/영상 구분)
 */
export async function convertPhUriToFileUri(phUri, index, isVideo = false) {
  const ext = isVideo ? 'mp4' : 'jpg';
  const destPath = `${RNFS.TemporaryDirectoryPath}/asset_${Date.now()}_${index}.${ext}`;

  try {
    if (isVideo) {
 // 영상 변환
      await RNFS.copyAssetsVideoIOS(phUri, destPath);
    } else {
 // 사진 변환
      await RNFS.copyAssetsFileIOS(phUri, destPath, 0, 0);
    }
    return 'file://' + destPath;
  } catch (err) {
    return null;
  }
}

/**
 * Android: content:// → file:// 변환
 */
export async function convertContentUriToFileUri(
  contentUri,
  index,
  isVideo = false,
) {
  if (Platform.OS !== 'android' || !contentUri.startsWith('content://')) {
    return contentUri;
  }

  const ext = isVideo ? 'mp4' : 'jpg';
  const destPath = `${RNFS.TemporaryDirectoryPath}/asset_${Date.now()}_${index}.${ext}`;

  try {
    await RNFS.copyFile(contentUri, destPath);
    return 'file://' + destPath;
  } catch (err) {
    return null;
  }
}
