/**
 * @fileoverview 네비게이션 참조 유틸리티
 * 
 * NavigationContainer의 참조를 생성하고 관리합니다.
 * 
 * @deprecated navigationService.jsx의 navigationRef를 사용하세요.
 */

import {createNavigationContainerRef} from '@react-navigation/native';

/** 네비게이션 컨테이너 참조 */
export const navigationRef = createNavigationContainerRef();

/**
 * 네비게이션 실행
 * @param {string} name - 라우트 이름
 * @param {Object} params - 네비게이션 파라미터
 */
export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}