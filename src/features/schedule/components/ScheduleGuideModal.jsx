// src/features/schedule/components/ScheduleGuideModal.jsx
import React, {useMemo, useEffect} from 'react';
import {Platform} from 'react-native';
import useGuide from 'hooks/useGuide';
import {useGuideOverlay} from 'contexts/GuideOverlayContext';

const KEY_SCHEDULE_GUIDE_SHOWN = '@kinover/guide/schedule_v1_shown';

const defaultSteps = [
  {
    key: 'pick_date',
    title: '날짜 선택',
    description: '캘린더에서 **날짜를 선택하면** 그날 일정을 확인할 수 있어요.',
  },
  {
    key: 'add',
    title: '일정 추가',
    description: '**오른쪽 아래 + 버튼**을 눌러 새 일정을 추가해보세요.',
  },
];

export default function ScheduleGuideModal({
  enabled = true,
  ready = true,
  forceVisible = false,
  storageKey = KEY_SCHEDULE_GUIDE_SHOWN,
  steps: stepsProp,
  targetRef,
  targetRefsByKey,
  onAfterClose,
}) {
  const steps = useMemo(() => {
    if (Array.isArray(stepsProp) && stepsProp.length) return stepsProp;
    return defaultSteps;
  }, [stepsProp]);

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
  }, [visible, showGuide, hideGuide, steps, closeAndRemember]);

  if (!enabled) return null;

  return null;
}
