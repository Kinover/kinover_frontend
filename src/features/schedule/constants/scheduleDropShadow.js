import {getResponsiveHeight} from 'utils/responsive';
import {TAB_CARD_DROP_SHADOW} from 'styles/style';

/**
 * CalendarToggle 헤더·그리드와 일정 리스트 카드가 공유하는 DropShadow 수치
 * (react-native-drop-shadow — 홈/다른 탭 카드와 동일 톤)
 */
export const SCHEDULE_CARD_SHADOW = {...TAB_CARD_DROP_SHADOW};

/** Calendar.jsx `styles.shadowBox`와 동일 베이스 */
export function getScheduleShadowBoxBaseStyle() {
  return {
    alignSelf: 'center',
    backgroundColor: 'transparent',
    marginBottom: getResponsiveHeight(10),
  };
}
