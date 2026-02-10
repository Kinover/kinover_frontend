// src/components/AppAlertHost.jsx
import React, {useCallback, useEffect} from 'react';
import {Linking} from 'react-native';
import AppAlertModal from './AppAlertModal';
import useAppAlertPopup from '../../hooks/useAppAlertPopup';

// ✅ 전역 네비
import {safeNavigate} from 'app/navigation/navigationService';

/**
 * ✅ AppAlertHost
 * props:
 * - event: useActiveAppEvent() 결과
 * - enabled: 호스트 활성화
 * - onVisibleChange?: (isVisible:boolean) => void   ✅ 추가: "지금 앱얼럿이 떠있는지" 바깥에 알려줌
 */
export default function AppAlertHost({
  event,
  enabled = true,
  onVisibleChange,
}) {
  const popup = useAppAlertPopup(event, {enabled});
  const e = popup.event;

  // ✅ 현재 popup.visible 변화를 외부(HomeScreen)에 알려줌
  useEffect(() => {
    onVisibleChange?.(!!popup.visible);
  }, [popup.visible, onVisibleChange]);

  const type = e?.type || 'info';
  const title = e?.title || '이벤트 안내';
  const subTitle = e?.subTitle || '이벤트 서브타이틀';
  const message = e?.message || '';

  const image = e?.image || null;
  const imageUri = e?.imageUri || null;

  const primaryText = e?.primary?.text || '보러가기';
  const secondaryText = e?.secondaryText || '오늘 하루 보지 않기';
  const tertiaryText = e?.tertiaryText || '다시 보지 않기';

  const runAction = useCallback(async action => {
    if (!action || action.kind === 'none') return;

    if (action.kind === 'navigate') {
      safeNavigate?.(action.target, action.params || {});
      return;
    }

    if (action.kind === 'deeplink' || action.kind === 'url') {
      if (action.url) await Linking.openURL(action.url);
      return;
    }
  }, []);

  const onPrimary = useCallback(async () => {
    await runAction(e?.primary?.action);
    popup.close();
  }, [runAction, e?.primary?.action, popup]);

  const onSecondary = useCallback(async () => {
    await popup.dismissToday();
  }, [popup]);

  const onTertiary = useCallback(async () => {
    await popup.dismissNever();
  }, [popup]);

  const onRequestClose = useCallback(() => {
    popup.close();
  }, [popup]);

  if (!enabled) return null;
  if (!e) return null;

  // ✅ visible 아닐 땐 아예 렌더링하지 않기(오버레이 잔상 방지)
  if (!popup.visible) return null;

  return (
    <AppAlertModal
      visible={true}
      type={type}
      title={title}
      subTitle={subTitle}
      message={message}
      image={image}
      imageUri={imageUri}
      primaryText={primaryText}
      secondaryText={secondaryText}
      tertiaryText={tertiaryText}
      onPrimary={onPrimary}
      onSecondary={onSecondary}
      onTertiary={onTertiary}
      onRequestClose={onRequestClose}
      autoDismissMs={null}
    />
  );
}
