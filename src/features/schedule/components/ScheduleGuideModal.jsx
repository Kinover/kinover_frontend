// src/features/schedule/components/ScheduleGuideModal.jsx
import React, {useCallback, useEffect, useRef, useState, useMemo} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import GuideModalCarousel from 'components/modal/GuideModal'; // ✅ 너 프로젝트에서 캐러셀 모달로 쓰는 경로
import ScheduleGuideVisual from './ScheduleGuideVisual';

// ✅ 일정 전용 저장 키 (버전 올리면 v2로 바꾸면 재노출 가능)
const KEY_SCHEDULE_GUIDE_SHOWN = '@kinover/guide/schedule_v1_shown';

/**
 * ✅ ScheduleGuideModal
 * - 일정 화면 최초 진입 "1회만" 노출
 * - "다시 보지 않기" / "닫기(X/바깥)" / "마지막 확인" 정책 통일
 * - steps 기반 캐러셀
 *
 * 사용 예:
 * <ScheduleGuideModal ready={didInitialLoad} />
 */
export default function ScheduleGuideModal({
  enabled = true,
  forceVisible = false,
  ready = true,

  storageKey = KEY_SCHEDULE_GUIDE_SHOWN,

  // 상단 고정 문구(스샷 스타일)
//   titleFixed = '한 번만 알려드릴게요',

  // (선택) step 구성 커스텀하고 싶으면 외부에서 override 가능
  steps: stepsProp,
}) {
  const [visible, setVisible] = useState(false);
  const checkingRef = useRef(false);

  // ✅ 기본 steps (원하는 카피로 바꾸면 됨)
  const steps = useMemo(() => {
    if (Array.isArray(stepsProp) && stepsProp.length) return stepsProp;

    return [
      {
        key: 'add',
        title: '일정 추가',
        caption: '일정',
        description: '플러스 버튼(또는 추가 버튼)으로 새 일정을 만들 수 있어요.',
        visualHeight: 240,
        renderVisual: () => <ScheduleGuideVisual variant="add" />,
      },
      {
        key: 'type',
        title: '유형 선택',
        caption: '유형',
        description: '가족/개인/기념일 등 유형에 따라 색이나 표시가 달라져요.',
        visualHeight: 240,
        renderVisual: () => <ScheduleGuideVisual variant="type" />,
      },
      {
        key: 'edit',
        title: '일정 수정',
        caption: '편집',
        description: '카드를 눌러 내용을 수정하거나 참여자를 바꿀 수 있어요.',
        visualHeight: 240,
        renderVisual: () => <ScheduleGuideVisual variant="edit" />,
      },
    ];
  }, [stepsProp]);

  // ✅ 닫으면서 "봤다" 저장
  const rememberAndClose = useCallback(async () => {
    setVisible(false);
    try {
      await AsyncStorage.setItem(storageKey, '1');
    } catch (e) {
      // 저장 실패해도 UX는 닫는 게 우선
    }
  }, [storageKey]);

  // ✅ 최초 1회 체크
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
        if (shown !== '1') {
          requestAnimationFrame(() => setVisible(true));
        }
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
    //   titleFixed={titleFixed}
      secondaryText="다시 보지 않기"
      nextText="다음"
      doneText="확인"
      // ✅ 마지막(확인) 버튼
      onDone={rememberAndClose}
      // ✅ “다시 보지 않기”
      onSecondaryPress={rememberAndClose}
      // ✅ X / 바깥 터치(모달 닫기)도 동일 정책
      onRequestClose={rememberAndClose}
    />
  );
}
