// src/utils/navigationRenderers.js
import React, {memo, useCallback} from 'react';
import { Platform, TouchableOpacity, View, Image } from 'react-native';
import {useSelector} from 'react-redux';
import {
  useGetHasUnreadQuery,
  useGetUnreadCountQuery,
} from 'features/notification/services/notificationApi';

import AppText from 'components/AppText';
import {
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveFontSize,
  getResponsiveWidth,
} from 'utils/responsive';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';

import {BUTTON_STYLES, COLORS, HEADER_STYLES, LAYOUT_STYLE} from 'styles/style';
import {hapticLight} from 'utils/haptic';
import {StackActions} from '@react-navigation/native';
import {
  navigationRef,
  safeNavigate,
  safeReset,
  resetToTabScreen,
  getLastFromTabForGlobalScreen,
} from '../navigationService';
import {FONTS} from 'styles/typography';

function useTabHeaderBadgeStyles() {
  return useScaledStyleSheet(rf => ({
    iconWrap: {position: 'relative'},

    dot: {
      position: 'absolute',
      width: 6,
      height: 6,
      borderRadius: 999,
      backgroundColor: '#FF3B30',
    },

    headerDot: {top: -2.5, right: -2.5},
    tabDot: {top: -2.5, right: -2.5},

    badgeBase: {
      position: 'absolute',
      top: -2,
      right: -2,
      alignItems: 'center',
      justifyContent: 'center',
    },

    badgeInner: {
      backgroundColor: '#FF3B30',
      alignItems: 'center',
      justifyContent: 'center',
    },

    badgeInnerText: {
      color: '#FFFFFF',
      fontSize: rf(10),
      lineHeight: Math.round(rf(10) + 2),
      fontFamily: FONTS.SEMI_BOLD,
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
  }));
}

function useNotificationBadgeState() {
  const fallbackHasUnread = useSelector(state => state.notification.hasUnread);
  const fallbackUnreadCount = useSelector(
    state => state.notification.unreadCount || 0,
  );

  const {data: hasUnreadData} = useGetHasUnreadQuery(undefined, {
    refetchOnFocus: true,
  });
  const {data: unreadCountData} = useGetUnreadCountQuery(undefined, {
    refetchOnFocus: true,
  });

  const hasUnread =
    typeof hasUnreadData?.hasUnread === 'boolean'
      ? hasUnreadData.hasUnread
      : !!fallbackHasUnread;
  const unreadCount = Number(
    unreadCountData?.unreadCount ?? fallbackUnreadCount ?? 0,
  );

  return {hasUnread, unreadCount: Number.isFinite(unreadCount) ? unreadCount : 0};
}

/* =========================================================
 * 공통: 아이콘 + (알림 뱃지 or 빨간 점)
 * - “갉아먹는” 2겹 배지 + 이너 pill padding 지원
 * ========================================================= */
const IconWithBadge = memo(function IconWithBadge({
  source,
  size = 24,
  showDot = false,
  badgeCount = 0,

  dotStyle,
  imageStyle,
  tintColor,

 // 큰 원(노치)
  badgeBaseColor = '#FFFFFF',
  badgeBaseSize = 15,
  badgeBaseBorderWidth = 8,
  badgeBaseBorderColor = '#FFFFFF',

 // 이너 뱃지(pill)
  badgeInnerHeight = 12,
  badgeInnerMinWidth = 12,
  badgeInnerHPadding = 5, // 여기 올리면 “좌우 여백” 확실히 늘어남
}) {
  const styles = useTabHeaderBadgeStyles();
  const count = Number(badgeCount || 0); // 절대 20 같은 하드코딩 하면 안 됨
  const showBadge = count > 0;

  const iconPx = getResponsiveIconSize(size);
  const basePx = getResponsiveIconSize(badgeBaseSize);

  const innerH = getResponsiveHeight(badgeInnerHeight);
  const innerMinW = getResponsiveWidth(badgeInnerMinWidth);
  const innerPadH = getResponsiveWidth(badgeInnerHPadding);

  return (
    <View style={styles.iconWrap}>
      <Image
        source={source}
        style={[
          {width: iconPx, height: iconPx, resizeMode: 'contain'},
          imageStyle,
          tintColor ? {tintColor} : null,
        ]}
      />

      {showBadge ? (
        <View
          style={[
            styles.badgeBase,
            {
              width: basePx,
              height: basePx,
              borderRadius: basePx / 2,
              backgroundColor: badgeBaseColor,
              borderWidth: badgeBaseBorderWidth,
              borderColor: badgeBaseBorderColor,
            },
          ]}>
          <View
            style={[
              styles.badgeInner,
              {
                height: innerH,
                minWidth: innerMinW,
                paddingHorizontal: innerPadH,
                borderRadius: innerH / 2,
              },
            ]}></View>
        </View>
      ) : (
        showDot && <View style={[styles.dot, dotStyle]} />
      )}
    </View>
  );
});

/* =========================================================
 * 탭바 아이콘
 * ========================================================= */
export const TabBarIcon = memo(function TabBarIcon({
  focused,
  focusedUri,
  defaultUri,
  tabName,
  tintColor,
}) {
  const {hasUnread, unreadCount} = useNotificationBadgeState();

  const isAlarmTab = tabName === '알림';
  const badgeCount = isAlarmTab ? unreadCount : 0;

  const showDot = isAlarmTab ? !!hasUnread : false;

  const size = Platform.OS === 'ios' ? 22 : 24;
  const styles = useTabHeaderBadgeStyles();

  return (
    <IconWithBadge
      source={{uri: focused ? focusedUri : defaultUri}}
      size={size}
      badgeCount={badgeCount}
      showDot={showDot}
      dotStyle={styles.tabDot}
      badgeBaseColor="#FFFFFF"
      badgeBaseBorderColor="#FFFFFF"
      tintColor={tintColor}
    />
  );
});

/* =========================================================
 * 탭바 라벨 (이게 없어서 지금 터진 거임)
 * ========================================================= */
export const renderTabBarLabel = (label, focused) => {
  const fontSize = getResponsiveFontSize(Platform.OS === 'ios' ? 11 : 12);
  const lineHeight = Math.round(fontSize + 4);

  return (
    <AppText
      allowFontScaling={false}
      numberOfLines={1}
      style={{
        color: focused ? COLORS.textPrimary : 'gray',
        fontSize,
        lineHeight,
        marginTop: getResponsiveHeight(3),
        fontFamily: FONTS.MEDIUM,
        includeFontPadding: false,
        textAlignVertical: 'center',
      }}>
      {label}
    </AppText>
  );
};

/* =========================================================
 * 공통: 헤더 아이콘 버튼 (햅틱 포함)
 * ========================================================= */
const createIconButton = (
  onPress,
  imageSource,
  size,
  marginStyle = {},
  imageExtraStyle = {},
  tintColor,
) => {
  return (
    <TouchableOpacity
      onPress={() => {
        hapticLight();
        onPress?.();
      }}
      activeOpacity={0.8}>
      <Image
        source={imageSource}
        style={[
          {
            width: getResponsiveIconSize(size),
            height: getResponsiveIconSize(size),
            resizeMode:'contain',
          },
          marginStyle,
          imageExtraStyle,
          tintColor ? {tintColor} : null,
        ]}
      />
    </TouchableOpacity>
  );
};

/* =========================================================
 * 헤더: 타이틀 로고(아이콘만)
 * ========================================================= */
export const RenderHeaderTitleLogo = memo(function RenderHeaderTitleLogo() {
  return (
    <View style={{paddingBottom: getResponsiveHeight(14)}}>
      <Image
        source={require('../../../assets/icons/kino-logo.png')}
        style={{
          top: getResponsiveHeight(4),
          width: getResponsiveWidth(40),
          height: getResponsiveHeight(40),
          marginLeft: LAYOUT_STYLE().screenPaddingHorizontal - 3,
        }}
      />
    </View>
  );
});

/* =========================================================
 * 헤더: 매거진 아이콘
 * ========================================================= */
export const RenderHeaderBook = memo(function RenderHeaderBook({
  navigation,
  currentScreen = '홈',
}) {
  const bookIcon = require('../../../assets/icons/header/magazine.png');
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
        <Image
          source={bookIcon}
          style={[
            {
              marginLeft: getResponsiveWidth(16),
              width: getResponsiveIconSize(30),
              height: getResponsiveIconSize(30),
              resizeMode: 'contain',
            },
            tint ? {tintColor: tint} : null,
          ]}
        />
      </TouchableOpacity>
    </View>
  );
});

/* =========================================================
 * 헤더: 홈(종 + 설정)
 * - 홈: 큰 원 배경 = #FFC84D
 * - 다른 화면: 큰 원 배경 = #FFFFFF
 * ========================================================= */
export const RenderHeaderHome = memo(function RenderHeaderHome({
  navigation: _navigation,
  currentScreen,
}) {
  const {hasUnread, unreadCount} = useNotificationBadgeState();

  const isHome = currentScreen === '홈';

  const bellIcon = isHome
    ? require('../../../assets/icons/header/bell_white.png')
    : require('../../../assets/icons/header/bell_black.png');

  const settingIcon = isHome
    ? require('../../../assets/icons/header/setting_white.png')
    : require('../../../assets/icons/header/setting_black.png');

  const goAlarm = () => safeNavigate('알림화면', {fromTab: currentScreen});
  const goSetting = () => safeNavigate('설정화면', {fromTab: currentScreen});

  const baseColor = isHome ? '#FFC84D' : '#FFFFFF';
  const styles = useTabHeaderBadgeStyles();

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
          badgeBaseColor={baseColor}
          badgeBaseBorderColor={baseColor}
          badgeBaseSize={10}
          badgeBaseBorderWidth={7.5}
          badgeInnerHeight={9}
          badgeInnerMinWidth={9}
          badgeInnerHPadding={0} // 홈에서는 살짝 더 여유 주기
        />
      </TouchableOpacity>

      <View style={{width: getResponsiveWidth(12)}} />

      {createIconButton(
        goSetting,
        settingIcon,
        HEADER_STYLES().headerRightIconWidth + 3,
        {},
        {},
        null,
      )}
    </View>
  );
});

/* =========================================================
 * 나머지 헤더 버튼들
 * ========================================================= */
export const RenderHeaderLeft1 = memo(function RenderHeaderLeft1() {
  return createIconButton(
    () => safeNavigate('알림화면'),
    require('../../../assets/images/navigator_alarm-button.png'),
    HEADER_STYLES().headerLeftIconWidth,
    {marginLeft: HEADER_STYLES().headerLeftIconLeftPadding},
    {},
    null,
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
    require('../../../assets/images/setting_bt.png'),
    HEADER_STYLES().headerRightIconWidth,
    {marginRight: HEADER_STYLES().headerRightIconRightPadding},
  );
});

export const RenderHeaderRightChatSetting = memo(
  function RenderHeaderRightChatSetting({onPress}) {
    return createIconButton(
      () => onPress?.(),
      require('../../../assets/icons/List_black.png'),
      HEADER_STYLES().headerRightIconWidth,
      {marginRight: HEADER_STYLES().headerRightIconRightPadding},
      {},
    );
  },
);

export const RenderHeaderDeletePost = memo(function RenderHeaderDeletePost() {
  return createIconButton(
    () => {},
    require('../../../assets/images/trash.png'),
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
    require('../../../assets/icons/caretDown_black.png'),
    HEADER_STYLES().headerLeftIconWidth,
    {
      marginLeft:
        HEADER_STYLES().headerLeftIconLeftPadding - getResponsiveWidth(3),
    },
    {zIndex: 999},
    tintColor,
  );
});

export const RenderGoBackButtonGallery = memo(
  function RenderGoBackButtonGallery({navigation, tintColor}) {
    return createIconButton(
      () => navigation.goBack(),
      require('../../../assets/images/navigator_goback-button.png'),
      HEADER_STYLES().headerLeftIconWidth,
      {marginLeft: HEADER_STYLES().headerLeftIconLeftPadding},
      {zIndex: 999},
      tintColor,
    );
  },
);

export const RenderHeaderBackButton = memo(function RenderHeaderBackButton({
  navigation,
  route,
  tintColor = 'black',
 /** 화면에서 뒤로가기 동작을 직접 지정할 때 사용 (예: 알림설정화면 → 설정화면) */
  onBackPressOverride,
}) {
  const fromTab = route?.params?.fromTab;
  const fromScreen = route?.params?.fromScreen;
  const fromParams = route?.params?.fromParams;

  const onPress = useCallback(() => {
    hapticLight();

    if (onBackPressOverride) {
      onBackPressOverride();
      return;
    }

 // 1) 알림설정화면 → 루트 스택에서 한 단계 pop (설정화면으로)
    if (route?.name === '알림설정화면') {
      if (navigationRef?.isReady?.()) {
        navigationRef.dispatch(StackActions.pop(1));
      } else {
        safeNavigate('설정화면');
      }
      return;
    }

 // 2) 설정화면·알림화면 → Tabs 안의 해당 탭(소통/일정/추억 등)으로만 가야 함. reset으로 정확한 탭 지정.
    if (route?.name === '설정화면' || route?.name === '알림화면') {
      const tabToGo = fromTab || getLastFromTabForGlobalScreen() || '홈';
      resetToTabScreen(tabToGo);
      return;
    }

 // 3) 스택에 이전 화면이 있으면 goBack
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }

 // 4) 그 외 fromTab 있으면 해당 탭으로 리셋
    if (fromTab) {
      resetToTabScreen(fromTab);
      return;
    }

 // 5) 그 외: 메인 탭으로 리셋
    safeReset({index: 0, routes: [{name: 'Tabs'}]});
  }, [navigation, route?.name, fromTab, fromScreen, fromParams, onBackPressOverride]);

  return createIconButton(
    onPress,
    require('../../../assets/icons/caretDown_black.png'),
    HEADER_STYLES().headerLeftIconWidth,
    {
      marginLeft:
        HEADER_STYLES().headerLeftIconLeftPadding - getResponsiveWidth(3),
    },
    {zIndex: 999},
    tintColor,
  );
});

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
      <Image
        source={require('../../../assets/images/kinover.png')}
        style={{
          width: getResponsiveWidth(60),
          height: getResponsiveHeight(60),
          marginRight: LAYOUT_STYLE().screenPaddingHorizontal,
          resizeMode: 'contain',
        }}
      />
      <AppText
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
          fontFamily: FONTS.SEMI_BOLD,
          color: currentScreen === '홈' ? '#FFFFFF' : '#111827',
        }}>
        Kinover
      </AppText>
    </TouchableOpacity>
  );
});
