// src/features/home/components/HomeGuideModal.jsx
import React, {useCallback} from 'react';
import GuideModalCarousel from 'components/modal/GuideModal';
import useGuide from 'hooks/useGuide';

const KEY_HOME_GUIDE_SHOWN = '@kinover/guide/home_v3_shown';

/** 행동 유도형: 이 화면에서 뭘 누르면 되는지 안내 */
const steps = [
  {
    key: 'family_status',
    title: '홈',
    description: '**가족 프로필**을 눌러 접속 상태를 확인해보세요.\n프로필을 **길게 누르면** 별명·한마디를 수정할 수 있어요.',
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
  onDone, // ✅ HomeScreen 후처리 알럿
}) {
  const {visible, closeAndRemember} = useGuide(
    storageKey,
    enabled && ready,
    {forceVisible},
  );

  const handleDone = useCallback(async () => {
    await closeAndRemember();
    onDone?.();
  }, [closeAndRemember, onDone]);

  if (!enabled) return null;

  return (
    <GuideModalCarousel
      visible={visible}
      steps={steps}
      onRequestClose={handleDone}
      onDone={handleDone}
    />
  );
}
