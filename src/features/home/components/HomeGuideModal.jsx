// src/features/home/components/HomeGuideModal.jsx
import React, {useCallback, useEffect, useRef, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import HomeGuideVisual from './HomeGuideVisual';
import GuideModalCarousel from 'components/modal/GuideModal';

// ✅ 홈 전용 저장 키
const KEY_HOME_GUIDE_SHOWN = '@kinover/guide/home_v1_shown';

const steps = [
  {
    key: 'status',
    title: '접속 상태 확인',
    description: '프로필 옆 점으로 접속 상태를 확인할 수 있어요.',
    visualHeight: 220,
    renderVisual: () => <HomeGuideVisual variant="status" />,
  },
  {
    key: 'edit',
    title: '프로필 편집',
    description: '프로필을 눌러 이름/특징을 편집할 수 있어요.',
    visualHeight: 220,
    renderVisual: () => <HomeGuideVisual variant="edit" />,
  },
  {
    key: 'invite',
    title: '가족 초대',
    description: '가족 코드를 공유해서 구성원을 초대할 수 있어요.',
    visualHeight: 220,
    renderVisual: () => <HomeGuideVisual variant="invite" />,
  },
];

export default function HomeGuideModal({
  enabled = true,
  forceVisible = false,
  ready = true,
  storageKey = KEY_HOME_GUIDE_SHOWN,
}) {
  const [visible, setVisible] = useState(false);
  const checkingRef = useRef(false);

  const rememberAndClose = useCallback(async () => {
    setVisible(false);
    try {
      await AsyncStorage.setItem(storageKey, '1');
    } catch (e) {null}
  }, [storageKey]);

  useEffect(() => {
    if (!enabled) return;
    if (!ready) return;
    if (checkingRef.current) return;

    checkingRef.current = true;

    (async () => {
      try {
        if (forceVisible) {
          setVisible(true);
          return;
        }
        const shown = await AsyncStorage.getItem(storageKey);
        if (shown !== '1') requestAnimationFrame(() => setVisible(true));
      } catch (e) {
        requestAnimationFrame(() => setVisible(true));
      } finally {
        checkingRef.current = false;
      }
    })();
  }, [enabled, ready, forceVisible, storageKey]);

  if (!enabled) return null;

  return (
    <GuideModalCarousel
      visible={visible}
      steps={steps}
      secondaryText="다시 보지 않기"
      onSecondaryPress={rememberAndClose}
      onRequestClose={rememberAndClose}
      onDone={rememberAndClose} // ✅ 캐러셀 마지막 완료 콜백(GuideModalCarousel에 구현 필요)
    />
  );
}
