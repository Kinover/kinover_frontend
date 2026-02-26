// src/features/chat/components/ChatGuideModal.jsx
import React, {useEffect} from 'react';
import {Platform} from 'react-native';
import useGuide from 'hooks/useGuide';
import {useGuideOverlay} from 'contexts/GuideOverlayContext';

const KEY_CHAT_GUIDE_SHOWN = '@kinover/guide/chat_v3_shown';

/** 시안 구조: 실제 탭 화면 위 하이라이트 + 말풍선 + 하단바 */
const steps = [
  {
    key: 'kino_counseling',
    title: '키노상담소',
    description:
      '**키노**랑 가족에 대한 고민, 일상 이야기 등 하고 싶은 말을 편하게 나눠보세요.',
  },
  {
    key: 'chat_action',
    title: '채팅방 만들기',
    description: '**+ 버튼**을 눌러 가족과 새 채팅방을 만들어보세요.',
  },
];

export default function ChatGuideModal({
  enabled = true,
  ready = true,
  forceVisible = false,
  storageKey = KEY_CHAT_GUIDE_SHOWN,
  targetRef,
  targetRefsByKey,
  onAfterClose,
}) {
  const {visible, closeAndRemember} = useGuide(
    storageKey,
    enabled && ready,
    {forceVisible},
  );
  const {showGuide, hideGuide, setAnyGuideVisible} = useGuideOverlay() || {};

  useEffect(() => {
    if (Platform.OS !== 'android' || !setAnyGuideVisible) return;
    if (visible) setAnyGuideVisible(true);
    return () => setAnyGuideVisible(false);
  }, [visible, setAnyGuideVisible]);

  useEffect(() => {
    if (!showGuide || !hideGuide) return;
    if (visible) {
      const closeAndHide = () => {
        closeAndRemember();
        hideGuide();
      };
      showGuide({
        visible: true,
        steps,
        onRequestClose: closeAndHide,
        onDone: closeAndHide,
        targetRef,
        targetRefsByKey,
      });
    } else {
      hideGuide();
    }
    return () => hideGuide();
  }, [visible, showGuide, hideGuide, closeAndRemember]);

  if (!enabled) return null;

  return null;
}
