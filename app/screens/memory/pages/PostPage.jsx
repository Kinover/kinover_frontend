import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import ImageCarousel from '../modules/post/components/imageCarousel';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import useHideTabBar from '../../../hooks/useHideTabBar';
import ImageDeleteModal from '../modules/post/deleteOptionModal';
import CommentSection from '../modules/post/components/commentSection';
import DescriptionSection from '../modules/post/components/descriptionSection';
import usePostPageViewModel from '../hooks/usePostPageViewModel';
import {useSelector} from 'react-redux';
export default function PostPage({route}) {
  const {memory, imageIndex} = route.params;
  const navigation = useNavigation();
  const categoryList = useSelector(state => state.category.categoryList); // ✅
  const flatListRef = useRef(null);

  const scrollX = useRef(new Animated.Value(0)).current;
  const imageAnim = useRef(new Animated.Value(0)).current;

  const vm = usePostPageViewModel(memory);

  useHideTabBar();

  // 🔄 댓글창 열릴 때 이미지 애니메이션
  useEffect(() => {
    Animated.timing(imageAnim, {
      toValue: vm.commentIndex ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [vm.commentIndex]);

  useEffect(() => {
    if (flatListRef.current && imageIndex != null) {
      flatListRef.current.scrollToIndex({
        index: imageIndex,
        animated: false,
      });
    }
  }, [imageIndex]);

  useEffect(() => {
    if (imageIndex != null) {
      vm.setCurrentImageIndex(imageIndex); // ✅ 초기 이미지 인덱스 세팅
    }
  }, [imageIndex]);

  useEffect(() => {
    const matchedCategory = categoryList.find(
      cat => cat.categoryId === memory.categoryId,
    );

    const categoryTitle = matchedCategory?.title || '게시물'; // ✅ 타이틀 추출

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
  }, [memory, categoryList]); // ✅ 카테고리 리스트 변경되면 다시 설정

  return (
    <SafeAreaView style={styles.container}>
      <ImageCarousel
        localImages={vm.localImages}
        imageAnim={imageAnim}
        scrollX={scrollX}
        currentImageIndex={vm.currentImageIndex}
        setCurrentImageIndex={vm.setCurrentImageIndex}
        setCommentIndex={vm.setCommentIndex}
        onImagePress={() => vm.setIsImageFullScreen(true)}
      />

      {!vm.commentIndex && !vm.isImageFullScreen && (
        <View style={styles.descriptionWrapper}>
          <DescriptionSection
            memory={memory}
            commentList={vm.commentList}
            onPressComment={() => vm.setCommentIndex(true)}
          />
        </View>
      )}

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

      {/* 🖼 전체 이미지 보기 모드 */}
      {vm.isImageFullScreen && (
        <View
          style={[StyleSheet.absoluteFillObject, {backgroundColor: '#F9F9F9'}]}>
          <FlatList
            ref={flatListRef}
            key={`fullscreen-${vm.isImageFullScreen}-${imageIndex}`} // ✅ 리렌더 트리거
            data={vm.localImages}
            horizontal
            pagingEnabled
            initialScrollIndex={vm.currentImageIndex}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, index) => index.toString()}
            getItemLayout={(_, index) => ({
              length: Dimensions.get('window').width,
              offset: Dimensions.get('window').width * index,
              index,
            })}
            onMomentumScrollEnd={e => {
              const index = Math.round(
                e.nativeEvent.contentOffset.x / Dimensions.get('window').width,
              );
              vm.setCurrentImageIndex(index);
            }}
            renderItem={({item}) => (
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => vm.setIsImageFullScreen(false)}
                style={{
                  width: Dimensions.get('window').width,
                  height: Dimensions.get('window').height,
                  justifyContent: 'center',
                  alignItems: 'center',
                  alignSelf: 'center',
                }}>
                <Image
                  source={{uri: item}}
                  style={{
                    width: '100%',
                    height: '100%',
                    resizeMode: 'contain',
                  }}
                />
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* 삭제 모달 */}
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

      {/* 삭제 옵션 */}
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
    </SafeAreaView>
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
    minHeight: '28%',
    zIndex: 10,
  },
  commentWrapper: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '50%',
    zIndex: 10,
  },
  deleteOptions: {
    position: 'absolute',
    top: getResponsiveHeight(10),
    right: getResponsiveWidth(20),
    backgroundColor: 'rgba(220, 220, 220, 0.7)',
    borderRadius: 7,
    zIndex: 10,
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
    height: Platform.OS === 'android' ? 0.5 : 0.5,
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
