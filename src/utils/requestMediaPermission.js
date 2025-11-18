import {PermissionsAndroid, Platform} from 'react-native';

export async function requestMediaPermission() {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      Platform.Version >= 33
        ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
}
