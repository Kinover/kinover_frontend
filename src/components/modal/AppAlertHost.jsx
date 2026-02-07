// src/components/AppAlertHost.jsx
import React, {useCallback} from 'react';
import {Linking} from 'react-native';
import AppAlertModal from './AppAlertModal';
import useAppAlertPopup from '../../hooks/useAppAlertPopup';

// ✅ 네 프로젝트에 이미 있던 전역 네비 (있으면 이게 제일 편함)
import {safeNavigate} from 'app/navigation/navigationService';

/**
 * ✅ AppAlertHost
 * - “앱 진입/홈 진입” 시점에 한 번 띄울 이벤트를 여기서 결정
 * - 버튼 액션(이동) + dismiss 저장 정책을 여기서 처리
 *
 * 사용:
 * <AppAlertHost event={eventObject} />
 */
export default function AppAlertHost({event, enabled = true}) {
  const popup = useAppAlertPopup(event, {enabled});
  const e = popup.event;

  const type = e?.type || 'info';
  const title = e?.title || '이벤트 안내';
  const subTitle = e?.subTitle || '이벤트 서브타이틀';
  const message = e?.message || '';

  // ✅ 이미지 (둘 중 하나만 쓰면 됨)
  // - e.image: { uri, width?, height?, resizeMode? } 또는 require(...) 같은 정적 이미지도 가능
  // - e.imageUri: 문자열 uri만 간단히
  const image = e?.image || null;
  const imageUri = e?.imageUri || null;

  // 버튼 텍스트
  const primaryText = e?.primary?.text || '보러가기';
  const secondaryText = e?.secondaryText || '오늘 하루 보지 않기';
  const tertiaryText = e?.tertiaryText || '다시 보지 않기';

  const runAction = useCallback(async action => {
    if (!action || action.kind === 'none') return;

    if (action.kind === 'navigate') {
      safeNavigate?.(action.target, action.params || {});
      return;
    }

    if (action.kind === 'deeplink') {
      if (action.url) await Linking.openURL(action.url);
      return;
    }

    if (action.kind === 'url') {
      if (action.url) await Linking.openURL(action.url);
      return;
    }
  }, []);

  // ✅ Primary: 이동 + 닫기(기본은 dismiss 저장 안 함)
  const onPrimary = useCallback(async () => {
    await runAction(e?.primary?.action);
    popup.close();
  }, [runAction, e?.primary?.action, popup]);

  // ✅ Secondary: 오늘 하루 보지 않기(또는 서버가 hours를 주면 hours로)
  const onSecondary = useCallback(async () => {
    await popup.dismissToday();
  }, [popup]);

  // ✅ Tertiary: 다시 보지 않기(영구)
  const onTertiary = useCallback(async () => {
    await popup.dismissNever();
  }, [popup]);

  // ✅ X/바깥터치: 그냥 닫기(억제 저장 X)
  const onRequestClose = useCallback(() => {
    popup.close();
  }, [popup]);

  if (!enabled) return null;
  if (!e) return null;

  return (
    <AppAlertModal
      visible={popup.visible}
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
