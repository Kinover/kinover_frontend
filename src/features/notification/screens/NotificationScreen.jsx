// src/features/notification/screens/NotificationScreen.js
import React, {useCallback, useEffect, useLayoutEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {
  getResponsiveFontSize,
  getResponsiveWidth,
  getResponsiveHeight,
} from 'utils/responsive';
import YellowSpinner from 'components/yellowSpinner';
import {useNotificationList} from '../hooks/useNotificationList';
import {EMPTY_STYLE, LAYOUT_STYLE} from 'styles/style';
import {useFocusEffect, useNavigation, useRoute, StackActions, CommonActions} from '@react-navigation/native';
import {useDispatch} from 'react-redux';
import {
  getLastFromTabForGlobalScreen,
  setLastFromTabForGlobalScreen,
  getResetToTabState,
} from 'app/navigation/navigationService';
import {RenderHeaderBackButton} from 'app/navigation/helpers/tabHeaderHelpers';

import {
  fetchNotificationsThunk,
  fetchHasUnreadThunk,
  syncAppBadgeThunk,
  markNotificationsReadThunk,
} from '../store/notificationThunk';

export default function NotificationScreen() {
  const AVATAR = getResponsiveWidth(46);
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();

  const {isLoading, error, rows, handlePress} = useNotificationList();

  // 진입 시 복귀할 탭 저장 (params 있으면 사용, 없으면 이미 safeNavigate가 저장한 값 유지 — '홈'으로 덮어쓰지 않음)
  useEffect(() => {
    if (route?.params?.fromTab) {
      setLastFromTabForGlobalScreen(route.params.fromTab);
    } else if (!getLastFromTabForGlobalScreen()) {
      setLastFromTabForGlobalScreen('홈');
    }
  }, [route?.params?.fromTab]);

  // 뒤로가기: pop 사용 → 슬라이드 애니메이션 (detachInactiveScreens: false라 탭 유지)
  useLayoutEffect(() => {
    navigation.setOptions({
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
  }, [navigation, route]);

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
          await dispatch(fetchNotificationsThunk());
          await dispatch(markNotificationsReadThunk());
          await dispatch(fetchHasUnreadThunk());

          if (!alive) return;
          await dispatch(syncAppBadgeThunk());
        } catch (e) {
          null;
        }
      })();

      return () => {
        alive = false;
      };
    }, [dispatch]),
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
        <Text allowFontScaling={false} style={styles.error}>
          오류 발생: {String(error)}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
      {safeRows.map((row, index) => {
        if (row?.type === 'section') {
          return (
            <Text
              allowFontScaling={false}
              key={`sec-${row.key}-${index}`}
              style={styles.sectionTitle}>
              {row.title}
            </Text>
          );
        }

        if (row?.type !== 'item') return null;

        return (
          <TouchableOpacity
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
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.typeBadgeText,
                    {color: row.typeColor || 'black'},
                  ]}>
                  {row.title}
                </Text>
                <Text allowFontScaling={false} style={styles.when}>
                  {row.when}
                </Text>
              </View>

              <Text
                allowFontScaling={false}
                numberOfLines={1}
                style={styles.summary}>
                {row.summary}
              </Text>

              {!!row.preview && (
                <Text
                  allowFontScaling={false}
                  numberOfLines={2}
                  style={styles.content}>
                  {row.preview}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}

      {!hasNotifications && (
        <View style={{paddingVertical: getResponsiveHeight(60)}}>
          <Text allowFontScaling={false} style={styles.empty}>
            아직 새로운 소식이 없어요.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  sectionTitle: {
    marginTop: getResponsiveHeight(14),
    marginBottom: getResponsiveHeight(4),
    fontSize: getResponsiveFontSize(12),
    color: '#8D8D8D',
    fontFamily: 'Pretendard-Medium',
    paddingHorizontal: LAYOUT_STYLE().screenPaddingHorizontal + 5,
  },
  error: {
    fontSize: getResponsiveFontSize(15),
    color: 'red',
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveHeight(15),
    paddingHorizontal: LAYOUT_STYLE().screenPaddingHorizontal + 5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EFEFEF',
    gap: getResponsiveWidth(12),
  },
  cardNew: {backgroundColor: '#FFF9EC'},
  avatarWrap: {position: 'relative'},
  profileImage: {
    borderRadius: getResponsiveWidth(5),
    backgroundColor: '#EAEAEA',
  },
  center: {flex: 1, justifyContent: 'center'},
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(8),
    marginBottom: getResponsiveHeight(4),
  },
  typeBadgeText: {
    fontSize: getResponsiveFontSize(11),
    fontFamily: 'Pretendard-SemiBold',
    fontWeight: '700',
  },
  when: {
    marginLeft: 'auto',
    fontSize: getResponsiveFontSize(10),
    color: '#9A9A9A',
    fontFamily: 'Pretendard-Regular',
  },
  summary: {
    fontSize: getResponsiveFontSize(12.5),
    color: '#1A1A1A',
    fontFamily: 'Pretendard-Medium',
  },
  content: {
    marginTop: getResponsiveHeight(2),
    fontSize: getResponsiveFontSize(12),
    color: '#444',
    fontFamily: 'Pretendard-Regular',
    lineHeight: getResponsiveHeight(18),
  },
  empty: {
    textAlign: 'center',
    fontSize: EMPTY_STYLE().emptyFontSize,
    fontFamily: EMPTY_STYLE().emptyFontFamily,
    color: EMPTY_STYLE().emptyColor,
  },
});
