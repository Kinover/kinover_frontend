/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */

import React, {useEffect, useRef, useMemo, useCallback, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';

import {BottomSheetModal, BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import LinearGradient from 'react-native-linear-gradient';

import {fetchPostByIdThunk} from '../store/memoryThunk';
import {setMemorySelectedTab} from '../store/memorySlice';

import useHideTabBar from '../../../hooks/useHideTabBar';
import usePostPageViewModel from '../hooks/usePostPageViewModel';

import ImageCarousel from '../components/ImageCarousel';
import MemoryDetailBottomSheet from '../components/MemoryDetailBottomSheet';
import ToastModal from '../../../components/ToastModal';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../../utils/responsive';
import {HEADER_STYLES} from 'styles/style';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

export default function PostPage({route}) {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const descSheetRef = useRef(null);
  const commentSheetRef = useRef(null);
  const didInitIndexRef = useRef(false);

  const {postId, imageIndex = 0} = route.params || {};

  const postFromStore = useSelector(state =>
    postId ? state.memory?.postsById?.[postId] : null,
  );
  const categoryList = useSelector(state => state.category.categoryList || []);

  const safeMemory = useMemo(
    () => ({
      postId,
      authorName: '',
      authorImage: null,
      content: '',
      ...(postFromStore || {}),
    }),
    [postFromStore, postId],
  );

  const vm = usePostPageViewModel(safeMemory);

  useHideTabBar();

  /** ---------------- state: description sheet expanded/collapsed ---------------- */
  const [descExpanded, setDescExpanded] = useState(false);

  /** ---------------- fetch ---------------- */
  useEffect(() => {
    if (postId && !postFromStore) {
      dispatch(fetchPostByIdThunk(postId));
    }
  }, [postId, postFromStore, dispatch]);

  useEffect(() => {
    if (didInitIndexRef.current) return;
    if (Number.isFinite(imageIndex)) {
      vm.setCurrentImageIndex(imageIndex);
    }
    didInitIndexRef.current = true;
  }, [imageIndex, vm]);

  /** ---------------- header (✅ 투명 헤더) ---------------- */
  useEffect(() => {
    const matched = categoryList.find(
      c => c.categoryId === safeMemory?.categoryId,
    );

    navigation.setOptions({
      headerTransparent: true, // ✅ 핵심
      headerTitle: () => (
        <Text style={styles.headerTitle}>{matched?.title || '게시물'}</Text>
      ),
      headerTitleAlign: 'center',

      // ✅ iOS/Android 공통: 배경 투명 + 그림자 제거
      headerStyle: {
        backgroundColor: 'transparent',
      },
      headerShadowVisible: false, // iOS
      headerTintColor: '#fff',

      // ✅ Android에서 반투명 상태에서 회색/그림자 생기는 경우 방지
      headerBackground: () => (
        <View style={{flex: 1, backgroundColor: 'transparent'}} />
      ),

      // ✅ 여기 추가
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{paddingHorizontal: getResponsiveWidth(13)}}>
          <Image
            source={require('../../../assets/images/leftArrow.png')}
            style={{
              width: getResponsiveIconSize(20),
              height: getResponsiveIconSize(20),
              tintColor: '#fff', // ✅ 완전 흰색
              resizeMode: 'contain',
            }}
          />
        </TouchableOpacity>
      ),

      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            if (!vm.isImageFullScreen) {
              vm.setShowDeleteOptions(v => !v);
            }
          }}>
          <Image
            source={require('../../../assets/images/trash.png')}
            style={styles.headerIcon}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, categoryList, safeMemory, vm]);

  /** ---------------- swipe ---------------- */
  const swipe = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-24, 24])
        .onEnd(e => {
          if (vm.isImageFullScreen) return;
          if (Math.abs(e.translationX) > 80) {
            dispatch(
              setMemorySelectedTab(e.translationX < 0 ? 'album' : 'post'),
            );
          }
        }),
    [dispatch, vm.isImageFullScreen],
  );

  /** ---------------- description sheet: always visible, controlled by click only ---------------- */
  const descSnapPoints = useMemo(() => ['20%', '30%'], []);

  const presentDescSheet = useCallback(() => {
    descSheetRef.current?.present?.();
  }, []);

  const applyDescIndex = useCallback(nextExpanded => {
    const nextIndex = nextExpanded ? 1 : 0;
    descSheetRef.current?.present?.();
    descSheetRef.current?.snapToIndex?.(nextIndex);
  }, []);

  const toggleDescByClick = useCallback(() => {
    if (vm.isImageFullScreen) return;
    setDescExpanded(prev => {
      const next = !prev;
      applyDescIndex(next);
      return next;
    });
  }, [applyDescIndex, vm.isImageFullScreen]);

  const collapseDesc = useCallback(() => {
    setDescExpanded(false);
    applyDescIndex(false);
  }, [applyDescIndex]);

  useEffect(() => {
    presentDescSheet();
    requestAnimationFrame(() => {
      applyDescIndex(false);
    });
  }, [presentDescSheet, applyDescIndex]);

  useEffect(() => {
    if (vm.isImageFullScreen) collapseDesc();
  }, [vm.isImageFullScreen, collapseDesc]);

  /** ---------------- comment sheet ---------------- */
  const openCommentSheet = useCallback(() => {
    collapseDesc();
    setTimeout(() => {
      commentSheetRef.current?.present?.();
    }, 120);
  }, [collapseDesc]);

  if (!postFromStore) return <SafeAreaView style={{flex: 1}} />;

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <GestureDetector gesture={swipe}>
        <View style={{flex: 1}}>
          <ImageCarousel
            localImages={vm.localImages}
            currentIndex={vm.currentImageIndex}
            setCurrentIndex={vm.setCurrentImageIndex}
            isFullScreen={vm.isImageFullScreen}
            setIsFullScreen={vm.setIsImageFullScreen}
          />
          {/* 헤더용 그라데이션 오버레이 */}
          <LinearGradient
            pointerEvents="none"
            colors={[
              'rgba(18,18,18,0.6)',
              'rgba(18,18,18,0.45)',
              'rgba(18,18,18,0.25)',
              'rgba(18,18,18,0.15)',
              'rgba(18,18,18,0)',
            ]}
            locations={[0, 0.2, 0.4, 0.55, 1]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: getResponsiveHeight(120), // 헤더 높이 + 여유
              zIndex: 5,
            }}></LinearGradient>
        </View>
      </GestureDetector>

      {/* ---------------- 설명 BottomSheet (항상 존재 / 클릭으로만 확장/축소) ---------------- */}
      <BottomSheetModal
        ref={descSheetRef}
        snapPoints={descSnapPoints}
        handleIndicatorStyle={{backgroundColor: 'transparent'}}
        enableContentPanningGesture={false}
        enableHandlePanningGesture={false}
        enablePanDownToClose={false}
        onDismiss={() => {
          presentDescSheet();
          applyDescIndex(descExpanded);
        }}
        backdropComponent={props => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={1}
            disappearsOnIndex={0}
            opacity={0.25}
            pressBehavior="none"
          />
        )}
        backgroundStyle={{backgroundColor: 'transparent'}}>
        <Pressable onPress={toggleDescByClick} style={{flex: 1}}>
          <LinearGradient
            colors={[
              'rgba(18,18,18,0)',
              'rgba(18,18,18,0.2)',
              'rgba(18,18,18,0.42)',
              'rgba(18,18,18,0.6)',
              'rgba(18,18,18,0.76)',
            ]}
            locations={[0, 0.3, 0.5, 0.7, 1]}
            style={styles.descSheet}>
            <View style={styles.descHeader}>
              <Image
                style={styles.avatar}
                source={
                  safeMemory.authorImage
                    ? {uri: safeMemory.authorImage}
                    : require('../../../assets/images/default.png')
                }
              />
              <Text style={styles.author} numberOfLines={1}>
                {safeMemory.authorName}
              </Text>

              <View style={{flex: 1}} />

              <TouchableOpacity
                onPress={openCommentSheet}
                activeOpacity={0.85}
                style={styles.commentBtn}>
                <Image
                  source={require('../../../assets/icons/chatCircleDots.png')}
                  style={{width: '100%', height: '100%'}}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              scrollEnabled={descExpanded}
              showsVerticalScrollIndicator={false}>
              <Text
                style={styles.descContent}
                numberOfLines={descExpanded ? undefined : 2}>
                {safeMemory.content}
              </Text>
            </ScrollView>
          </LinearGradient>
        </Pressable>
      </BottomSheetModal>

      {/* ---------------- 댓글 BottomSheet ---------------- */}
      {!vm.isImageFullScreen && (
        <MemoryDetailBottomSheet
          sheetRef={commentSheetRef}
          memory={safeMemory}
          commentList={vm.commentList}
          user={vm.user}
          commentText={vm.commentText}
          onChangeComment={vm.setCommentText}
          onSubmitComment={vm.handleSendComment}
          onDeleteComment={id => vm.openDeleteCommentModal(id)}
          snapPoints={['75%']}
        />
      )}

      <ToastModal
        visible={vm.toastVisible}
        message={vm.toastMessage}
        onClose={() => vm.setToastVisible(false)}
      />
    </SafeAreaView>
  );
}

/* ---------------- styles ---------------- */

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#000'},

  headerTitle: {
    fontSize: HEADER_STYLES.defaultTitleFontSize,
    fontFamily: HEADER_STYLES.defaultTitleFontFamily,
    color: '#fff', // ✅ 투명 헤더 위에서 잘 보이게
    lineHeight: getResponsiveHeight(26),
    textAlign: 'center',
  },

  headerIcon: {
    width: HEADER_STYLES.headerRightIconWidth,
    height: HEADER_STYLES.headerRightIconHeight,
    resizeMode: 'contain',
    marginRight: HEADER_STYLES.headerRightIconRightPadding,
    tintColor: '#fff', // ✅ 아이콘도 흰색
  },

  descSheet: {
    flex: 1,
    paddingHorizontal: getResponsiveWidth(16),
    paddingTop: getResponsiveHeight(40),
    borderTopLeftRadius: getResponsiveWidth(22),
    borderTopRightRadius: getResponsiveWidth(22),
  },

  descHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveHeight(10),
  },

  avatar: {
    width: getResponsiveWidth(28),
    height: getResponsiveWidth(28),
    borderRadius: getResponsiveWidth(14),
  },

  author: {
    marginLeft: getResponsiveWidth(8),
    color: 'white',
    fontSize: getResponsiveFontSize(15),
    fontFamily: 'Pretendard-SemiBold',
  },

  commentBtn: {
    width: getResponsiveIconSize(26),
    height: getResponsiveIconSize(26),
  },

  descContent: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: getResponsiveFontSize(14),
    lineHeight: getResponsiveHeight(22),
    fontFamily: 'Pretendard-Medium',
  },
});
