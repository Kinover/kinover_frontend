import {getResponsiveFontSize, getResponsiveHeight} from 'utils/responsive';
import {FONTS} from 'styles/typography';

/**
 * 바텀시트 헤더/섹션 타이포 공통 토큰
 * - 헤더(title/subtitle), 섹션 라벨(sectionLabel)을 한 곳에서 관리
 * - 값 변경 시 BottomSheetLayout + 각 바텀시트 라벨에 동시 반영
 */
export const getBottomSheetTypography = () => ({
  title: {
    fontSize: getResponsiveFontSize(19),
    fontFamily: FONTS.SEMI_BOLD,
    color: '#000000',
  },
  subtitle: {
    marginTop: getResponsiveHeight(4),
    fontSize: getResponsiveFontSize(13),
    fontFamily: FONTS.REGULAR,
    color: '#6B7280',
  },
  sectionLabel: {
    fontSize: getResponsiveFontSize(12.5),
    fontFamily: FONTS.MEDIUM,
    color: '#98A2B3',
    marginBottom: getResponsiveHeight(6),
    marginTop: getResponsiveHeight(10),
  },
});
