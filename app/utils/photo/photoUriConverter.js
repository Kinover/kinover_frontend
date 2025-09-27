import RNFS from 'react-native-fs';

export async function convertPhUriToFileUri(phUri, index) {
  const destPath = `${RNFS.TemporaryDirectoryPath}/photo_${Date.now()}_${index}.jpg`;
  try {
    await RNFS.copyAssetsFileIOS(phUri, destPath, 0, 0);
    return 'file://' + destPath;
  } catch (err) {
    console.error('📛 ph:// 변환 실패:', err.message);
    return null;
  }
}
