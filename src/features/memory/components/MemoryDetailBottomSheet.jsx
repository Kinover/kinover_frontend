/* eslint-disable react-native/no-inline-styles */
// src/features/post/components/MemoryDetailBottomSheet.js

import React, {useMemo, useCallback, useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import {BottomSheetTextInput} from '@gorhom/bottom-sheet';

import {BottomSheetModal, BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import {BottomSheetFlatList} from '@gorhom/bottom-sheet';

import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import FastImage from '@d11/react-native-fast-image';
import {Swipeable} from 'react-native-gesture-handler';
import {Animated} from 'react-native';
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
  initialIndex = 0,
  snapPoints: snapPointsProp,
  backgroundColor = '#F9F9F9',
}) {
  const insets = useSafeAreaInsets();

  const snapPoints = useMemo(() => {
    return snapPointsProp || ['22%', '80%'];
  }, [snapPointsProp]);

  // 그라데이션 표시용(댓글 리스트 스크롤 기준)
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  const handleListScroll = useCallback(e => {
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
  }, []);

  const renderBackdrop = useCallback(
    props => (
      <BottomSheetBackdrop
        {...props}
        // ✅ 1단(최대 확장)에서 더 진하게
        opacity={0.45}
        // ✅ index 1일 때부터 나타남 (snapPoints[1])
        appearsOnIndex={1}
        // ✅ index 0으로 내려가면 사라짐
        disappearsOnIndex={0}
        // ✅ 탭하면 0으로 접히게
        pressBehavior="collapse"
      />
    ),
    [],
  );

  const isMyComment = useCallback(
    c =>
      user?.userId && (c.authorId === user.userId || c.userId === user.userId),
    [user?.userId],
  );

  const renderRightActions = useCallback(
    (commentId, progress) => {
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

      // ✅ scale 애니메이션은 기기별로 꼬일 수 있어서 제거(안전)
      return (
        <View style={styles.rightActionContainer}>
          <Animated.View style={{flex: 1, transform: [{translateX}], opacity}}>
            <TouchableOpacity
              style={[styles.deleteAction, {flex: 1}]}
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

  const DescriptionHeader = useMemo(() => {
    if (!memory) return null;

    return (
      <View style={[styles.headerWrap, {backgroundColor}]}>
        <View style={styles.headerTopRow}>
          <View style={styles.writerRow}>
            <Image
              style={styles.writerImage}
              source={{uri: memory.authorImage}}
            />
            <Text style={styles.writerName}>{memory.authorName}</Text>
          </View>
        </View>

        <View style={styles.descriptionBlock}>
          <Text style={styles.descriptionText}>{memory.content}</Text>
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.commentTitleRow}>
          <Text style={styles.commentTitle}>댓글</Text>
          <Text style={styles.commentCount}>{commentList.length}</Text>
        </View>
      </View>
    );
  }, [memory, commentList.length, backgroundColor]);

  const renderCommentItem = useCallback(
    ({item}) => {
      const mine = isMyComment(item);

      return (
        <Swipeable
          renderRightActions={progress =>
            mine ? renderRightActions(item.commentId, progress) : null
          }
          enabled={!!mine}
          overshootRight={false}
          friction={2}
          rightThreshold={ACTION_W / 2}>
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

  const EmptyComments = useMemo(() => {
    return (
      <View style={[styles.emptyContainer, {backgroundColor}]}>
        <Text style={styles.emptyText}>
          {'아직 댓글이 없어요.\n첫 댓글을 남겨보세요!'}
        </Text>
      </View>
    );
  }, [backgroundColor]);

  // 리스트 짧을 때 그라데이션 초기화
  useEffect(() => {
    if (!commentList?.length) {
      setShowTopFade(false);
      setShowBottomFade(false);
    }
  }, [commentList?.length]);

  const bottomSafe =
    Platform.OS === 'android'
      ? getResponsiveHeight(18)
      : Math.max(insets.bottom, getResponsiveHeight(10));

  const inputWrapperBottom = bottomSafe;
  const listPaddingBottom =
    inputWrapperBottom + INPUT_H + getResponsiveHeight(14);

  return (
    <BottomSheetModal
      ref={sheetRef}
      //   index={initialIndex}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      style={styles.sheetContainer} // ✅ 핵심
      backgroundStyle={[styles.sheetBackground, {backgroundColor}]}
      handleIndicatorStyle={{backgroundColor: '#D6D6D6'}}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore">
      <View style={[styles.sheetInner, {backgroundColor}]}>
        {/* ✅ 1) 설명은 고정 */}
        {DescriptionHeader}

        {/* ✅ 2) 댓글만 스크롤 */}
        <View style={styles.listArea}>
          <BottomSheetFlatList
            data={commentList}
            keyExtractor={item => String(item.commentId)}
            renderItem={renderCommentItem}
            ListEmptyComponent={EmptyComments}
            showsVerticalScrollIndicator={false}
            onScroll={handleListScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{
              paddingBottom: listPaddingBottom, // ✅ 입력창에 안 가리게
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
        </View>

        {/* ✅ 3) 입력창은 하단 고정 */}
        <SafeAreaView
          edges={['bottom']}
          pointerEvents="box-none"
          style={styles.inputOverlaySafe}>
          <View style={[styles.inputOverlay, {bottom: inputWrapperBottom}]}>
            <View style={styles.commentInputContainer}>
              <BottomSheetTextInput
                style={styles.commentInput}
                placeholder="댓글 달고 추억 쌓기...."
                placeholderTextColor="#D9D9D9"
                value={commentText}
                onChangeText={onChangeComment}
                onSubmitEditing={onSubmitComment}
                returnKeyType="send"
              />
              <TouchableOpacity onPress={onSubmitComment} activeOpacity={0.85}>
                <FastImage
                  style={styles.commentSendBt}
                  source={require('../../../assets/icons/paperPlaneTilt.png')}
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
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours < 12 ? '오전' : '오후';
    if (hours === 0) hours = 12;
    else if (hours > 12) hours -= 12;
    return `${ampm} ${hours}:${minutes}`;
  }

  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

const styles = StyleSheet.create({
  sheetInner: {
    flex: 1,
  },

  // ======= Header (고정) =======
  headerWrap: {
    paddingTop: getResponsiveHeight(0),
    paddingBottom: getResponsiveHeight(10),
  },
  headerTopRow: {
    width: '100%',
    paddingHorizontal: getResponsiveWidth(20),
    height: getResponsiveHeight(44),
    justifyContent: 'center',
  },
  writerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(10),
  },
  writerImage: {
    width:
      Platform.OS === 'ios' ? getResponsiveWidth(39) : getResponsiveWidth(36.5),
    height:
      Platform.OS === 'ios' ? getResponsiveWidth(39) : getResponsiveWidth(36.5),
    borderRadius: getResponsiveWidth(20),
    backgroundColor: 'white',
    borderColor: 'gray',
    borderWidth: getResponsiveWidth(0.25),
  },
  writerName: {
    color: 'black',
    fontSize:
      Platform.OS === 'ios'
        ? getResponsiveFontSize(18)
        : getResponsiveFontSize(16),
    fontFamily: 'Pretendard-Medium',
    lineHeight:
      Platform.OS === 'ios' ? getResponsiveHeight(26) : getResponsiveHeight(22),
  },
  descriptionBlock: {
    paddingHorizontal: getResponsiveWidth(25),
    paddingTop: getResponsiveHeight(2),
    paddingBottom: getResponsiveHeight(40),
  },
  descriptionText: {
    color: 'black',
    fontFamily: 'Pretendard-Light',
    fontSize:
      Platform.OS === 'ios'
        ? getResponsiveFontSize(15)
        : getResponsiveFontSize(14),
    lineHeight:
      Platform.OS === 'ios' ? getResponsiveHeight(24) : getResponsiveHeight(22),
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginHorizontal: getResponsiveWidth(20),
    marginBottom: getResponsiveHeight(10),
  },
  commentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(8),
    paddingHorizontal: getResponsiveWidth(20),
    paddingBottom: getResponsiveHeight(6),
  },
  commentTitle: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(14),
    color: '#111',
  },
  commentCount: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(12),
    color: '#777',
    marginTop: 1,
  },

  // ======= List (댓글만 스크롤) =======
  listArea: {
    flex: 1,
    position: 'relative',
  },

  commentBox: {
    paddingHorizontal: getResponsiveWidth(20),
    paddingVertical: getResponsiveHeight(10),
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentWriterImage: {
    width: getResponsiveWidth(34),
    height: getResponsiveWidth(34),
    borderRadius: getResponsiveWidth(17),
    backgroundColor: '#D9D9D9',
    marginRight: getResponsiveWidth(10),
  },
  commentTextCol: {
    flex: 1,
    flexDirection: 'column',
  },
  nameTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: getResponsiveWidth(10),
  },
  commentWriter: {
    fontFamily: 'Pretendard-Regular',
    fontWeight: '600',
    fontSize: getResponsiveFontSize(14),
    color: '#000',
    lineHeight: getResponsiveHeight(20),
  },
  timeText: {
    fontSize: getResponsiveFontSize(11),
    color: '#999',
    marginTop: 2,
  },
  commentContent: {
    marginTop: getResponsiveHeight(4),
    flexWrap: 'wrap',
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(13),
    color: '#000',
    lineHeight: 20,
  },

  emptyContainer: {
    paddingTop: getResponsiveHeight(30),
    paddingBottom: getResponsiveHeight(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: EMPTY_STYLE.emptyFontSize,
    fontFamily: EMPTY_STYLE.emptyFontFamily,
    color: EMPTY_STYLE.emptyColor,
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

  // ======= Input (하단 고정) =======
  inputOverlaySafe: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  inputOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingTop: getResponsiveHeight(8),
    paddingBottom: getResponsiveHeight(6),
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    alignSelf: 'center',
    backgroundColor: 'white',
    paddingHorizontal: INPUT_SIDE_PAD,
    borderWidth: 1,
    borderColor: '#FFC84D',
    borderRadius: getResponsiveWidth(10),
    height: INPUT_H,
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

  sheetContainer: {
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOffset: {width: 0, height: -10},
          shadowOpacity: 0.12,
          shadowRadius: 16,
        }
      : {
          elevation: 18,
        }),
  },

  // ✅ 실제 바텀시트 배경
  sheetBackground: {
    borderTopLeftRadius: getResponsiveWidth(18),
    borderTopRightRadius: getResponsiveWidth(18),
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
});
