// src/hooks/useAppAlert.js
import React, {useCallback, useMemo, useState} from 'react';
import AppAlertModal from 'components/modal/AppAlertModal';

/**
 * useAppAlert
 * - showAlert({type,title,message,primaryText,secondaryText,autoDismissMs,onPrimary,onSecondary})
 * - AlertHost 컴포넌트를 JSX에 한번만 꽂아두면 끝
 */
export function useAppAlert() {
  const [state, setState] = useState({
    visible: false,
    type: 'info',
    title: '알림',
    subTitle: '서브타이틀',
    message: '',
    primaryText: '확인',
    secondaryText: null,
    autoDismissMs: null,
    onPrimary: null,
    onSecondary: null,
  });

  const hide = useCallback(() => {
    setState(prev => ({...prev, visible: false}));
  }, []);

  const showAlert = useCallback((opts = {}) => {
    setState({
      visible: true,
      type: opts.type ?? 'info',
      title: opts.title ?? '알림',
      subTitle: opts.subtitle ?? '알림 서브타이틀',
      message: opts.message ?? '',
      primaryText: opts.primaryText ?? '확인',
      secondaryText: opts.secondaryText ?? null,
      autoDismissMs: opts.autoDismissMs ?? null,
      onPrimary: typeof opts.onPrimary === 'function' ? opts.onPrimary : null,
      onSecondary:
        typeof opts.onSecondary === 'function' ? opts.onSecondary : null,
    });
  }, []);

 // 모달에서 버튼 눌렀을 때
  const handlePrimary = useCallback(() => {
    const fn = state.onPrimary;
    hide();
    fn?.();
  }, [state.onPrimary, hide]);

  const handleSecondary = useCallback(() => {
    const fn = state.onSecondary;
    hide();
    fn?.();
  }, [state.onSecondary, hide]);

  const AlertHost = useMemo(() => {
 // 컴포넌트로 쓰기 좋게 반환
    return function AlertHostComponent() {
      return (
        <AppAlertModal
          visible={state.visible}
          type={state.type}
          title={state.title}
          subTitle={state.subTitle}
          message={state.message}
          primaryText={state.primaryText}
          secondaryText={state.secondaryText}
          autoDismissMs={state.autoDismissMs}
          onPrimary={handlePrimary}
          onSecondary={handleSecondary}
          onRequestClose={hide}
        />
      );
    };
  }, [state, handlePrimary, handleSecondary, hide]);

  return {showAlert, hide, AlertHost};
}
