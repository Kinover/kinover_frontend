/* eslint-disable react-native/no-inline-styles */
// src/features/post/components/MemoryDetailBottomSheet.js

import React, {useMemo, useCallback, useState, useRef, useEffect} from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  FlatList,
  Image,
  Platform,
  Pressable,
  Keyboard,
  TextInput,
} from 'react-native';

import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet';

import {useSafeAreaInsets} from 'react-native-safe-area-context';
import FastImage from '@d11/react-native-fast-image';

const {Swipeable} = require('react-native-gesture-handler');

import {getResponsiveHeight, getResponsiveWidth} from 'utils/responsive';
import {useKeyboardHandler} from 'react-native-keyboard-controller';
import {runOnJS} from 'react-native-reanimated';
import {COLORS, EMPTY_STYLE} from 'styles/style';
import BOTTOM_SHEET_TITLES from 'constants/bottomSheetTitles';
const ACTION_W = getResponsiveWidth(70);
const INPUT_H = getResponsiveHeight(46);
const INPUT_SIDE_PAD = getResponsiveWidth(16);

/* =========================
 * Mention Utils
 * ========================= */
function escapeRegExp(str) {
  return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractMentionUserIds(text, users) {
  if (!text?.trim() || !Array.isArray(users) || users.length === 0) return [];

  const ids = new Set();
  for (const u of users) {
    if (!u?.name || u?.userId == null) continue;

    const re = new RegExp(
      `(^|\\s)@${escapeRegExp(u.name)}(?=\\s|$|[.,!?…])`,
      'g',
    );
    if (re.test(text)) ids.add(String(u.userId));
  }
  return Array.from(ids);
}

function findActiveMentionQuery(text, cursor) {
  const before = (text || '').slice(0, cursor);
  const match = before.match(/(^|\s)@([^\s@]{0,20})$/);
  if (!match) return null;

  const query = match[2] ?? '';
  const atIndex = before.lastIndexOf('@');
  if (atIndex < 0) return null;

  return {query, atIndex};
}

function applyMention(text, atIndex, cursor, name) {
  const beforeAt = (text || '').slice(0, atIndex);
  const afterToken = (text || '').slice(cursor);
  const next = `${beforeAt}@${name} ${afterToken}`;
  const nextCursor = (beforeAt + `@${name} `).length;
  return {next, nextCursor};
}

/* =========================
 * MentionText
 * ========================= */
function MentionText({text, familyUsers, textStyle, mentionStyle = null}) {
  const nameMap = useMemo(() => {
    const m = new Map();
    (familyUsers || []).forEach(u => {
      if (u?.name) m.set(u.name, u);
    });
    return m;
  }, [familyUsers]);

  const parts = useMemo(() => {
    if (!text) return [''];
    return String(text).split(/(@[^\s@]{1,20})/g);
  }, [text]);

  return (
    <AppText style={textStyle}>
      {parts.map((p, idx) => {
        if (p?.startsWith('@')) {
          const name = p.slice(1);
          const user = nameMap.get(name);
          if (user) {
            return (
              <AppText
                key={`${idx}_${p}`}
                style={mentionStyle}>
                {p}
              </AppText>
            );
          }
        }
        return (
          <AppText key={`${idx}_${p}`}>
            {p}
          </AppText>
        );
      })}
    </AppText>
  );
}

/* =========================
 * Footer (불투명 배경 바)
 * ========================= */
function CommentFooter({
  styles,
  initialText,
  onSubmitComment,
  onChangeComment,
  familyUsers = [],
  myUserId,
  onFooterLayoutHeight,
  disabled = false,
}) {
  const insets = useSafeAreaInsets();
  const draftRef = useRef(initialText || '');
  const inputRef = useRef(null);
  const rawBottomInset = Number(insets.bottom || 0);
  const footerBasePad = getResponsiveHeight(8);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const showEvt =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const subShow = Keyboard.addListener(showEvt, () => setKeyboardOpen(true));
    const subHide = Keyboard.addListener(hideEvt, () => setKeyboardOpen(false));
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  const contentBottomPad = keyboardOpen
    ? 0
    : Math.max(rawBottomInset, 0) + getResponsiveHeight(16);

  const [cursor, setCursor] = useState(0);
  const [draftText, setDraftText] = useState(initialText || '');

  useEffect(() => {
    const next = initialText || '';
    draftRef.current = next;
    setDraftText(next);
    setCursor(next.length);

    requestAnimationFrame(() => {
      inputRef.current?.setNativeProps?.({text: next});
    });
  }, [initialText]);

  const activeMention = useMemo(
    () => findActiveMentionQuery(draftText, cursor),
    [draftText, cursor],
  );

  const mentionCandidates = useMemo(() => {
    if (!activeMention) return [];
    const q = (activeMention.query || '').toLowerCase().trim();
    const me = myUserId == null ? null : String(myUserId);

    const list = (familyUsers || [])
      .filter(u => !!u?.name && u?.userId != null)
      .filter(u => (me ? String(u.userId) !== me : true));

    if (!q) return list.slice(0, 6);
    return list
      .filter(u => String(u.name).toLowerCase().includes(q))
      .slice(0, 6);
  }, [activeMention, familyUsers, myUserId]);

  const handlePickMention = useCallback(
    user => {
      if (disabled) return;
      if (!activeMention) return;

      const current = String(draftRef.current || '');
      const {next, nextCursor} = applyMention(
        current,
        activeMention.atIndex,
        cursor,
        user.name,
      );

      draftRef.current = next;
      setDraftText(next);
      setCursor(nextCursor);

      requestAnimationFrame(() => {
        if (inputRef.current?.setNativeProps) {
          inputRef.current.setNativeProps({
            selection: {start: nextCursor, end: nextCursor},
          });
        }
      });
    },
    [activeMention, cursor, disabled],
  );

  const handleSubmit = useCallback(() => {
    if (disabled) return;

    const next = String(draftRef.current || '').trim();
    if (!next) return;

    const me = myUserId == null ? null : String(myUserId);
    const mentionUserIds = extractMentionUserIds(next, familyUsers).filter(id =>
      me ? String(id) !== me : true,
    );

    onChangeComment?.(next);
    onSubmitComment?.({content: next, mentionUserIds});

    draftRef.current = '';
    setDraftText('');
    setCursor(0);
    inputRef.current?.setNativeProps?.({text: ''});
  }, [familyUsers, myUserId, onChangeComment, onSubmitComment, disabled]);

  const canSubmitComment = !disabled && String(draftText || '').trim().length > 0;

  return (
    <View
      style={{paddingBottom: contentBottomPad, backgroundColor: '#F9F9F9'}}
      onLayout={e => {
        const h = e?.nativeEvent?.layout?.height ?? 0;
        if (h > 0) onFooterLayoutHeight?.(h);
      }}>
      <View
        style={[
          styles.footerBar,
          {
            paddingTop: footerBasePad,
            paddingBottom: footerBasePad,
          },
        ]}>
        {!!activeMention && mentionCandidates.length > 0 && !disabled && (
          <View
            style={[
              styles.mentionDropdown,
              {bottom: INPUT_H + getResponsiveHeight(10)},
            ]}
            pointerEvents="box-none">
            <View style={styles.mentionDropdownBox}>
              <FlatList
                keyboardShouldPersistTaps="always"
                data={mentionCandidates}
                keyExtractor={item => String(item.userId)}
                renderItem={({item}) => (
                  <Pressable
                    onPress={() => handlePickMention(item)}
                    style={({pressed}) => [
                      styles.mentionItem,
                      pressed && {opacity: 0.86},
                    ]}>
                    <Image
                      source={
                        item.image
                          ? {uri: item.image}
                          : require('assets/images/default.png')
                      }
                      style={styles.mentionAvatar}
                    />
                    <AppText
                      style={styles.mentionName}
                      numberOfLines={1}>
                      {item.name}
                    </AppText>
                    <AppText style={styles.mentionHint}>
                      @{item.name}
                    </AppText>
                  </Pressable>
                )}
              />
            </View>
          </View>
        )}

        <View
          style={[styles.commentInputContainer, disabled && {opacity: 0.55}]}>
          {/* Android: 일반 TextInput 사용 (BottomSheetTextInput의 gorhom 키보드 핸들링이 Android에서 동작 안 함) */}
          {/* iOS: BottomSheetTextInput 유지 (interactive 키보드 동작 정상) */}
          {Platform.OS === 'android' ? (
            <TextInput
              ref={inputRef}
              editable={!disabled}
              style={styles.commentInput}
              placeholder={
                disabled
                  ? '지금은 댓글을 작성할 수 없어요'
                  : '댓글을 달아보세요 ( @가족이름 멘션 가능 )'
              }
              placeholderTextColor="#999"
              value={draftText}
              onChangeText={t => {
                if (disabled) return;
                draftRef.current = t;
                setDraftText(t);
                setCursor(t.length);
              }}
              onSelectionChange={e => {
                if (disabled) return;
                const start = e?.nativeEvent?.selection?.start ?? 0;
                setCursor(start);
              }}
              returnKeyType="send"
              onSubmitEditing={handleSubmit}
              blurOnSubmit={false}
            />
          ) : (
            <BottomSheetTextInput
              ref={inputRef}
              editable={!disabled}
              style={styles.commentInput}
              placeholder={
                disabled
                  ? '지금은 댓글을 작성할 수 없어요'
                  : '댓글을 달아보세요 ( @가족이름 멘션 가능 )'
              }
              placeholderTextColor="#999"
              value={draftText}
              onChangeText={t => {
                if (disabled) return;
                draftRef.current = t;
                setDraftText(t);
                setCursor(t.length);
              }}
              onSelectionChange={e => {
                if (disabled) return;
                const start = e?.nativeEvent?.selection?.start ?? 0;
                setCursor(start);
              }}
              returnKeyType="send"
              onSubmitEditing={handleSubmit}
              blurOnSubmit={false}
            />
          )}

          <TouchableOpacity
            onPress={handleSubmit}
            activeOpacity={0.9}
            disabled={!canSubmitComment}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            style={[
              styles.commentSendTouchArea,
              !canSubmitComment && {opacity: 0.6},
            ]}>
            <Image
              style={[
                styles.commentSendBt,
                !canSubmitComment && styles.commentSendBtInactive,
              ]}
              source={require('assets/icons/sendBt-dark.png')}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function MemoryDetailBottomSheet({
  sheetRef,
  memory: _memory,
  commentList = [],
  user,
  commentText,
  onChangeComment,
  onSubmitComment,
  onDeleteComment,
  snapPoints: snapPointsProp,
  backgroundColor = '#F9F9F9',
  familyUsers = [],
  myUserId,
  onSheetChange,
  disabled = false,
}) {
  const styles = useScaledStyleSheet(rf => ({
  sheetInner: {},
  sheetBackground: {
    borderTopLeftRadius: getResponsiveWidth(18),
    borderTopRightRadius: getResponsiveWidth(18),
  },
  sheetHandle: {
    width: getResponsiveWidth(48),
    height: getResponsiveHeight(4),
    backgroundColor: 'rgba(156,163,175,0.45)',
  },
  commentSheetHeader: {
    paddingTop: getResponsiveHeight(12),
    paddingBottom: getResponsiveHeight(16),
    paddingHorizontal: getResponsiveWidth(14),
    backgroundColor: '#F9F9F9',
  },
  commentHeaderRow: {
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: getResponsiveHeight(16),
    minHeight: getResponsiveHeight(24),
  },
  commentSheetTitle: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: rf(18.5),
    color: '#111827',
    textAlign: 'center',
  },
  commentCountText: {
    marginLeft: getResponsiveWidth(6),
    fontFamily: 'Pretendard-Regular',
    fontSize: rf(12.5),
    color: '#9CA3AF',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: getResponsiveWidth(4),
  },
  closeButtonIcon: {
    width: getResponsiveWidth(22),
    height: getResponsiveWidth(22),
    resizeMode: 'contain',
    tintColor: '#6B7280',
  },
  commentSheetDivider: {
    height: 1,
    backgroundColor: 'rgba(17,24,39,0.1)',
  },

  commentBox: {
    paddingHorizontal: getResponsiveWidth(14),
    paddingVertical: getResponsiveHeight(10),
  },
  commentBoxSwiped: {
    backgroundColor: '#F3F4F6',
    borderRadius: getResponsiveWidth(10),
  },
  commentRow: {flexDirection: 'row'},
  commentWriterImage: {
    width: getResponsiveWidth(34),
    height: getResponsiveWidth(34),
    borderRadius: getResponsiveWidth(17),
    backgroundColor: '#D9D9D9',
    marginRight: getResponsiveWidth(10),
  },
  commentTextCol: {flex: 1},
  nameTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  commentWriter: {
    fontFamily: 'Pretendard-Medium',
    fontSize: rf(13),
    color: '#000',
  },
  timeText: {
    fontSize: rf(10),
    color: '#999',
  },
  commentContent: {
    marginTop: getResponsiveHeight(4),
    fontFamily: 'Pretendard-Regular',
    fontSize: rf(12),
    lineHeight: rf(15),
    color: '#000',
  },
  commentList: {
    flex: 1,
  },
  mentionText: {
    color: '#111827',
    fontFamily: 'Pretendard-SemiBold',
    backgroundColor: 'rgba(255,200,77,0.22)',
    paddingHorizontal: getResponsiveWidth(6),
    paddingVertical: getResponsiveHeight(2),
    borderRadius: 8,
  },

  emptyContainer: {
    flex: 1,
    minHeight: getResponsiveHeight(240),
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: EMPTY_STYLE().emptyFontSize,
    fontFamily: EMPTY_STYLE().emptyFontFamily,
    color: EMPTY_STYLE().emptyColor,
  },
  emptySubText: {
    marginTop: getResponsiveHeight(4),
    textAlign: 'center',
    fontSize: EMPTY_STYLE().emptyFontSize,
    fontFamily: EMPTY_STYLE().emptyFontFamily,
    color: EMPTY_STYLE().emptyColor,
  },

  rightActionContainer: {
    width: ACTION_W,
    justifyContent: 'center',
  },
  deleteAction: {
    flex: 1,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteActionText: {
    color: '#FFF',
    fontFamily: 'Pretendard-SemiBold',
  },

  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: getResponsiveHeight(26),
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: getResponsiveHeight(26),
  },

  footerBar: {
    backgroundColor: '#F9F9F9',
    borderTopWidth: 1,
    borderTopColor: 'rgba(17,24,39,0.08)',
    paddingTop: getResponsiveHeight(8),
    paddingHorizontal: getResponsiveWidth(14),
    paddingBottom: getResponsiveHeight(10),
  },

  commentInputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81,0.45)',
    borderRadius: getResponsiveWidth(10),
    paddingHorizontal: INPUT_SIDE_PAD,
    height: INPUT_H,
    backgroundColor: '#F5F5F5',
  },
  commentInput: {
    flex: 1,
    fontSize: rf(14),
    fontFamily: 'Pretendard-Regular',
    lineHeight: getResponsiveHeight(17),
    color: '#000',
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  commentSendBt: {
    width: getResponsiveWidth(24),
    height: getResponsiveWidth(24),
  },
  commentSendTouchArea: {
    minWidth: getResponsiveWidth(40),
    minHeight: getResponsiveWidth(40),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -getResponsiveWidth(4),
  },
  commentSendBtInactive: {
    tintColor: COLORS.textTertiary,
    transform: [{scale: 0.85}],
  },

  mentionDropdown: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 20,
  },
  mentionDropdownBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.10)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: Platform.OS === 'ios' ? 0.08 : 0.2,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 6},
  },
  mentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(10),
    paddingHorizontal: getResponsiveWidth(12),
    paddingVertical: getResponsiveHeight(10),
  },
  mentionAvatar: {
    width: getResponsiveWidth(28),
    height: getResponsiveWidth(28),
    borderRadius: 999,
    backgroundColor: 'rgba(255,200,77,0.15)',
  },
  mentionName: {
    flex: 1,
    minWidth: 0,
    color: COLORS.textPrimary,
    fontFamily: 'Pretendard-Medium',
    fontSize: rf(13.5),
  },
  mentionHint: {
    color: '#6B7280',
    fontFamily: 'Pretendard-Medium',
    fontSize: rf(12),
  },

  }));
  const isSamsungAndroid = useMemo(() => {
    if (Platform.OS !== 'android') return false;
    const brand = String(
      Platform?.constants?.Brand ??
        Platform?.constants?.brand ??
        Platform?.constants?.Manufacturer ??
        '',
    ).toLowerCase();
    return brand.includes('samsung');
  }, []);

  const snapPoints = useMemo(() => {
    if (snapPointsProp) return snapPointsProp;
    return [isSamsungAndroid ? '83%' : '78%'];
  }, [snapPointsProp, isSamsungAndroid]);
  const isAndroid = Platform.OS === 'android';

  // Android 전용: 키보드 높이 추적 → bottomInset으로 시트 전체를 키보드 위로 올림
  // (BottomSheetModal은 React Native Modal 기반이라 manifest adjustResize가 적용 안 됨)
  // useKeyboardHandler: WindowInsetsAnimationCompat API 기반으로
  // 자동완성 바·삼성 플로팅 툴바 포함한 정확한 높이를 UI 스레드에서 추적
  const [androidKeyboardHeight, setAndroidKeyboardHeight] = useState(0);

  useKeyboardHandler(
    {
      onEnd: e => {
        'worklet';
        if (!isAndroid) return;
        runOnJS(setAndroidKeyboardHeight)(e.height);
      },
    },
    [isAndroid],
  );

  const listRef = useRef(null);
  const [openedSwipeCommentId, setOpenedSwipeCommentId] = useState(null);

  const [footerLayoutH, setFooterLayoutH] = useState(
    INPUT_H + getResponsiveHeight(20),
  );
  const commentCount = Array.isArray(commentList) ? commentList.length : 0;
  const emptyBottomOffset = useMemo(
    () => Math.max(getResponsiveHeight(18), Math.round(footerLayoutH * 0.34)),
    [footerLayoutH],
  );

  useEffect(() => {
    if (!commentList?.length) {
      setOpenedSwipeCommentId(null);
      return;
    }

    const exists = commentList.some(
      c => String(c?.commentId) === String(openedSwipeCommentId),
    );
    if (!exists) setOpenedSwipeCommentId(null);
  }, [commentList, openedSwipeCommentId]);

  const renderBackdrop = useCallback(
    props => (
      <BottomSheetBackdrop
        {...props}
        opacity={0.65}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  const isMyComment = useCallback(
    c => {
      const me = user?.userId;
      if (me == null) return false;

      const meId = String(me);
      const author = c?.authorId ?? c?.userId;
      if (author == null) return false;

      return String(author) === meId;
    },
    [user?.userId],
  );

  const renderRightActions = useCallback(
    (commentId, progress) => {
      const translateX = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [ACTION_W, 0],
        extrapolate: 'clamp',
      });

      return (
        <View style={styles.rightActionContainer}>
          <Animated.View style={{flex: 1, transform: [{translateX}]}}>
            <TouchableOpacity
              style={styles.deleteAction}
              activeOpacity={0.85}
              onPress={() => {
                if (disabled) return;
                onDeleteComment?.(commentId);
              }}>
              <AppText style={styles.deleteActionText}>
                삭제
              </AppText>
            </TouchableOpacity>
          </Animated.View>
        </View>
      );
    },
    [onDeleteComment, disabled],
  );

  const renderCommentItem = useCallback(
    ({item}) => {
      const mine = isMyComment(item);
      const isSwipeOpened =
        openedSwipeCommentId != null &&
        String(openedSwipeCommentId) === String(item?.commentId);

      const body = (
        <View
          style={[
            styles.commentBox,
            isSwipeOpened && styles.commentBoxSwiped,
          ]}>
          <View style={styles.commentRow}>
            <FastImage
              fallback={true}
              style={styles.commentWriterImage}
              source={{uri: item.authorImage}}
            />
            <View style={styles.commentTextCol}>
              <View style={styles.nameTimeRow}>
                <AppText style={styles.commentWriter}>
                  {item.authorName}
                </AppText>
                <AppText style={styles.timeText}>
                  {formatPreviewTime(item.createdAt)}
                </AppText>
              </View>

              <MentionText
                text={item.content}
                familyUsers={familyUsers}
                textStyle={styles.commentContent}
                mentionStyle={styles.mentionText}
              />
            </View>
          </View>
        </View>
      );

      if (!mine || disabled) return body;

      return (
        <Swipeable
          enabled={true}
          overshootRight={false}
          rightThreshold={ACTION_W / 2}
          simultaneousHandlers={listRef}
          onSwipeableOpenStartDrag={() => {
            setOpenedSwipeCommentId(item?.commentId ?? null);
          }}
          onSwipeableCloseStartDrag={() => {
            if (String(openedSwipeCommentId) === String(item?.commentId)) {
              setOpenedSwipeCommentId(null);
            }
          }}
          onSwipeableWillOpen={() => {
            setOpenedSwipeCommentId(item?.commentId ?? null);
          }}
          onSwipeableWillClose={() => {
            if (
              String(openedSwipeCommentId) === String(item?.commentId)
            ) {
              setOpenedSwipeCommentId(null);
            }
          }}
          renderRightActions={progress =>
            renderRightActions(item.commentId, progress)
          }>
          {body}
        </Swipeable>
      );
    },
    [
      familyUsers,
      isMyComment,
      renderRightActions,
      disabled,
      openedSwipeCommentId,
    ],
  );

  const handleCloseSheet = useCallback(() => {
    sheetRef?.current?.dismiss?.();
  }, [sheetRef]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      handleIndicatorStyle={styles.sheetHandle}
      enablePanDownToClose={!disabled}
      backdropComponent={renderBackdrop}
      backgroundStyle={[styles.sheetBackground, {backgroundColor}]}
      onChange={onSheetChange}
      enableContentPanningGesture={false}
      enableHandlePanningGesture={!disabled}
      bottomInset={isAndroid ? androidKeyboardHeight : 0}
      android_keyboardInputMode="adjustResize"
      keyboardBehavior={isAndroid ? 'extend' : 'interactive'}
      keyboardBlurBehavior="restore">
      <BottomSheetView style={{flex: 1, width: '100%'}}>
        <View style={styles.commentSheetHeader}>
          <View style={styles.commentHeaderRow}>
            <AppText style={styles.commentSheetTitle}>
              {BOTTOM_SHEET_TITLES.MEMORY_COMMENT}
            </AppText>
            <AppText style={styles.commentCountText}>
              {commentCount}
            </AppText>
            <TouchableOpacity
              onPress={handleCloseSheet}
              activeOpacity={0.75}
              style={styles.closeButton}>
              <Image
                source={require('assets/icons/close(1).png')}
                style={styles.closeButtonIcon}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.commentSheetDivider} />
        </View>

        <View style={{flex: 1, width: '100%'}}>
          <BottomSheetFlatList
            ref={listRef}
            style={styles.commentList}
            data={commentList}
            keyExtractor={item => String(item.commentId)}
            renderItem={renderCommentItem}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            alwaysBounceVertical={false}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={!disabled}
            initialNumToRender={10}
            maxToRenderPerBatch={8}
            windowSize={7}
            removeClippedSubviews={true}
            updateCellsBatchingPeriod={50}
            ListEmptyComponent={
              <View
                style={[
                  styles.emptyContainer,
                  {paddingBottom: emptyBottomOffset},
                ]}>
                <AppText allowFontScaling={false} style={styles.emptyText}>
                  아직 댓글이 없어요.
                </AppText>
                <AppText allowFontScaling={false} style={styles.emptySubText}>
                  첫 댓글을 남겨보세요!
                </AppText>
              </View>
            }
            contentContainerStyle={{
              paddingBottom: footerLayoutH + getResponsiveHeight(12),
            }}
          />

          <CommentFooter
            styles={styles}
            initialText={commentText}
            onChangeComment={onChangeComment}
            onSubmitComment={onSubmitComment}
            familyUsers={familyUsers}
            myUserId={myUserId ?? user?.userId}
            disabled={disabled}
            onFooterLayoutHeight={h => {
              setFooterLayoutH(prev => (Math.abs(prev - h) > 1 ? h : prev));
            }}
          />
        </View>

      </BottomSheetView>
    </BottomSheetModal>
  );
}

function formatPreviewTime(time) {
  if (!time) return '';
  const date = new Date(time);
  const now = new Date();

  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    let h = date.getHours();
    const m = String(date.getMinutes()).padStart(2, '0');
    const ampm = h < 12 ? '오전' : '오후';
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return `${ampm} ${h}:${m}`;
  }

  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

