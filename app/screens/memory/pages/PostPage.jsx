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

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function PostPage({route}) {
  const {memory, imageIndex} = route.params;
  const navigation = useNavigation();
  const categoryList = useSelector(state => state.category.categoryList);
  const flatListRef = useRef(null);

  const scrollX = useRef(new Animated.Value(0)).current;
  const imageAnim = useRef(new Animated.Value(0)).current;

  const vm = usePostPageViewModel(memory);

  useHideTabBar();

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
      vm.setCurrentImageIndex(imageIndex);
    }
  }, [imageIndex]);

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
    <View style={styles.container} pointerEvents="box-none">
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
      {!vm.commentIndex && !vm.isImageFullScreen && (
        <View style={styles.descriptionWrapper} pointerEvents="box-none">
          <DescriptionSection
            memory={memory}
            commentList={vm.commentList}
            onPressComment={() => vm.setCommentIndex(true)}
          />
        </View>
      )}

      {vm.commentIndex && !vm.isImageFullScreen && (
        <View style={styles.commentWrapper} pointerEvents="box-none">
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

      {vm.isImageFullScreen && (
        <View
          style={[StyleSheet.absoluteFillObject, {backgroundColor: '#F9F9F9'}]}>
          <FlatList
            ref={flatListRef}
            data={vm.localImages}
            key={`fullscreen-${vm.isImageFullScreen}-${imageIndex}`}
            horizontal
            pagingEnabled={true}
            snapToAlignment="start"
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, index) => index.toString()}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            initialScrollIndex={vm.currentImageIndex}
            onMomentumScrollEnd={e => {
              const index = Math.round(
                e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
              );
              vm.setCurrentImageIndex(index);
            }}
            renderItem={({item}) => (
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => vm.setIsImageFullScreen(false)}
                style={{
                  width: SCREEN_WIDTH,
                  height: SCREEN_HEIGHT,
                  justifyContent: 'center',
                  alignItems: 'center',
                  alignSelf: 'center',
                }}>
                <Image
                  source={{uri: item}}
                  style={{width: '100%', height: '100%', resizeMode: 'contain'}}
                />
              </TouchableOpacity>
            )}
          />
        </View>
      )}

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
    zIndex: 10,
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

