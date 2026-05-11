// src/features/notification/screens/NotificationScreen.js
import React, {useCallback, useEffect, useLayoutEffect, useMemo} from 'react';
import { View, ScrollView, Dimensions, Image } from 'react-native';
import SpringPressable from 'components/SpringPressable';
import FastImage from '@d11/react-native-fast-image';
import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  getResponsiveFontSize,
  getResponsiveWidth,
  getResponsiveHeight,
} from 'utils/responsive';
import YellowSpinner from 'components/yellowSpinner';
import {useNotificationList} from '../hooks/useNotificationList';
import {EMPTY_STYLE, getHeaderStyles, LAYOUT_STYLE} from 'styles/style';
import {useFocusEffect, useNavigation, useRoute, StackActions, CommonActions} from '@react-navigation/native';
import {useDispatch, useStore} from 'react-redux';
import {useColors} from 'hooks/useColors';
import {
  getLastFromTabForGlobalScreen,
  setLastFromTabForGlobalScreen,
  getResetToTabState,
} from 'app/navigation/navigationService';
import {RenderHeaderBackButton} from 'app/navigation/helpers/tabHeaderHelpers';

import {
  useGetHasUnreadQuery,
  useGetNotificationsQuery,
  useMarkNotificationsReadMutation,
} from '../services/notificationApi';
import {syncAppBadge} from '../utils/syncAppBadge';
import {FONTS} from 'styles/typography';

export default function NotificationScreen() {
  const colors = useColors();
  const styles = useScaledStyleSheet(rf => ({

  container: {flex: 1, backgroundColor: colors.surfaceSecondary},
  sectionTitle: {
    marginTop: getResponsiveHeight(14),
    marginBottom: getResponsiveHeight(4),
    fontSize: rf(12),
    color: colors.textTertiary,
    fontFamily: FONTS.MEDIUM,
    paddingHorizontal: LAYOUT_STYLE().screenPaddingHorizontal + 5,
  },
  error: {
    fontSize: rf(15),
    color: colors.error,
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveHeight(15),
    paddingHorizontal: LAYOUT_STYLE().screenPaddingHorizontal + 5,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderSubtle,
    gap: getResponsiveWidth(12),
  },
  cardNew: {backgroundColor: colors.brandPrimarySoft},
  avatarWrap: {position: 'relative'},
  profileImage: {
    borderRadius: getResponsiveWidth(5),
    backgroundColor: colors.surfaceMuted,
  },
  center: {flex: 1, justifyContent: 'center'},
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(8),
    marginBottom: getResponsiveHeight(4),
  },
  typeBadgeText: {
    fontSize: rf(11),
    fontFamily: FONTS.SEMI_BOLD,
    fontWeight: '700',
  },
  when: {
    marginLeft: 'auto',
    fontSize: rf(10),
    color: colors.textTertiary,
    fontFamily: FONTS.REGULAR,
  },
  summary: {
    fontSize: rf(12.5),
    color: colors.textPrimary,
    fontFamily: FONTS.MEDIUM,
  },
  content: {
    marginTop: getResponsiveHeight(2),
    fontSize: rf(12),
    color: colors.textSecondary,
    fontFamily: FONTS.REGULAR,
    lineHeight: getResponsiveHeight(18),
  },
  emptyWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: getResponsiveHeight(60),
  },
  emptyIcon: {
    width: getResponsiveWidth(34),
    height: getResponsiveWidth(34),
    resizeMode: 'contain',
    tintColor: EMPTY_STYLE().emptyColor,
    marginBottom: getResponsiveHeight(8),
  },
  empty: {
    textAlign: 'center',
    fontSize: EMPTY_STYLE().emptyFontSize,
    fontFamily: EMPTY_STYLE().emptyFontFamily,
    color: EMPTY_STYLE().emptyColor,
  },
  emptySubText: {
    marginTop: getResponsiveHeight(4),
    fontSize: EMPTY_STYLE().emptyFontSize,
    fontFamily: EMPTY_STYLE().emptyFontFamily,
    color: EMPTY_STYLE().emptyColor,
    textAlign: 'center',
  },

  }));
  const AVATAR = getResponsiveWidth(46);
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const store = useStore();
  const {
    data: notificationsPayload,
    isLoading: isNotificationsLoading,
    error: notificationsError,
    refetch: refetchNotifications,
  } = useGetNotificationsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const {refetch: refetchHasUnread} = useGetHasUnreadQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [markNotificationsRead] = useMarkNotificationsReadMutation();

  const {isLoading, error, rows, handlePress} = useNotificationList({
    notifications: notificationsPayload?.notifications ?? [],
    isLoading: isNotificationsLoading,
    error:
      notificationsError?.data ??
      notificationsError?.error ??
      notificationsError?.message ??
      null,
    lastCheckedAt: notificationsPayload?.lastCheckedAt ?? null,
  });

  // 진입 시 복귀할 탭 저장 (params 있으면 사용, 없으면 이미 safeNavigate가 저장한 값 유지 — '홈'으로 덮어쓰지 않음)
  useEffect(() => {
    if (route?.params?.fromTab) {
      setLastFromTabForGlobalScreen(route.params.fromTab);
    } else if (!getLastFromTabForGlobalScreen()) {
      setLastFromTabForGlobalScreen('홈');
    }
  }, [route?.params?.fromTab]);

  const headerTitleTypography = useMemo(
    () => getHeaderStyles(colors),
    [colors],
  );

  // 헤더 타이틀 + 뒤로가기 (pop 사용 → 슬라이드 애니메이션) — Android에서 제목 중앙 정렬
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: '알림',
      headerTitleAlign: 'center',
      headerTitleStyle: {
        fontSize: headerTitleTypography.defaultTitleFontSize,
        fontFamily: headerTitleTypography.defaultTitleFontFamily,
        color: headerTitleTypography.defaultTitleFontColor,
      },
      headerLeft: () => (
        <RenderHeaderBackButton
          navigation={navigation}
          route={route}
          onBackPressOverride={() => {
            if (navigation.canGoBack()) {
              navigation.dispatch(StackActions.pop(1));
            } else {
              const tab = getLastFromTabForGlobalScreen() || route?.params?.fromTab || '홈';
              navigation.dispatch(CommonActions.reset(getResetToTabState(tab)));
            }
          }}
        />
      ),
    });
  }, [navigation, route, headerTitleTypography]);

  const safeRows = useMemo(() => (Array.isArray(rows) ? rows : []), [rows]);
  const hasNotifications = useMemo(
    () => safeRows.some(r => r?.type === 'item'),
    [safeRows],
  );

  useFocusEffect(
    useCallback(() => {
      let alive = true;

      (async () => {
        try {
          await refetchNotifications();
          await markNotificationsRead().unwrap();
          await refetchHasUnread();

          if (!alive) return;
          await syncAppBadge({dispatch, getState: store.getState});
        } catch (e) {
          null;
        }
      })();

      return () => {
        alive = false;
      };
    }, [dispatch, markNotificationsRead, refetchHasUnread, refetchNotifications, store]),
  );

  if (isLoading) {
    return (
      <View style={[styles.container, {justifyContent: 'center'}]}>
        <YellowSpinner />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, {justifyContent: 'center'}]}>
        <AppText allowFontScaling={false} style={styles.error}>
          오류 발생: {String(error)}
        </AppText>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
      {safeRows.map((row, index) => {
        if (row?.type === 'section') {
          return (
            <AppText
              allowFontScaling={false}
              key={`sec-${row.key}-${index}`}
              style={styles.sectionTitle}>
              {row.title}
            </AppText>
          );
        }

        if (row?.type !== 'item') return null;

        return (
          <SpringPressable
            key={`n-${row.key}-${index}`}
            activeOpacity={0.8}
            onPress={() => handlePress(row.notification)}
            style={[styles.card, row.isNew && styles.cardNew]}>
            <View style={styles.avatarWrap}>
              <FastImage
                      fallback={true}

                source={
                  row.leftImageUrl
                    ? {uri: row.leftImageUrl}
                    : require('../../../assets/images/default.png')
                }
                style={[styles.profileImage, {width: AVATAR, height: AVATAR}]}
              />
            </View>

            <View style={styles.center}>
              <View style={styles.rowTop}>
                <AppText
                  allowFontScaling={false}
                  style={[
                    styles.typeBadgeText,
                    {color: row.typeColor || 'black'},
                  ]}>
                  {row.title}
                </AppText>
                <AppText allowFontScaling={false} style={styles.when}>
                  {row.when}
                </AppText>
              </View>

              <AppText
                allowFontScaling={false}
                numberOfLines={1}
                style={styles.summary}>
                {row.summary}
              </AppText>

              {!!row.preview && (
                <AppText
                  allowFontScaling={false}
                  numberOfLines={2}
                  style={styles.content}>
                  {row.preview}
                </AppText>
              )}
            </View>
          </SpringPressable>
        );
      })}

      {!hasNotifications && (
        <View style={[styles.emptyWrapper, {minHeight: Dimensions.get('window').height * 0.72}]}>
          <Image
            source={require('assets/icons/header/bell_black.png')}
            style={styles.emptyIcon}
          />
          <AppText allowFontScaling={false} style={styles.empty}>
            아직 새로운 소식이 없어요.
          </AppText>
          <AppText allowFontScaling={false} style={styles.emptySubText}>
            가족이 활동하면 여기서 알려드려요.
          </AppText>
        </View>
      )}
    </ScrollView>
  );
}

