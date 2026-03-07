// src/features/home/components/HomeGuideModal.jsx
import React, {useCallback, useEffect} from 'react';
import {Platform, InteractionManager} from 'react-native';
import HomeGuideVisual from './HomeGuideVisual';
import useGuide from 'hooks/useGuide';
import {useGuideOverlay} from 'contexts/GuideOverlayContext';

const KEY_HOME_GUIDE_SHOWN = '@kinover/guide/home_v3_shown';

/** 행동 유도형: 실제 탭 화면 위 하이라이트 + 말풍선 */
const steps = [
  {
    key: 'family_status',
    title: '가족 프로필',
    description:
      '가족 프로필을 **한 번 콕 누르면** 감정 표현이 톡 올라와요.\n오늘 기분을 빠르게 확인해보세요.',
  },
  {
    key: 'family_edit',
    title: '프로필 편집',
    description:
      '가족 프로필을 **길게 누르면** 편집 바텀시트가 열려요.\n별명과 한 줄 소개를 수정할 수 있어요.',
  },
  {
    key: 'my_mood',
    title: '지금 내 기분',
    description: '**상단 이모티콘**을 눌러 지금 기분을 설정해보세요.\n가족이 내 상태를 알아줘요.',
  },
  {
    key: 'family_invite',
    title: '가족 초대',
    description: '**초대 버튼**을 눌러 코드를 복사한 뒤\n가족에게 공유해보세요.',
  },
];

export default function HomeGuideModal({
  enabled = true,
  ready = true,
  forceVisible = false,
  storageKey = KEY_HOME_GUIDE_SHOWN,
  onDone,
  onAfterClose,
  targetRefsByKey,
}) {
  const {visible, closeAndRemember} = useGuide(
    storageKey,
    enabled && ready,
    {forceVisible},
  );
  const {showGuide, hideGuide, setAnyGuideVisible} = useGuideOverlay() || {};

  const handleDone = useCallback(async () => {
    await closeAndRemember();
    onDone?.();
  }, [closeAndRemember, onDone]);

  useEffect(() => {
    if (Platform.OS !== 'android' || !setAnyGuideVisible) return;
    if (visible) setAnyGuideVisible(true);
    return () => setAnyGuideVisible(false);
  }, [visible, setAnyGuideVisible]);

  useEffect(() => {
    if (!showGuide || !hideGuide) return;
    if (visible) {
      const closeAndHide = () => {
        handleDone();
        InteractionManager.runAfterInteractions(() => {
          hideGuide();
        });
      };
      showGuide({
        visible: true,
        steps,
        onRequestClose: closeAndHide,
        onDone: closeAndHide,
        VisualComponent: HomeGuideVisual,
        targetRefsByKey,
      });
    } else {
      hideGuide();
    }
    return () => hideGuide();
  }, [visible, showGuide, hideGuide, handleDone]);

  if (!enabled) return null;

  return null;
}
