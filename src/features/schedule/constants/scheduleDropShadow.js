import {Platform} from 'react-native';
import {getResponsiveHeight} from 'utils/responsive';

/**
 * CalendarToggle 헤더·그리드와 일정 리스트 카드가 공유하는 DropShadow 수치
 * (react-native-drop-shadow — Calendar.jsx와 동일)
 * Android는 비트맵 그림자라 수치를 살짝 조정해 iOS와 비슷한 부드러운 경계로 맞춤
 */
export const SCHEDULE_CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: {width: 0, height: 1},
  shadowOpacity: 0.12,
  shadowRadius: 2,
  ...(Platform.OS === 'android' ? {elevation: 3} : {elevation: 0}),
};

/** Calendar.jsx `styles.shadowBox`와 동일 베이스 */
export function getScheduleShadowBoxBaseStyle() {
  return {
    alignSelf: 'center',
    backgroundColor: 'transparent',
    marginBottom: getResponsiveHeight(10),
  };
}
