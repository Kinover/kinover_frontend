/* eslint-disable react-native/no-inline-styles */
import React, {
  useCallback,
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useFocusEffect, useNavigation, useRoute} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import AppText from 'components/AppText';
import {RenderHeaderBackButton} from 'app/navigation/helpers/tabHeaderHelpers';
import {
  getLastFromTabForGlobalScreen,
  setLastFromTabForGlobalScreen,
  getResetToTabState,
} from 'app/navigation/navigationService';
import {StackActions, CommonActions} from '@react-navigation/native';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';
import {SETTING_STYLES} from 'styles/style';
import useHideTabBar from 'hooks/useHideTabBar';
import {
  getLocalBlockedUserIds,
  addLocalBlockedUserId,
  removeLocalBlockedUserId,
} from 'features/moderation/utils/blockedUsersStorage';
import {
  useUnblockUserMutation,
  useCreateReportMutation,
} from 'features/moderation/services/moderationApi';
import ReportReasonSheet from 'features/moderation/components/ReportReasonSheet';
import {buildCreateReportBody} from 'features/moderation/utils/buildReportBody';
import {
  addBlockedUserId,
  removeBlockedUserId,
  setBlockedUserIds,
} from 'features/moderation/store/blockedUsersSlice';
import {
  useGetUserQuery,
  useGetFamilyUsersQuery,
} from 'features/home/services/homeApi';
import {promptBlockFamilyUser} from 'features/moderation/utils/promptBlockFamilyUser';
import {FONTS} from 'styles/typography';

function memberLabel(m) {
  const raw = (m?.name ?? m?.nickname ?? '').trim();
  return raw.length > 0 ? raw : '가족 구성원';
}

function memberIdOf(m) {
  const raw = m?.userId ?? m?.id;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export default function BlockedUsersScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  useHideTabBar();

  const fallbackUser = useSelector(state => state.user);
  const {
    data: userData,
    isLoading: isUserLoading,
    isError: isUserError,
  } = useGetUserQuery();
  const user = userData ?? fallbackUser ?? {};

  const familyId = user?.familyId ?? user?.family?.familyId ?? null;
  const myUserId = user?.userId ?? user?.id ?? null;

  const {
    data: familyUsersRaw,
    isLoading: isFamilyUsersLoading,
    isError: isFamilyUsersError,
    refetch: refetchFamilyUsers,
  } = useGetFamilyUsersQuery(familyId, {skip: !familyId});

  const familyUsers = Array.isArray(familyUsersRaw) ? familyUsersRaw : [];

  const blockableMembers = useMemo(() => {
    return familyUsers.filter(m => {
      const oid = memberIdOf(m);
      if (oid == null) return false;
      if (myUserId != null && String(oid) === String(myUserId)) return false;
      return true;
    });
  }, [familyUsers, myUserId]);

  const [blockedIds, setBlockedIds] = useState([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [reportVisible, setReportVisible] = useState(false);
  const [reportUserCtx, setReportUserCtx] = useState(null);
  const [unblockUser, {isLoading: unblocking}] = useUnblockUserMutation();
  const [createReport] = useCreateReportMutation();

  const reloadLocal = useCallback(async () => {
    setLocalLoading(true);
    try {
      const list = await getLocalBlockedUserIds();
      setBlockedIds(list);
      dispatch(setBlockedUserIds(list));
    } catch {
      setBlockedIds([]);
      dispatch(setBlockedUserIds([]));
    } finally {
      setLocalLoading(false);
    }
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      reloadLocal();
    }, [reloadLocal]),
  );

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
              const tab =
                getLastFromTabForGlobalScreen() ||
                route?.params?.fromTab ||
                '홈';
              navigation.dispatch(CommonActions.reset(getResetToTabState(tab)));
            }
          }}
        />
      ),
    });
  }, [navigation, route]);

  useEffect(() => {
    if (route?.params?.fromTab) {
      setLastFromTabForGlobalScreen(route.params.fromTab);
    } else if (!getLastFromTabForGlobalScreen()) {
      setLastFromTabForGlobalScreen('홈');
    }
  }, [route?.params?.fromTab]);

  const blockedSet = useMemo(
    () => new Set(blockedIds.map(Number).filter(Number.isFinite)),
    [blockedIds],
  );

  const styles = useScaledStyleSheet(rf => {
    const S = SETTING_STYLES();
    return {
      root: {
        flex: 1,
        backgroundColor: '#fff',
      },
      center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: getResponsiveWidth(24),
      },
      scroll: {
        flex: 1,
      },
      scrollContent: {
        paddingBottom: getResponsiveHeight(32),
      },
      sectionTitle: {
        fontSize: rf(12.5),
        color: '#888',
        marginTop: getResponsiveHeight(16),
        marginBottom: getResponsiveHeight(8),
        paddingHorizontal: getResponsiveWidth(20),
        fontFamily: FONTS.MEDIUM,
      },
      hint: {
        textAlign: 'center',
        fontSize: S.labelFontSize ?? rf(14),
        fontFamily: S.labelFontFamily ?? FONTS.REGULAR,
        color: '#6B7280',
        lineHeight: rf(20),
      },
      inlineHint: {
        fontSize: rf(13),
        fontFamily: FONTS.REGULAR,
        color: '#6B7280',
        lineHeight: rf(19),
        paddingHorizontal: getResponsiveWidth(20),
        paddingVertical: getResponsiveHeight(8),
      },
      row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: getResponsiveWidth(20),
        paddingVertical: getResponsiveHeight(14),
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(17,24,39,0.06)',
      },
      memberCol: {
        flex: 1,
        paddingRight: getResponsiveWidth(12),
        minWidth: 0,
      },
      nameText: {
        fontSize: rf(15),
        fontFamily: FONTS.MEDIUM,
        color: '#111827',
      },
      blockedRowLabel: {
        flex: 1,
        fontSize: rf(15),
        fontFamily: FONTS.MEDIUM,
        color: '#111827',
        paddingRight: getResponsiveWidth(12),
      },
      subId: {
        fontSize: rf(12),
        fontFamily: FONTS.REGULAR,
        color: '#9CA3AF',
        marginTop: 2,
      },
      blockBtn: {
        paddingVertical: getResponsiveHeight(8),
        paddingHorizontal: getResponsiveWidth(14),
        borderRadius: 10,
        backgroundColor: 'rgba(239,68,68,0.12)',
      },
      blockBtnLabel: {
        fontSize: rf(13),
        fontFamily: FONTS.SEMI_BOLD,
        color: '#B91C1C',
      },
      blockedPill: {
        paddingVertical: getResponsiveHeight(8),
        paddingHorizontal: getResponsiveWidth(12),
      },
      blockedPillText: {
        fontSize: rf(13),
        fontFamily: FONTS.MEDIUM,
        color: '#9CA3AF',
      },
      unblockBtn: {
        paddingVertical: getResponsiveHeight(8),
        paddingHorizontal: getResponsiveWidth(14),
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
      },
      unblockLabel: {
        fontSize: rf(13),
        fontFamily: FONTS.SEMI_BOLD,
        color: '#374151',
      },
      rowActions: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 0,
        gap: getResponsiveWidth(8),
      },
      reportBtn: {
        paddingVertical: getResponsiveHeight(8),
        paddingHorizontal: getResponsiveWidth(12),
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(17,24,39,0.12)',
        backgroundColor: '#fff',
      },
      reportBtnLabel: {
        fontSize: rf(13),
        fontFamily: FONTS.SEMI_BOLD,
        color: '#374151',
      },
    };
  });

  const onUnblock = useCallback(
    userId => {
      Alert.alert('차단 해제', '이 계정의 차단을 해제할까요?', [
        {text: '취소', style: 'cancel'},
        {
          text: '해제',
          onPress: async () => {
            try {
              await unblockUser(userId).unwrap();
              await removeLocalBlockedUserId(userId);
              dispatch(removeBlockedUserId(userId));
              await reloadLocal();
            } catch {
              Alert.alert(
                '오류',
                '차단 해제에 실패했어요. 네트워크를 확인한 뒤 다시 시도해 주세요.',
              );
            }
          },
        },
      ]);
    },
    [unblockUser, reloadLocal, dispatch],
  );

  const onPressBlockMember = useCallback(
    uid => {
      promptBlockFamilyUser(uid, {onSuccess: reloadLocal});
    },
    [reloadLocal],
  );

  const openReportUser = useCallback(uid => {
    const n = Number(uid);
    if (!Number.isFinite(n)) return;
    setReportUserCtx({targetType: 'USER', targetUserId: n});
    setReportVisible(true);
  }, []);

  const submitUserReport = useCallback(
    async reasonCode => {
      if (!reportUserCtx) return;
      const targetId = Number(reportUserCtx.targetUserId);
      try {
        const body = buildCreateReportBody(reportUserCtx, reasonCode);
        await createReport(body).unwrap();
        setReportVisible(false);
        setReportUserCtx(null);

        if (Number.isFinite(targetId)) {
          dispatch(addBlockedUserId(targetId));
          try {
            await addLocalBlockedUserId(targetId);
          } catch {
            // MMKV 실패 시 Redux만 반영
          }
          setBlockedIds(prev => {
            if (prev.includes(targetId)) return prev;
            return [...prev, targetId];
          });
        }

        Alert.alert('', '신고가 접수되었어요.');
      } catch {
        Alert.alert(
          '오류',
          '신고 접수에 실패했어요. 잠시 후 다시 시도해 주세요.',
        );
      }
    },
    [reportUserCtx, createReport, dispatch],
  );

  const showInitialSpinner =
    isUserLoading || localLoading || (!!familyId && isFamilyUsersLoading);

  if (showInitialSpinner) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const showEmptyCenter =
    !familyId && blockedIds.length === 0 && !isUserError;

  if (showEmptyCenter) {
    return (
      <View style={styles.center}>
        <AppText allowFontScaling={false} style={styles.hint}>
          가족에 참여한 뒤 여기에서 구성원을 신고하거나 차단할 수 있어요.{'\n\n'}
          유저 신고가 접수되면 서버 정책에 따라 자동으로 차단될 수 있어요.{'\n\n'}
          차단한 계정은 아래 목록에서 관리할 수 있어요.
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <AppText allowFontScaling={false} style={styles.sectionTitle}>
          가족 구성원
        </AppText>
        {!familyId ? (
          <AppText allowFontScaling={false} style={styles.inlineHint}>
            가족 정보를 불러오지 못했어요. 잠시 후 다시 열어 주세요.
          </AppText>
        ) : isFamilyUsersError ? (
          <View style={styles.row}>
            <AppText allowFontScaling={false} style={styles.blockedRowLabel}>
              구성원 목록을 불러오지 못했어요.
            </AppText>
            <TouchableOpacity
              style={styles.unblockBtn}
              onPress={() => refetchFamilyUsers()}
              activeOpacity={0.85}>
              <AppText allowFontScaling={false} style={styles.unblockLabel}>
                다시 시도
              </AppText>
            </TouchableOpacity>
          </View>
        ) : blockableMembers.length === 0 ? (
          <AppText allowFontScaling={false} style={styles.inlineHint}>
            다른 가족 구성원이 없어요.
          </AppText>
        ) : (
          blockableMembers.map(m => {
            const uid = memberIdOf(m);
            if (uid == null) return null;
            const blocked = blockedSet.has(uid);
            return (
              <View key={String(uid)} style={styles.row}>
                <View style={styles.memberCol}>
                  <AppText allowFontScaling={false} style={styles.nameText}>
                    {memberLabel(m)}
                  </AppText>
                  <AppText allowFontScaling={false} style={styles.subId}>
                    ID {uid}
                  </AppText>
                </View>
                <View style={styles.rowActions}>
                  <TouchableOpacity
                    style={styles.reportBtn}
                    onPress={() => openReportUser(uid)}
                    activeOpacity={0.85}>
                    <AppText
                      allowFontScaling={false}
                      style={styles.reportBtnLabel}>
                      신고
                    </AppText>
                  </TouchableOpacity>
                  {blocked ? (
                    <View style={styles.blockedPill}>
                      <AppText
                        allowFontScaling={false}
                        style={styles.blockedPillText}>
                        차단됨
                      </AppText>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.blockBtn}
                      onPress={() => onPressBlockMember(uid)}
                      activeOpacity={0.85}>
                      <AppText
                        allowFontScaling={false}
                        style={styles.blockBtnLabel}>
                        차단
                      </AppText>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}

        <AppText allowFontScaling={false} style={styles.sectionTitle}>
          차단한 계정
        </AppText>
        {blockedIds.length === 0 ? (
          <AppText allowFontScaling={false} style={styles.inlineHint}>
            아직 차단한 계정이 없어요. 위에서 신고 또는 차단할 수 있어요. 신고
            후에는 차단까지 이어서 할 수 있어요.
          </AppText>
        ) : (
          blockedIds.map(item => (
            <View key={String(item)} style={styles.row}>
              <AppText allowFontScaling={false} style={styles.blockedRowLabel}>
                사용자 ID {item}
              </AppText>
              <View style={styles.rowActions}>
                <TouchableOpacity
                  style={styles.reportBtn}
                  onPress={() => openReportUser(item)}
                  activeOpacity={0.85}>
                  <AppText
                    allowFontScaling={false}
                    style={styles.reportBtnLabel}>
                    신고
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.unblockBtn}
                  disabled={unblocking}
                  onPress={() => onUnblock(item)}
                  activeOpacity={0.85}>
                  <AppText allowFontScaling={false} style={styles.unblockLabel}>
                    해제
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <ReportReasonSheet
        visible={reportVisible}
        onClose={() => {
          setReportVisible(false);
          setReportUserCtx(null);
        }}
        onSelectReason={submitUserReport}
      />
    </View>
  );
}
