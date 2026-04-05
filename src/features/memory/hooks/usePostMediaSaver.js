// src/features/post/hooks/usePostMediaSaver.js
import {useCallback, useState} from 'react';
import {Platform, PermissionsAndroid} from 'react-native';
import RNBlobUtil from 'react-native-blob-util';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';

/**
 * 갤러리 저장 로직만 전담
 * - PostPage는 saveOneToGallery(uri), saveAllToGallery(list) 호출만 하면 됨
 */
export default function usePostMediaSaver({toast}) {
  const [isOptionBusy, setIsOptionBusy] = useState(false);

  const ensureAndroidSavePermission = useCallback(async () => {
    if (Platform.OS !== 'android') return true;

    try {
      if (Platform.Version >= 33) {
        const r1 = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        );

        let r2 = PermissionsAndroid.RESULTS.GRANTED;
        try {
          r2 = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
          );
        } catch {
          r2 = PermissionsAndroid.RESULTS.GRANTED;
        }

        return (
          r1 === PermissionsAndroid.RESULTS.GRANTED &&
          r2 === PermissionsAndroid.RESULTS.GRANTED
        );
      }

      const r = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      );
      return r === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return true;
    }
  }, []);

  const inferExt = useCallback(uri => {
    try {
      const clean = String(uri || '').split('?')[0];
      const ext = clean.split('.').pop()?.toLowerCase();
      if (!ext || ext.includes('/') || ext.length > 6) return 'jpg';
      if (ext === 'jpeg') return 'jpg';
      return ext;
    } catch {
      return 'jpg';
    }
  }, []);

  const downloadToLocalFile = useCallback(async (urlOrUri, extGuess = 'jpg') => {
    const src = String(urlOrUri || '');
    if (!src) throw new Error('empty uri');

 // 이미 로컬 파일이면 그대로 사용
    if (src.startsWith('file://')) return src.replace('file://', '');

    const safeExt = extGuess || 'jpg';
    const dest = `${RNBlobUtil.fs.dirs.CacheDir}/kino_save_${Date.now()}_${Math.random()
      .toString(16)
      .slice(2)}.${safeExt}`;

    const res = await RNBlobUtil.config({path: dest, fileCache: true}).fetch(
      'GET',
      src,
    );

    const p = res?.path?.() || dest;
    const exists = await RNBlobUtil.fs.exists(p);
    if (!exists) throw new Error('download failed');
    return p;
  }, []);

  const saveOneToGallery = useCallback(
    async (uri, setBusyExternal) => {
      if (!uri) {
        toast?.('저장할 미디어가 없어요.');
        return;
      }
      if (!CameraRoll) {
        toast?.('저장 기능을 쓰려면 CameraRoll 패키지가 필요해요.');
        return;
      }

      const okPerm = await ensureAndroidSavePermission();
      if (!okPerm) {
        toast?.('갤러리 저장 권한이 필요해요.');
        return;
      }

      setIsOptionBusy(true);
      setBusyExternal?.(true);

      try {
        const ext = inferExt(uri);
        const localPath = await downloadToLocalFile(uri, ext);

        const saved = await CameraRoll.save(`file://${localPath}`, {
          type: ext === 'mp4' || ext === 'mov' ? 'video' : 'photo',
        });

        if (saved) toast?.('갤러리에 저장했어요.');
        else toast?.('저장에 실패했어요.');
      } catch (e) {
        toast?.('저장 중 오류가 발생했어요.');
      } finally {
        setIsOptionBusy(false);
        setBusyExternal?.(false);
      }
    },
    [toast, ensureAndroidSavePermission, downloadToLocalFile, inferExt],
  );

  const saveAllToGallery = useCallback(
    async (allMediaUris, setBusyExternal) => {
      if (!CameraRoll) {
        toast?.('저장 기능을 쓰려면 CameraRoll 패키지가 필요해요.');
        return;
      }
      const list = Array.isArray(allMediaUris) ? allMediaUris.filter(Boolean) : [];
      if (!list.length) {
        toast?.('저장할 미디어가 없어요.');
        return;
      }

      const okPerm = await ensureAndroidSavePermission();
      if (!okPerm) {
        toast?.('갤러리 저장 권한이 필요해요.');
        return;
      }

      setIsOptionBusy(true);
      setBusyExternal?.(true);

      try {
        let okCount = 0;
        for (let i = 0; i < list.length; i++) {
          const uri = list[i];
          try {
            const ext = inferExt(uri);
            const localPath = await downloadToLocalFile(uri, ext);
 // eslint-disable-next-line no-await-in-loop
            const saved = await CameraRoll.save(`file://${localPath}`, {
              type: ext === 'mp4' || ext === 'mov' ? 'video' : 'photo',
            });
            if (saved) okCount += 1;
          } catch (e) {
          }
        }
        toast?.(`${okCount}개를 저장했어요`);
      } catch (e) {
        toast?.('전체 저장 중 오류가 발생했어요.');
      } finally {
        setIsOptionBusy(false);
        setBusyExternal?.(false);
      }
    },
    [toast, ensureAndroidSavePermission, downloadToLocalFile, inferExt],
  );

  return {
    isOptionBusy,
    setIsOptionBusy,
    saveOneToGallery,
    saveAllToGallery,
  };
}
