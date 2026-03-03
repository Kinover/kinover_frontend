/* eslint-disable react-native/no-inline-styles */
// src/features/post/components/MemoryDetailBottomSheet.js

import React, {useMemo, useCallback, useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  FlatList,
  Image,
  Platform,
  Pressable,
} from 'react-native';

import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetFooter,
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet';

import {useSafeAreaInsets} from 'react-native-safe-area-context';
import FastImage from '@d11/react-native-fast-image';
import {Swipeable} from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';
import {COLORS, EMPTY_STYLE} from 'styles/style';

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
function MentionText({text, familyUsers, textStyle, mentionStyle}) {
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
    <Text allowFontScaling={false} style={textStyle}>
      {parts.map((p, idx) => {
        if (p?.startsWith('@')) {
          const name = p.slice(1);
          const user = nameMap.get(name);
          if (user) {
            return (
              <Text
                allowFontScaling={false}
                key={`${idx}_${p}`}
                style={[styles.mentionText, mentionStyle]}>
                {p}
              </Text>
            );
          }
        }
        return (
          <Text allowFontScaling={false} key={`${idx}_${p}`}>
            {p}
          </Text>
        );
      })}
    </Text>
  );
}

/* =========================
 * Footer (불투명 배경 바)
 * ========================= */
function CommentFooter({
  footerProps,
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
            text: next,
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

  return (
    <BottomSheetFooter
      {...footerProps}
      bottomInset={0}>
      <View
        style={[
          styles.footerBar,
          {
            paddingBottom:
              getResponsiveHeight(10) +
              Math.max(Math.min(insets.bottom, getResponsiveHeight(16)), 0),
          },
        ]}
        onLayout={e => {
          const h = e?.nativeEvent?.layout?.height ?? 0;
          if (h > 0) onFooterLayoutHeight?.(h);
        }}>
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
                          : require('../../../assets/images/default.png')
                      }
                      style={styles.mentionAvatar}
                    />
                    <Text
                      allowFontScaling={false}
                      style={styles.mentionName}
                      numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text allowFontScaling={false} style={styles.mentionHint}>
                      @{item.name}
                    </Text>
                  </Pressable>
                )}
              />
            </View>
          </View>
        )}

        <View
          style={[styles.commentInputContainer, disabled && {opacity: 0.55}]}>
          <BottomSheetTextInput
            allowFontScaling={false}
            ref={inputRef}
            editable={!disabled}
            style={styles.commentInput}
            placeholder={
              disabled
                ? '지금은 댓글을 작성할 수 없어요'
                : '댓글을 달아보세요 ( @가족이름 멘션 가능 )'
            }
            placeholderTextColor="#999"
            defaultValue={initialText || ''}
            onChangeText={t => {
              if (disabled) return;
              draftRef.current = t;
              setDraftText(t);
            }}
            onSelectionChange={e => {
              if (disabled) return;
              const nextCursor = e?.nativeEvent?.selection?.start ?? 0;
              setCursor(nextCursor);
            }}
            returnKeyType="send"
            onSubmitEditing={handleSubmit}
            blurOnSubmit={false}
          />

          <TouchableOpacity
            onPress={handleSubmit}
            activeOpacity={0.9}
            disabled={disabled}>
            <Image
              style={styles.commentSendBt}
              source={require('../../../assets/icons/sendBt-dark.png')}
            />
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheetFooter>
  );
}

export default function MemoryDetailBottomSheet({
  sheetRef,
  memory,
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
  const snapPoints = useMemo(() => snapPointsProp || ['81%'], [snapPointsProp]);
  const isAndroid = Platform.OS === 'android';

  const listRef = useRef(null);

  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  const lastFadeRef = useRef({top: false, bottom: false});
  const scrollThrottleRef = useRef(0);

  const [footerLayoutH, setFooterLayoutH] = useState(
    INPUT_H + getResponsiveHeight(20),
  );

  const handleListScroll = useCallback(e => {
    const now = Date.now();
    if (now - scrollThrottleRef.current < 80) return;
    scrollThrottleRef.current = now;

    const {
      contentOffset: {y},
      layoutMeasurement,
      contentSize,
    } = e.nativeEvent;

    const visibleHeight = layoutMeasurement.height;
    const totalHeight = contentSize.height;
    const threshold = 10;

    const nextTop = y > threshold;
    const nextBottom = y + visibleHeight < totalHeight - threshold;

    if (lastFadeRef.current.top !== nextTop) {
      lastFadeRef.current.top = nextTop;
      setShowTopFade(nextTop);
    }
    if (lastFadeRef.current.bottom !== nextBottom) {
      lastFadeRef.current.bottom = nextBottom;
      setShowBottomFade(nextBottom);
    }
  }, []);

  useEffect(() => {
    if (!commentList.length) {
      setShowTopFade(false);
      setShowBottomFade(false);
    }
  }, [commentList.length]);

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
              <Text allowFontScaling={false} style={styles.deleteActionText}>
                삭제
              </Text>
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

      return (
        <Swipeable
          enabled={mine && !disabled}
          overshootRight={false}
          rightThreshold={ACTION_W / 2}
          simultaneousHandlers={listRef}
          renderRightActions={progress =>
            mine && !disabled
              ? renderRightActions(item.commentId, progress)
              : null
          }>
          <View style={styles.commentBox}>
            <View style={styles.commentRow}>
              <FastImage
                fallback={true}
                style={styles.commentWriterImage}
                source={{uri: item.authorImage}}
              />
              <View style={styles.commentTextCol}>
                <View style={styles.nameTimeRow}>
                  <Text allowFontScaling={false} style={styles.commentWriter}>
                    {item.authorName}
                  </Text>
                  <Text allowFontScaling={false} style={styles.timeText}>
                    {formatPreviewTime(item.createdAt)}
                  </Text>
                </View>

                <MentionText
                  text={item.content}
                  familyUsers={familyUsers}
                  textStyle={styles.commentContent}
                />
              </View>
            </View>
          </View>
        </Swipeable>
      );
    },
    [familyUsers, isMyComment, renderRightActions, disabled],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose={!disabled}
      backdropComponent={renderBackdrop}
      backgroundStyle={[styles.sheetBackground, {backgroundColor}]}
      onChange={onSheetChange}
      enableContentPanningGesture={!disabled}
      enableHandlePanningGesture={!disabled}
      bottomInset={0}
      android_keyboardInputMode="adjustResize"
      keyboardBehavior="interactive"
      keyboardBlurBehavior={isAndroid ? 'none' : 'restore'}
      enableFooterMarginAdjustment={true}
      footerComponent={props => (
        <CommentFooter
          footerProps={props}
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
      )}>
      <BottomSheetView style={{flex: 1, width: '100%'}}>
        <BottomSheetFlatList
          ref={listRef}
          data={commentList}
          keyExtractor={item => String(item.commentId)}
          renderItem={renderCommentItem}
          onScroll={handleListScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={!disabled}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text allowFontScaling={false} style={styles.emptyText}>
                아직 댓글이 없어요.
                {'\n'}첫 댓글을 남겨보세요!
              </Text>
            </View>
          }
          contentContainerStyle={{
            paddingBottom: footerLayoutH + getResponsiveHeight(12),
          }}
        />

        {showTopFade && (
          <LinearGradient
            pointerEvents="none"
            colors={[backgroundColor, 'rgba(249,249,249,0)']}
            style={styles.topFade}
          />
        )}

        {showBottomFade && (
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(249,249,249,0)', backgroundColor]}
            style={styles.bottomFade}
          />
        )}
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

const styles = StyleSheet.create({
  sheetInner: {},
  sheetBackground: {
    borderTopLeftRadius: getResponsiveWidth(18),
    borderTopRightRadius: getResponsiveWidth(18),
  },

  commentBox: {
    paddingHorizontal: getResponsiveWidth(10),
    paddingVertical: getResponsiveHeight(10),
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
    fontSize: getResponsiveFontSize(13),
    color: '#000',
  },
  timeText: {
    fontSize: getResponsiveFontSize(10),
    color: '#999',
  },
  commentContent: {
    marginTop: getResponsiveHeight(4),
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(12),
    lineHeight: 15,
    color: '#000',
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
    paddingTop: getResponsiveHeight(30),
    alignItems: 'center',
  },
  emptyText: {
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
    backgroundColor: 'rgba(80, 100, 100, 0.1)',
  },
  commentInput: {
    flex: 1,
    fontSize: getResponsiveFontSize(14),
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
    fontSize: getResponsiveFontSize(13.5),
  },
  mentionHint: {
    color: '#6B7280',
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(12),
  },
});
