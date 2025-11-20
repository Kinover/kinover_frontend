import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  Animated,
  Keyboard,
  Easing,
  KeyboardAvoidingView,
} from 'react-native';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';
// eslint-disable-next-line import/named
import {Swipeable} from 'react-native-gesture-handler';
import FastImage from '@d11/react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient'; // ✅ 추가

const ACTION_W = getResponsiveWidth(70);

export default function CommentSection({
  commentList,
  commentText,
  onChangeComment,
  onSubmitComment,
  user,
  onDeleteComment,
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [isReady, setIsReady] = useState(false);

  // ✅ 스크롤 위치에 따라 그라데이션 표시 여부
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  // 댓글 화면 페이드 인
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsReady(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }, 200);
    return () => clearTimeout(timeout);
  }, []);

  // ✅ 키보드 애니메이션 (부드럽게 올라옴)
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardWillShow', e => {
      Animated.timing(translateY, {
        toValue: -e.endCoordinates.height,
        duration: e.duration || 320,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });

    const hideSub = Keyboard.addListener('keyboardWillHide', e => {
      Animated.timing(translateY, {
        toValue: 0,
        duration: e.duration || 280,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // ✅ 콘텐츠가 화면보다 길면 처음엔 아래쪽 그라데이션만 켜두기
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
    const threshold = 10; // 얼마나 스크롤해야 ‘위에 뭐 있다’고 볼지 기준

    // 위에 더 내용 있으면 상단 그라데이션
    setShowTopFade(y > threshold);

    // 아래에 더 내용 있으면 하단 그라데이션
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
          <TouchableOpacity
            style={[styles.deleteAction, {flex: 1}]}
            activeOpacity={0.8}
            onPress={() => onDeleteComment?.(commentId)}>
            <Animated.Text
              style={[
                styles.deleteActionText,
                {transform: [{scale: textScale}]},
              ]}>
              삭제
            </Animated.Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: '#F9F9F9',
          transform: [{translateY}],
          opacity: fadeAnim,
        }}
        pointerEvents="box-none">
        {isReady && (
          <SafeAreaView style={styles.commentContainer}>
            {/* ✅ 스크롤 + 그라데이션을 덮어씌울 래퍼 */}
            <View style={styles.scrollWrapper}>
              {/* 댓글 리스트 */}
              <ScrollView
                style={{flex: 1}}
                contentContainerStyle={{
                  paddingBottom: getResponsiveHeight(70), // 입력창 공간
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
                    <Text style={styles.emptyText}>
                      {'아직 댓글이 없어요.\n첫 댓글을 남겨보세요!'}
                    </Text>
                  </View>
                ) : (
                  commentList.map(comment => {
                    const isMyComment =
                      user?.userId &&
                      (comment.authorId === user.userId ||
                        comment.userId === user.userId);
                    return (
                      <Swipeable
                        key={comment.commentId}
                        renderRightActions={progress =>
                          isMyComment
                            ? renderRightActions(comment.commentId, progress)
                            : null
                        }
                        enabled={!!isMyComment}
                        overshootRight={false}
                        friction={2}
                        rightThreshold={ACTION_W / 2}>
                        <View style={styles.commentBox}>
                          <View style={styles.headerRow}>
                            <View style={styles.authorRow}>
                              <FastImage
                                style={styles.commentWriterImage}
                                source={{uri: comment.authorImage}}
                              />
                              <View style={styles.textColumn}>
                                <Text style={styles.commentWriter}>
                                  {comment.authorName}
                                </Text>
                                <Text style={styles.commentContent}>
                                  {comment.content}
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.timeText}>
                              {formatPreviewTime(comment.createdAt)}
                            </Text>
                          </View>
                        </View>
                      </Swipeable>
                    );
                  })
                )}
              </ScrollView>

              {/* ✅ 상단 그라데이션 */}
              {showTopFade && (
                <LinearGradient
                  pointerEvents="none"
                  colors={['#F9F9F9', 'rgba(249,249,249,0)']}
                  style={styles.topFade}
                />
              )}

              {/* ✅ 하단 그라데이션 */}
              {showBottomFade && (
                <LinearGradient
                  pointerEvents="none"
                  colors={['rgba(249,249,249,0)', '#F9F9F9']}
                  style={styles.bottomFade}
                />
              )}
            </View>

            {/* 입력창 */}
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
              <TouchableOpacity onPress={onSubmitComment}>
                <FastImage
                  style={styles.commentSendBt}
                  source={require('../../../assets/icons/paperPlaneTilt.png')}
                />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  commentContainer: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  // ✅ 스크롤 + 그라데이션용 래퍼
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
  authorRow: {flexDirection: 'row', alignItems: 'flex-start', flexShrink: 1},
  textColumn: {flexDirection: 'column', flexShrink: 1},
  commentWriterImage: {
    width: getResponsiveWidth(34),
    height: getResponsiveWidth(34),
    borderRadius: getResponsiveWidth(17),
    backgroundColor: '#D9D9D9',
    marginRight: getResponsiveWidth(10),
  },
  commentWriter: {
    fontFamily: 'Pretendard-Regular',
    fontWeight: '600',
    fontSize: getResponsiveFontSize(14),
    color: '#000',
    marginBottom: getResponsiveHeight(2),
    lineHeight: getResponsiveHeight(20),
  },
  commentContent: {
    flexShrink: 1,
    flexWrap: 'wrap',
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(13),
    color: '#000',
    lineHeight: 20,
  },
  timeText: {fontSize: getResponsiveFontSize(11), color: '#999', marginTop: 2},
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
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
    paddingVertical: getResponsiveHeight(8),
  },
  commentSendBt: {
    width: getResponsiveWidth(24),
    height: getResponsiveWidth(24),
    resizeMode: 'contain',
  },
  emptyContainer: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  emptyText: {
    fontSize: getResponsiveFontSize(14),
    color: '#C0C0C0',
    fontFamily: 'Pretendard-Regular',
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
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(14),
  },

  // ✅ 상단/하단 그라데이션 스타일
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
    bottom: 0, // 입력창 위에서 흐려지게
    height: getResponsiveHeight(30),
  },
});

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
