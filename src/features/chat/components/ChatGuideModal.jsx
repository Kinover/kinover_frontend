// src/features/chat/components/ChatGuideModal.jsx
import React from 'react';
import GuideModalCarousel from 'components/modal/GuideModal';
import useGuide from 'hooks/useGuide';

const KEY_CHAT_GUIDE_SHOWN = '@kinover/guide/chat_v2_shown';

/** 행동 유도형 1페이지 가이드: 이 화면에서 뭘 하면 되는지만 안내 */
const steps = [
  {
    key: 'chat_action',
    title: '소통',
    description: '새 채팅방은 **오른쪽 아래 + 버튼**에서 만들 수 있어요.\n만들어진 **채팅방을 눌러** 가족과 대화를 시작해보세요.',
  },
];

export default function ChatGuideModal({
  enabled = true,
  ready = true,
  forceVisible = false,
  storageKey = KEY_CHAT_GUIDE_SHOWN,
}) {
  const {visible, closeAndRemember} = useGuide(
    storageKey,
    enabled && ready,
    {forceVisible},
  );

  if (!enabled) return null;

  return (
    <GuideModalCarousel
      visible={visible}
      steps={steps}
      onRequestClose={closeAndRemember}
      onDone={closeAndRemember}
    />
  );
}
