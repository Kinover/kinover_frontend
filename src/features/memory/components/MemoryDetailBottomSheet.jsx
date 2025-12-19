/* eslint-disable react-native/no-inline-styles */
// src/features/post/components/MemoryDetailBottomSheet.js

import React, {useMemo, useCallback, useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';

import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';

import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import FastImage from '@d11/react-native-fast-image';
import {Swipeable} from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';
import {EMPTY_STYLE} from 'styles/style';

const ACTION_W = getResponsiveWidth(70);
const INPUT_H = getResponsiveHeight(50);
const INPUT_SIDE_PAD = getResponsiveWidth(16);

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
}) {
  const insets = useSafeAreaInsets();

  const snapPoints = useMemo(
    () => snapPointsProp || ['80%'],
    [snapPointsProp],
  );

  const [inputFocused, setInputFocused] = useState(false);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  const lastFadeRef = useRef({top: false, bottom: false});
  const scrollThrottleRef = useRef(0);

  const handleListScroll = useCallback(
    e => {
      if (inputFocused) return;

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
    },
    [inputFocused],
  );

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
    c =>
      user?.userId &&
      (c.authorId === user.userId || c.userId === user.userId),
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
              onPress={() => onDeleteComment?.(commentId)}>
              <Text style={styles.deleteActionText}>삭제</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      );
    },
    [onDeleteComment],
  );

  const renderCommentItem = useCallback(
    ({item}) => {
      const mine = isMyComment(item);

      return (
        <Swipeable
          enabled={mine}
          overshootRight={false}
          rightThreshold={ACTION_W / 2}
          renderRightActions={progress =>
            mine ? renderRightActions(item.commentId, progress) : null
          }>
          <View style={styles.commentBox}>
            <View style={styles.commentRow}>
              <FastImage
                style={styles.commentWriterImage}
                source={{uri: item.authorImage}}
              />
              <View style={styles.commentTextCol}>
                <View style={styles.nameTimeRow}>
                  <Text style={styles.commentWriter}>{item.authorName}</Text>
                  <Text style={styles.timeText}>
                    {formatPreviewTime(item.createdAt)}
                  </Text>
                </View>
                <Text style={styles.commentContent}>{item.content}</Text>
              </View>
            </View>
          </View>
        </Swipeable>
      );
    },
    [isMyComment, renderRightActions],
  );

  const bottomSafe =
    Platform.OS === 'android'
      ? getResponsiveHeight(18)
      : Math.max(insets.bottom, getResponsiveHeight(10));

  const listPaddingBottom = bottomSafe + INPUT_H + getResponsiveHeight(14);

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      backgroundStyle={[styles.sheetBackground, {backgroundColor}]}>
      <View style={styles.sheetInner}>
        <BottomSheetFlatList
          data={commentList}
          keyExtractor={item => String(item.commentId)}
          renderItem={renderCommentItem}
          onScroll={handleListScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom: listPaddingBottom}}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                아직 댓글이 없어요.
                {'\n'}첫 댓글을 남겨보세요!
              </Text>
            </View>
          }
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

        <SafeAreaView edges={['bottom']} style={styles.inputSafe}>
          <View style={[styles.inputWrap, {bottom: bottomSafe}]}>
            <View style={styles.commentInputContainer}>
              <BottomSheetTextInput
                style={styles.commentInput}
                placeholder="댓글 달고 추억 쌓기...."
                placeholderTextColor="#D9D9D9"
                value={commentText}
                onChangeText={onChangeComment}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                returnKeyType="default"
              />
              <TouchableOpacity onPress={onSubmitComment} activeOpacity={0.9}>
                <FastImage
                  style={styles.commentSendBt}
                  source={require('../../../assets/icons/sendBt.png')}
                />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
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
  sheetInner: {flex: 1},
  sheetBackground: {
    borderTopLeftRadius: getResponsiveWidth(18),
    borderTopRightRadius: getResponsiveWidth(18),
  },

  commentBox: {
    paddingHorizontal: getResponsiveWidth(20),
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
    fontFamily: 'Pretendard-Regular',
    fontWeight: '600',
    fontSize: getResponsiveFontSize(14),
    color: '#000',
  },
  timeText: {
    fontSize: getResponsiveFontSize(11),
    color: '#999',
  },
  commentContent: {
    marginTop: getResponsiveHeight(4),
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(13),
    lineHeight: 20,
    color: '#000',
  },

  emptyContainer: {
    paddingTop: getResponsiveHeight(30),
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: EMPTY_STYLE.emptyFontSize,
    fontFamily: EMPTY_STYLE.emptyFontFamily,
    color: EMPTY_STYLE.emptyColor,
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

  inputSafe: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  inputWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingTop: getResponsiveHeight(8),
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FFC84D',
    borderRadius: getResponsiveWidth(10),
    paddingHorizontal: INPUT_SIDE_PAD,
    height: INPUT_H,
  },
  commentInput: {
    flex: 1,
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
    lineHeight: getResponsiveHeight(20),
    color: '#000',
  },
  commentSendBt: {
    width: getResponsiveWidth(24),
    height: getResponsiveWidth(24),
  },
});
