// src/utils/navigationRenderers.js
import React, {memo, useCallback} from 'react';
import {Platform, Text, TouchableOpacity, View, StyleSheet} from 'react-native';
import {useSelector} from 'react-redux';
import FastImage from '@d11/react-native-fast-image';

import {
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveFontSize,
  getResponsiveWidth,
} from '../../../utils/responsive';

import {BUTTON_STYLES, HEADER_STYLES, LAYOUT_STYLE} from 'styles/style';
import {hapticLight} from 'utils/haptic';

// ✅ 전역 네비게이션 서비스
import {safeNavigate, safeReset} from '../navigationService';

/* =========================================================
 * ✅ 공통: FastImage tintColor 선택 적용
 * - tintColor가 있으면 style에만 붙이고, 없으면 아예 안 붙임(기본 원본색 유지)
 * - (주의) FastImage는 tintColor를 style로 줘야 적용됨
 * ========================================================= */
const withOptionalTint = (styleObj = {}, tintColor) => {
  if (!tintColor) return styleObj;
  return {...styleObj, tintColor};
};

/* =========================================================
 * ✅ 공통: 아이콘 + (뱃지 or 빨간 점)
 * - tintColor 옵션 추가
 * ========================================================= */
const IconWithBadge = memo(function IconWithBadge({
  source,
  size = 24,
  showDot = false,
  badgeCount = 0,
  dotStyle,
  badgeStyle,
  badgeTextStyle,
  imageStyle,
  tintColor, // ✅ 추가
}) {
  const count = Number(badgeCount || 0);
  const showBadge = count > 0;

  return (
    <View style={styles.iconWrap}>
      <FastImage
        source={source}
        style={[
          {
            width: getResponsiveIconSize(size),
            height: getResponsiveIconSize(size),
          },
          imageStyle,
          tintColor ? {tintColor} : null, // ✅ 선택 적용
        ]}
        resizeMode={FastImage.resizeMode.contain}
      />

      {showBadge ? (
        <View style={[styles.badge, badgeStyle]}>
          <Text
            allowFontScaling={false}
            style={[styles.badgeText, badgeTextStyle]}
            numberOfLines={1}>
            {count > 99 ? '99+' : String(count)}
          </Text>
        </View>
      ) : (
        showDot && <View style={[styles.dot, dotStyle]} />
      )}
    </View>
  );
});

/* =========================================================
 * ✅ 탭바 아이콘
 * ========================================================= */
export const TabBarIcon = memo(function TabBarIcon({
  focused,
  focusedUri,
  defaultUri,
  tabName,
  tintColor, // ✅ 필요하면 외부에서 주입 가능
}) {
  const hasUnread = useSelector(state => state.notification.hasUnread);
  const unreadCount = useSelector(state => state.notification.unreadCount || 0);

  const isAlarmTab = tabName === '알림';

  const badgeCount = isAlarmTab ? unreadCount : 0;
  const showDot = isAlarmTab ? !!hasUnread : false;

  const size = Platform.OS === 'ios' ? 22 : 24;

  return (
    <IconWithBadge
      source={{uri: focused ? focusedUri : defaultUri}}
      size={size}
      badgeCount={badgeCount}
      showDot={showDot}
      dotStyle={styles.tabDot}
      badgeStyle={styles.tabBadge}
      badgeTextStyle={styles.tabBadgeText}
      tintColor={tintColor} // ✅ 선택 적용
    />
  );
});

/* =========================================================
 * ✅ 탭바 라벨 (세로 고정)
 * ========================================================= */
export const renderTabBarLabel = (label, focused) => {
  const fontSize = getResponsiveFontSize(Platform.OS === 'ios' ? 11 : 12);
  const lineHeight = Math.round(fontSize + 4);

  return (
    <Text
      allowFontScaling={false}
      numberOfLines={1}
      style={{
        color: focused ? BUTTON_STYLES().saveBg : 'gray',
        fontSize,
        lineHeight,
        marginTop: getResponsiveHeight(3),
        fontFamily: 'Pretendard-Medium',
        includeFontPadding: false,
        textAlignVertical: 'center',
      }}>
      {label}
    </Text>
  );
};

/* =========================================================
 * ✅ 공통: 헤더 아이콘 버튼 (햅틱 포함)
 * - tintColor 옵션 추가
 * ========================================================= */
const createIconButton = (
  onPress,
  imageSource,
  size,
  marginStyle = {},
  imageExtraStyle = {},
  tintColor, // ✅ 추가
) => {
  return (
    <TouchableOpacity
      onPress={() => {
        hapticLight();
        onPress?.();
      }}
      activeOpacity={0.8}>
      <FastImage
        source={imageSource}
        style={[
          {
            width: getResponsiveIconSize(size),
            height: getResponsiveIconSize(size),
          },
          marginStyle,
          imageExtraStyle,
          tintColor ? {tintColor} : null, // ✅ 여기로
        ]}
        resizeMode={FastImage.resizeMode.contain}
      />
    </TouchableOpacity>
  );
};

/* =========================================================
 * ✅ 헤더: 타이틀 로고(아이콘만)
 * ========================================================= */
export const RenderHeaderTitleLogo = memo(function RenderHeaderTitleLogo() {
  return (
    <View style={{paddingBottom: getResponsiveHeight(14)}}>
      <FastImage
        source={require('@/assets/icons/kino-logo.png')}
        style={{
          top: getResponsiveHeight(4),
          width: getResponsiveWidth(40),
          height: getResponsiveHeight(40),
          resizeMode: 'contain',
          marginLeft: LAYOUT_STYLE().screenPaddingHorizontal - 3,
        }}
      />
    </View>
  );
});

/* =========================================================
 * ✅ 헤더: 매거진 아이콘 (홈/다른 화면 tint 처리)
 * - ✅ 여기서 tintColor 옵션 사용
 * ========================================================= */
export const RenderHeaderBook = memo(function RenderHeaderBook({
  navigation,
  currentScreen = '홈',
}) {
  const bookIcon = require('@/assets/icons/header/magazine.png');
  const tint = currentScreen === '홈' ? '#FFFFFF' : 'black';

  const goBook = () =>
    navigation.navigate('Tabs', {
      screen: '추억',
      params: {screen: '매거진화면'},
    });

  return (
    <View style={{flexDirection: 'row', alignItems: 'flex-end'}}>
      <TouchableOpacity
        onPress={() => {
          hapticLight();
          goBook();
        }}
        activeOpacity={0.8}>
        <FastImage
          source={bookIcon}
          style={[
            {
              marginLeft: getResponsiveWidth(16),
              width: getResponsiveIconSize(30),
              height: getResponsiveIconSize(30),
            },
            tint ? {tintColor: tint} : null, // ✅ 선택 적용
          ]}
          resizeMode={FastImage.resizeMode.contain}
        />
      </TouchableOpacity>
    </View>
  );
});

/* =========================================================
 * ✅ 헤더: 홈(종 + 설정)
 * - 설정 아이콘 tint 선택 적용
 * ========================================================= */
export const RenderHeaderHome = memo(function RenderHeaderHome({
  navigation,
  currentScreen,
}) {
  const hasUnread = useSelector(state => state.notification.hasUnread);
  const unreadCount = useSelector(state => state.notification.unreadCount || 0);

  const isHome = currentScreen === '홈';

  const bellIcon = isHome
    ? require('@/assets/icons/header/bell_white.png')
    : require('@/assets/icons/header/bell_black.png');

  const settingIcon = isHome
    ? require('@/assets/icons/header/setting_white.png')
    : require('@/assets/icons/header/setting_black.png');

  const goAlarm = () => safeNavigate('알림화면', {fromTab: currentScreen});
  const goSetting = () => safeNavigate('설정화면',{fromTab: currentScreen});

  // ✅ 아이콘 파일 자체가 이미 흰/검 버전이면 tint 필요 없음
  // ✅ 만약 “무조건 한 파일만 쓰고 tint로만 바꾸고 싶다”면 여기서 tintColor를 넣으면 됨
  const settingTint = null; // 예: !isHome ? 'black' : '#FFFFFF'

  return (
    <View
      style={{
        flexDirection: 'row',
        marginRight: LAYOUT_STYLE().screenPaddingHorizontal,
      }}>
      <TouchableOpacity
        onPress={() => {
          hapticLight();
          goAlarm();
        }}
        activeOpacity={0.8}>
        <IconWithBadge
          source={bellIcon}
          size={HEADER_STYLES().headerLeftIconWidth + 2}
          badgeCount={unreadCount}
          showDot={!!hasUnread}
          dotStyle={styles.headerDot}
          badgeStyle={styles.headerBadge}
          badgeTextStyle={styles.headerBadgeText}
          // tintColor={...}  // ✅ 필요할 때만
        />
      </TouchableOpacity>

      <View style={{width: getResponsiveWidth(12)}} />

      {createIconButton(
        goSetting,
        settingIcon,
        HEADER_STYLES().headerRightIconWidth + 3,
        {},
        {},
        settingTint, // ✅ 선택 적용
      )}
    </View>
  );
});

/* =========================================================
 * ✅ 나머지 헤더 버튼들
 * - createIconButton의 마지막 인자로 tintColor를 “필요할 때만” 전달
 * ========================================================= */
export const RenderHeaderLeft1 = memo(function RenderHeaderLeft1() {
  return createIconButton(
    () => safeNavigate('알림화면'),
    require('@/assets/images/navigator_alarm-button.png'),
    HEADER_STYLES().headerLeftIconWidth,
    {marginLeft: HEADER_STYLES().headerLeftIconLeftPadding},
    {},
    null, // ✅ tintColor (필요하면 색 넣기)
  );
});

export const RenderHeaderRightSetting = memo(function RenderHeaderRightSetting({
  navigation,
}) {
  return createIconButton(
    () =>
      navigation.navigate('Tabs', {
        screen: '홈',
        params: {screen: '설정화면'},
      }),
    require('@/assets/images/setting_bt.png'),
    HEADER_STYLES().headerRightIconWidth,
    {marginRight: HEADER_STYLES().headerRightIconRightPadding},
  );
});

export const RenderHeaderRightChatSetting = memo(
  function RenderHeaderRightChatSetting({
    setIsSettingsOpen,
    tintColor = 'black',
  }) {
    return createIconButton(
      () => setIsSettingsOpen(true),
      require('@/assets/icons/List.png'),
      HEADER_STYLES().headerRightIconWidth,
      {marginRight: HEADER_STYLES().headerRightIconRightPadding},
      {},
      tintColor, // ✅ 선택 적용
    );
  },
);

export const RenderHeaderDeletePost = memo(function RenderHeaderDeletePost() {
  return createIconButton(
    () => {},
    require('@/assets/images/trash.png'),
    HEADER_STYLES().headerRightIconWidth,
    {marginRight: HEADER_STYLES().headerRightIconRightPadding},
    {zIndex: 999},
  );
});

export const RenderGoBackButton = memo(function RenderGoBackButton({
  navigation,
  tintColor = 'black',
}) {
  return createIconButton(
    () => navigation.goBack(),
    require('@/assets/icons/caretDown.png'),
    HEADER_STYLES().headerLeftIconWidth,
    {marginLeft: HEADER_STYLES().headerLeftIconLeftPadding},
    {zIndex: 999},
    tintColor, // ✅ 선택 적용
  );
});

export const RenderGoBackButtonGallery = memo(
  function RenderGoBackButtonGallery({navigation, tintColor}) {
    return createIconButton(
      () => navigation.goBack(),
      require('@/assets/images/navigator_goback-button.png'),
      HEADER_STYLES().headerLeftIconWidth,
      {marginLeft: HEADER_STYLES().headerLeftIconLeftPadding},
      {zIndex: 999},
      tintColor, // ✅ 선택 적용
    );
  },
);

/* =========================================================
 * ✅ 알림화면 back 버튼
 * ========================================================= */
export const RenderHeaderBackButton = memo(
  function RenderHeaderBackButton({
    navigation,
    route,
    tintColor = 'black',
  }) {
    const fromTab = route?.params?.fromTab;
    const fromScreen = route?.params?.fromScreen;
    const fromParams = route?.params?.fromParams;

    const onPress = useCallback(() => {
      hapticLight();

      // ✅ 1순위: 스택 back
      if (navigation?.canGoBack?.()) {
        navigation.goBack();
        return;
      }

      // ✅ 2순위: 특정 탭 복귀
      if (fromTab) {
        const tabRoutes = ['홈', '소통', '일정', '추억'];
        const tabIndex = Math.max(0, tabRoutes.indexOf(fromTab));

        safeReset({
          index: 0,
          routes: [
            {
              name: 'Root',
              state: {
                index: 0,
                routes: [
                  {
                    name: 'Tabs',
                    state: {
                      index: tabIndex,
                      routes: tabRoutes.map(name => {
                        if (name !== fromTab) return {name};
                        if (!fromScreen) return {name};

                        return {
                          name,
                          state: {
                            index: 0,
                            routes: [{name: fromScreen, params: fromParams}],
                          },
                        };
                      }),
                    },
                  },
                ],
              },
            },
          ],
        });
        return;
      }

      // ✅ fallback
      safeReset({index: 0, routes: [{name: 'Root'}]});
    }, [navigation, fromTab, fromScreen, fromParams]);

    return createIconButton(
      onPress,
      require('@/assets/icons/caretDown.png'),
      HEADER_STYLES().headerLeftIconWidth,
      {marginLeft: HEADER_STYLES().headerLeftIconLeftPadding},
      {zIndex: 999},
      tintColor,
    );
  },
);
/* =========================================================
 * ✅ 헤더: 로고(Kinover + 텍스트)
 * ========================================================= */
export const RenderHeaderLogo = memo(function RenderHeaderLogo({
  currentScreen = '홈',
}) {
  const titleFontSize = getResponsiveFontSize(20);
  const titleLineHeight = Math.round(titleFontSize + 6);

  return (
    <TouchableOpacity
      onPress={() => {
        hapticLight();
        safeNavigate('알림화면');
      }}
      style={{flexDirection: 'row', alignItems: 'flex-end'}}>
      <FastImage
        source={require('@/assets/images/kinover.png')}
        style={{
          width: getResponsiveWidth(60),
          height: getResponsiveHeight(60),
          marginRight: LAYOUT_STYLE().screenPaddingHorizontal,
          resizeMode: 'contain',
        }}
      />
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={{
          position: 'absolute',
          bottom: getResponsiveHeight(6),
          width: getResponsiveWidth(110),
          height: titleLineHeight,
          lineHeight: titleLineHeight,
          includeFontPadding: false,
          textAlignVertical: 'center',
          fontSize: titleFontSize,
          fontFamily: 'Pretendard-SemiBold',
          color: currentScreen === '홈' ? '#FFFFFF' : '#111827',
        }}>
        Kinover
      </Text>
    </TouchableOpacity>
  );
});

/* =========================================================
 * ✅ styles
 * ========================================================= */
const styles = StyleSheet.create({
  iconWrap: {position: 'relative'},

  dot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#FF3B30',
  },

  badge: {
    position: 'absolute',
    minWidth: getResponsiveWidth(16),
    height: getResponsiveWidth(16),
    borderRadius: 999,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: getResponsiveWidth(4),
  },

  badgeText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(10),
    lineHeight: Math.round(getResponsiveFontSize(10) + 4),
    fontFamily: 'Pretendard-SemiBold',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  headerDot: {top: -2.5, right: -2.5},
  tabDot: {top: -2.5, right: -2.5},

  headerBadge: {top: -6, right: -8},
  headerBadgeText: {fontSize: getResponsiveFontSize(10)},

  tabBadge: {top: -6, right: -10},
  tabBadgeText: {fontSize: getResponsiveFontSize(10)},
});
