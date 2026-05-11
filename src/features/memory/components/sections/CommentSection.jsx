// src/features/post/components/CommentSection.js

import React, {useEffect, useState} from 'react';
import { View, ScrollView, TextInput, StyleSheet, SafeAreaView, Platform, Animated } from 'react-native';
import SpringPressable from 'components/SpringPressable';

import AppText, {AnimatedAppText} from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';
// eslint-disable-next-line import/named
import {Swipeable} from 'react-native-gesture-handler';
import FastImage from '@d11/react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import {EMPTY_STYLE} from 'styles/style';
import {FONTS} from 'styles/typography';

const ACTION_W = getResponsiveWidth(70);

export default function CommentSection({
  commentList,
  commentText,
  onChangeComment,
  onSubmitComment,
  user,
  onDeleteComment,
  onReportComment,
}) {
  const styles = useScaledStyleSheet(rf => ({

  commentContainer: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  scrollWrapper: {
    flex: 1,
    position: 'relative',
  },
  commentBox: {
    paddingHorizontal: getResponsiveWidth(20),
    marginVertical: getResponsiveHeight(13),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexShrink: 1,
  },
  textColumn: {
    flexDirection: 'column',
    flexShrink: 1,
  },
  commentWriterImage: {
    width: getResponsiveWidth(34),
    height: getResponsiveWidth(34),
    borderRadius: getResponsiveWidth(17),
    backgroundColor: '#D9D9D9',
    marginRight: getResponsiveWidth(10),
  },
  commentWriter: {
    fontFamily: FONTS.REGULAR,
    fontSize: rf(14),
    color: '#000',
    marginBottom: getResponsiveHeight(2),
    lineHeight: getResponsiveHeight(20),
  },
  commentContent: {
    flexShrink: 1,
    flexWrap: 'wrap',
    fontFamily: FONTS.LIGHT,
    fontSize: rf(13),
    color: '#000',
    lineHeight: 20,
  },
  timeText: {
    fontSize: rf(11),
    color: '#999',
    marginTop: 2,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    alignSelf: 'center',
    backgroundColor: 'white',
    paddingHorizontal: getResponsiveWidth(16),
    borderWidth: 1,
    borderColor: '#FFC84D',
    borderRadius: getResponsiveWidth(10),
    marginTop: getResponsiveHeight(5),
    marginBottom: Platform.OS === 'android' ? getResponsiveHeight(30) : 0,
    height: getResponsiveHeight(50),
  },
  commentInput: {
    flex: 1,
    fontSize: rf(14),
    fontFamily: FONTS.REGULAR,
    paddingVertical: getResponsiveHeight(8),
  },
  commentSendBt: {
    width: getResponsiveWidth(24),
    height: getResponsiveWidth(24),
    resizeMode: 'contain',
  },
  commentSendBtInactive: {
    opacity: 0.5,
    transform: [{scale: 0.85}],
  },
  emptyContainer: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  emptyText: {
    fontSize: EMPTY_STYLE().emptyFontSize,
    fontFamily: EMPTY_STYLE().emptyFontFamily,
    color: EMPTY_STYLE().emptyColor,
    textAlign: 'center',
  },
  rightActionContainer: {
    width: ACTION_W,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  deleteAction: {
    width: '100%',
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  deleteActionText: {
    color: '#FFF',
    fontFamily: FONTS.SEMI_BOLD,
    fontSize: rf(14),
  },
  reportAction: {
    width: '100%',
    backgroundColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  reportActionText: {
    color: '#FFF',
    fontFamily: FONTS.SEMI_BOLD,
    fontSize: rf(14),
  },
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: getResponsiveHeight(30),
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: getResponsiveHeight(30),
  },

  }));
  const [isReady, setIsReady] = useState(false);

  // 스크롤 위치에 따라 그라데이션 표시 여부
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsReady(true);
    }, 150);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (contentHeight > scrollViewHeight) {
      setShowBottomFade(true);
    } else {
      setShowTopFade(false);
      setShowBottomFade(false);
    }
  }, [contentHeight, scrollViewHeight]);

  const handleScroll = e => {
    const {
      contentOffset: {y},
      layoutMeasurement,
      contentSize,
    } = e.nativeEvent;

    const visibleHeight = layoutMeasurement.height;
    const totalHeight = contentSize.height;
    const threshold = 10;

    setShowTopFade(y > threshold);
    setShowBottomFade(y + visibleHeight < totalHeight - threshold);
  };

  const renderRightActions = (commentId, progress) => {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [ACTION_W, 0],
      extrapolate: 'clamp',
    });
    const opacity = progress.interpolate({
      inputRange: [0, 0.3, 1],
      outputRange: [0, 0.6, 1],
      extrapolate: 'clamp',
    });
    const textScale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.85, 1],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.rightActionContainer}>
        <Animated.View style={{flex: 1, transform: [{translateX}], opacity}}>
          <SpringPressable
            style={[styles.deleteAction, {flex: 1}]}
            activeOpacity={0.8}
            onPress={() => onDeleteComment?.(commentId)}>
            <AnimatedAppText
              style={[
                styles.deleteActionText,
                {transform: [{scale: textScale}]},
              ]}>
              삭제
            </AnimatedAppText>
          </SpringPressable>
        </Animated.View>
      </View>
    );
  };

  const renderReportRightActions = (comment, progress) => {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [ACTION_W, 0],
      extrapolate: 'clamp',
    });
    const opacity = progress.interpolate({
      inputRange: [0, 0.3, 1],
      outputRange: [0, 0.6, 1],
      extrapolate: 'clamp',
    });
    const textScale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.85, 1],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.rightActionContainer}>
        <Animated.View style={{flex: 1, transform: [{translateX}], opacity}}>
          <SpringPressable
            style={[styles.reportAction, {flex: 1}]}
            activeOpacity={0.8}
            onPress={() => onReportComment?.(comment)}>
            <AnimatedAppText
              style={[
                styles.reportActionText,
                {transform: [{scale: textScale}]},
              ]}>
              신고
            </AnimatedAppText>
          </SpringPressable>
        </Animated.View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.commentContainer}>
      {isReady && (
        <>
          {/* 스크롤 + 그라데이션 래퍼 */}
          <View style={styles.scrollWrapper}>
            <ScrollView
              style={{flex: 1}}
              contentContainerStyle={{
                paddingBottom: getResponsiveHeight(70), // 입력창 높이만큼 여유
                flexGrow: 1,
              }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              onScroll={handleScroll}
              scrollEventThrottle={16}
              onLayout={e => setScrollViewHeight(e.nativeEvent.layout.height)}
              onContentSizeChange={(w, h) => setContentHeight(h)}>
              {commentList.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <AppText style={styles.emptyText}>
                    {'아직 댓글이 없어요.\n첫 댓글을 남겨보세요!'}
                  </AppText>
                </View>
              ) : (
                commentList.map(comment => {
                  const isMyComment =
                    user?.userId &&
                    (comment.authorId === user.userId ||
                      comment.userId === user.userId);

                  const canReportOthers =
                    !isMyComment &&
                    typeof onReportComment === 'function';

                  return (
                    <Swipeable
                      key={comment.commentId}
                      renderRightActions={progress =>
                        isMyComment
                          ? renderRightActions(comment.commentId, progress)
                          : canReportOthers
                          ? renderReportRightActions(comment, progress)
                          : null
                      }
                      enabled={!!isMyComment || canReportOthers}
                      overshootRight={false}
                      friction={2}
                      rightThreshold={ACTION_W / 2}>
                      <View style={styles.commentBox}>
                        <View style={styles.headerRow}>
                          <View style={styles.authorRow}>
                            <FastImage
                              style={styles.commentWriterImage}
                              source={{uri: comment.authorImage}}
                              resizeMode={FastImage.resizeMode.contain}
                            />
                            <View style={styles.textColumn}>
                              <AppText style={styles.commentWriter}>
                                {comment.authorName}
                              </AppText>
                              <AppText style={styles.commentContent}>
                                {comment.content}
                              </AppText>
                            </View>
                          </View>
                          <AppText style={styles.timeText}>
                            {formatPreviewTime(comment.createdAt)}
                          </AppText>
                        </View>
                      </View>
                    </Swipeable>
                  );
                })
              )}
            </ScrollView>

            {/* 상단 그라데이션 */}
            {showTopFade && (
              <LinearGradient
                pointerEvents="none"
                colors={['#F9F9F9', 'rgba(249,249,249,0)']}
                style={styles.topFade}
              />
            )}

            {/* 하단 그라데이션 */}
            {showBottomFade && (
              <LinearGradient
                pointerEvents="none"
                colors={['rgba(249,249,249,0)', '#F9F9F9']}
                style={styles.bottomFade}
              />
            )}
          </View>

          {/* 하단 입력창 (PostPage에서 commentWrapper 자체를 올림) */}
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="댓글 달고 추억 쌓기...."
              placeholderTextColor="#D9D9D9"
              value={commentText}
              onChangeText={onChangeComment}
              onSubmitEditing={onSubmitComment}
              returnKeyType="send"
            />
            <SpringPressable
              onPress={onSubmitComment}
              disabled={!(commentText || '').trim().length}>
              <FastImage
                style={[
                  styles.commentSendBt,
                  !(commentText || '').trim().length && styles.commentSendBtInactive,
                ]}
                source={require('assets/icons/paperPlaneTilt.png')}
                resizeMode={FastImage.resizeMode.contain}
              />
            </SpringPressable>
          </View>
        </>
      )}
    </SafeAreaView>
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
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours < 12 ? '오전' : '오후';
    if (hours === 0) hours = 12;
    else if (hours > 12) hours -= 12;
    return `${ampm} ${hours}:${minutes}`;
  }

  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}
