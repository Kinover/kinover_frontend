import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';

import ImageCarousel from '../modules/post/components/imageCarousel'; // 기본 이미지 캐러셀 컴포넌트
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../../utils/responsive'; // 반응형 사이즈 유틸

import useHideTabBar from '../../../hooks/useHideTabBar'; // 하단 탭바 숨김 처리 훅
import ImageDeleteModal from '../modules/post/deleteOptionModal'; // 삭제 확인 모달
import CommentSection from '../modules/post/components/commentSection'; // 댓글 섹션
import DescriptionSection from '../modules/post/components/descriptionSection'; // 게시글 설명 섹션
import usePostPageViewModel from '../hooks/usePostPageViewModel'; // ViewModel 훅
import {useSelector} from 'react-redux'; // Redux 상태 가져오기

// 화면 크기 상수화
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function PostPage({route}) {
  // route에서 전달된 게시글 정보와 시작 이미지 인덱스
  const {memory, imageIndex} = route.params;
  const navigation = useNavigation();
  const categoryList = useSelector(state => state.category.categoryList);
  const flatListRef = useRef(null); // 전체화면 이미지 캐러셀을 위한 ref

  // 애니메이션용 Animated 값
  const scrollX = useRef(new Animated.Value(0)).current;
  const imageAnim = useRef(new Animated.Value(0)).current;

  // ViewModel 훅 (상태 및 로직 분리)
  const vm = usePostPageViewModel(memory);

  useEffect(() => {
    // layout이 완료된 다음 스크롤되게 setTimeout 사용
    if (flatListRef.current && vm.currentImageIndex != null) {
      setTimeout(() => {
        flatListRef.current.scrollToIndex({
          index: vm.currentImageIndex,
          animated: false,
        });
      }, 0);
    }
  }, [vm.currentImageIndex]);

  // 하단 탭바 숨기기
  useHideTabBar();

  // 댓글모드 여부에 따른 이미지 캐러셀 애니메이션
  useEffect(() => {
    Animated.timing(imageAnim, {
      toValue: vm.commentIndex ? 1 : 0, // 댓글모드일 때 1, 아닐 때 0
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [vm.commentIndex]);

  // 전체화면 이미지 모드 진입 시, 해당 이미지 인덱스로 FlatList 스크롤 이동
  useEffect(() => {
    if (flatListRef.current && imageIndex != null) {
      flatListRef.current.scrollToIndex({
        index: imageIndex,
        animated: false,
      });
    }
  }, [imageIndex]);

  // ViewModel의 currentImageIndex 설정 (최초 진입 시)
  useEffect(() => {
    if (imageIndex != null) {
      vm.setCurrentImageIndex(imageIndex);
    }
  }, [imageIndex]);

  // 헤더 타이틀 및 우측 휴지통 버튼 설정
  useEffect(() => {
    const matchedCategory = categoryList.find(
      cat => cat.categoryId === memory.categoryId,
    );
    const categoryTitle = matchedCategory?.title || '게시물';

    navigation.setOptions({
      headerTitle: () => (
        <Text
          style={{
            fontFamily: 'Pretendard-Regular',
            fontSize: getResponsiveFontSize(18),
            color: 'black',
          }}>
          {categoryTitle}
        </Text>
      ),
      headerRight: () => (
        <TouchableOpacity
          style={{marginRight: getResponsiveWidth(20)}}
          onPress={() => vm.setShowDeleteOptions(prev => !prev)}>
          <Image
            source={require('../../../assets/images/trash.png')}
            style={{
              width: getResponsiveWidth(25),
              height: getResponsiveHeight(25),
              resizeMode: 'contain',
            }}
          />
        </TouchableOpacity>
      ),
    });
  }, [memory, categoryList]);

  return (
    <View style={styles.container}>
      {/* 이미지 캐러셀 */}
      {vm.localImages && (
        <ImageCarousel
          commentCount={memory.commentCount}
          localImages={vm.localImages}
          imageAnim={imageAnim}
          scrollX={scrollX}
          currentImageIndex={vm.currentImageIndex}
          setCurrentImageIndex={vm.setCurrentImageIndex}
          setCommentIndex={vm.setCommentIndex}
          onImagePress={() => vm.setIsImageFullScreen(true)}
        />
      )}

      {/* 게시글 설명 UI (댓글 모드 아님 + 전체 이미지 아님) */}
      {!vm.commentIndex && !vm.isImageFullScreen && (
        <View style={styles.descriptionWrapper}>
          <DescriptionSection
            memory={memory}
            commentList={vm.commentList}
            onPressComment={() => vm.setCommentIndex(true)}
          />
        </View>
      )}

      {/* 댓글 모드 UI */}
      {vm.commentIndex && !vm.isImageFullScreen && (
        <View style={styles.commentWrapper}>
          <CommentSection
            commentList={vm.commentList}
            commentText={vm.commentText}
            onChangeComment={vm.setCommentText}
            onSubmitComment={vm.handleSendComment}
            onCloseComment={() => vm.setCommentIndex(false)}
            user={vm.user}
          />
        </View>
      )}

      {/* 삭제 확인 모달 */}
      {vm.deleteModalVisible && (
        <ImageDeleteModal
          visible={vm.deleteModalVisible}
          onClose={() => vm.setDeleteModalVisible(false)}
          onConfirm={() =>
            vm.deleteTarget === '게시물'
              ? vm.handleDeletePost()
              : vm.handleDeleteImage()
          }>
          <Text style={styles.modalTitle}>
            {vm.deleteTarget === '게시물'
              ? '게시물을 삭제하시겠습니까?'
              : '사진을 삭제하시겠습니까?'}
          </Text>
        </ImageDeleteModal>
      )}

      {/* 휴지통 버튼 누르면 나타나는 삭제 옵션 메뉴 */}
      {vm.showDeleteOptions && !vm.isImageFullScreen && (
        <View style={styles.deleteOptions}>
          <TouchableOpacity
            style={styles.deleteOptionButton}
            onPress={() => {
              vm.setShowDeleteOptions(false);
              vm.setDeleteTarget('게시물');
              vm.setDeleteModalVisible(true);
            }}>
            <Text style={styles.deleteOptionText}>게시물 전체 삭제</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.deleteOptionButton}
            onPress={() => {
              vm.setShowDeleteOptions(false);
              vm.setDeleteTarget('사진');
              vm.setDeleteModalVisible(true);
            }}>
            <Text style={styles.deleteOptionText}>이 사진만 삭제</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  descriptionWrapper: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '22%',
    zIndex: 1,
  },
  commentWrapper: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '45%',
    zIndex: 1,
  },
  deleteOptions: {
    position: 'absolute',
    top: getResponsiveHeight(10),
    right: getResponsiveWidth(20),
    backgroundColor: 'rgba(220, 220, 220, 0.7)',
    borderRadius: 7,
    zIndex: 11,
  },
  deleteOptionButton: {
    paddingVertical: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(20),
  },
  deleteOptionText: {
    color: 'black',
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Light',
    textAlign: 'center',
  },
  divider: {
    height: 0.5,
    backgroundColor: 'gray',
  },
  modalTitle: {
    fontSize: getResponsiveFontSize(17),
    fontFamily: 'Pretendard-SemiBold',
    textAlign: 'center',
    marginTop: getResponsiveHeight(10),
    marginBottom: getResponsiveHeight(5),
  },
});
