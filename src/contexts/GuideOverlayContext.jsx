/**
 * 가이드 오버레이를 탭 네비게이터 위(전체 화면)에 View로 띄우기 위한 컨텍스트.
 * iOS/Android 모두 RN Modal 대신 View 사용 → 닫은 뒤 탭 터치 막힘 방지.
 */
import React, {createContext, useContext, useState, useCallback} from 'react';
import GuideModalCarousel from 'components/modal/GuideModal';

const GuideOverlayContext = createContext(null);

export function useGuideOverlay() {
  const ctx = useContext(GuideOverlayContext);
  return ctx;
}

export function GuideOverlayProvider({children}) {
  const [guideProps, setGuideProps] = useState(null);
  // Android에서 가이드 표시 여부를 별도로 추적한다.
  const [anyGuideVisible, setAnyGuideVisible] = useState(false);

  const showGuide = useCallback(props => {
    const hasSteps = Array.isArray(props?.steps) && props.steps.length > 0;
    const isVisible = !!props?.visible;
    if (!hasSteps || !isVisible) {
      setGuideProps(null);
      setAnyGuideVisible(false);
      return;
    }
    setGuideProps(props);
    setAnyGuideVisible(true);
  }, []);

  const hideGuide = useCallback(() => {
    setGuideProps(null);
    setAnyGuideVisible(false);
  }, []);

  const value = {
    guideProps,
    showGuide,
    hideGuide,
    isGuideVisible: !!guideProps?.visible || anyGuideVisible,
    setAnyGuideVisible,
  };

  return (
    <GuideOverlayContext.Provider value={value}>
      {children}
    </GuideOverlayContext.Provider>
  );
}

/**
 * 가이드 오버레이 뷰 (Provider 아래 어디서나 사용).
 * Host: 탭 옆에서 쓸 때, Root: 앱 루트에서 쓸 때 (탭 트리와 형제로 두어 터치 이슈 방지).
 */
function GuideOverlayView() {
  const {guideProps} = useGuideOverlay();
  if (!guideProps?.visible) return null;
  return <GuideModalCarousel visible={true} {...guideProps} />;
}

/** 탭 트리 안에서 오버레이 렌더 (레거시/호환용) */
export function GuideOverlayHost() {
  return <GuideOverlayView />;
}

/**
 * 앱 루트에서 오버레이만 렌더. 탭/네비 트리와 형제이므로
 * 가이드 닫아도 탭 쪽 뷰 계층이 안 바뀌어 터치가 정상 동작.
 */
export function GuideOverlayRoot() {
  return <GuideOverlayView />;
}

/**
 * 탭만 렌더 (가이드는 App 루트 GuideOverlayRoot에서 처리).
 */
export function TabsWithOptionalGuideHost({tabNavigatorProps, TabNavigatorComponent}) {
  return <TabNavigatorComponent {...tabNavigatorProps} />;
}
