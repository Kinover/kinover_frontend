import React, {
  useState,
  useEffect,
  useCallback,
  useLayoutEffect,
  useRef,
} from 'react';
import {
  FlatList,
  Image,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  StyleSheet,
  Platform,
  SafeAreaView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import getResponsiveFontSize, {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import ImageDeleteModal from '../../../utils/imageDeleteModal';
import {
  deletePostThunk,
  deletePostImageThunk,
  fetchMemoryThunk,
} from '../../../redux/thunk/memoryThunk';
import {
  fetchCommentsThunk,
  createCommentThunk,
} from '../../../redux/thunk/commentThunk';
import DescriptionSection from './descriptionSection';
import CommentSection from './commentSection';

export default function PostPage({route}) {
  const [isFullImageMode, setIsFullImageMode] = useState(false);
  const [commentIndex, setCommentIndex] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState('');
  const [commentText, setCommentText] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [localImages, setLocalImages] = useState([]);

  const navigation = useNavigation();
  const dispatch = useDispatch();

  const user = useSelector(state => state.user);
  const familyId = useSelector(state => state.family.familyId);
  const categoryList = useSelector(state => state.category.categoryList);
  const {commentList} = useSelector(state => state.comment);
  const memory = route.params.memory;

  useEffect(() => {
    if (memory?.postId) {
      dispatch(fetchCommentsThunk(memory.postId));
      setLocalImages(memory.imageUrls); // ✅ 초기 이미지 설정
    }
  }, [memory]);

  useLayoutEffect(() => {
    const categoryTitle =
      categoryList.find(cat => cat.categoryId === memory.categoryId)?.title ||
      '';

    navigation.setOptions({
      headerShown: !isFullImageMode,
      headerTitle: () => (
        <Text
          style={{
            fontFamily: 'Pretendard-Regular',
            fontSize: getResponsiveFontSize(16),
            color: 'black',
          }}>
          {categoryTitle}
        </Text>
      ),
      headerRight: () => (
        <TouchableOpacity
          style={{position:'relative', elevation: 10, zIndex: 50}}
          onPress={() => setShowDeleteOptions(prev => !prev)}>
          <Image
            source={require('../../../assets/images/trash.png')}
            style={{
              width: getResponsiveWidth(20),
              height: getResponsiveHeight(20),
              resizeMode: 'contain',
              marginRight: getResponsiveWidth(15),
              // bottom: getResponsiveHeight(5),
              elevation: 10,
            }}
          />
        </TouchableOpacity>
      ),
    });
  }, [isFullImageMode, categoryList, memory.categoryId]);

  const handleSendComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    dispatch(
      createCommentThunk({
        postId: memory.postId,
        content: trimmed,
        authorId: user.userId,
      }),
    );
    setCommentText('');
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (evt, gestureState) => {
        const {dx, dy} = gestureState;
        const isTap = Math.abs(dx) < 5 && Math.abs(dy) < 5;
        if (isTap) {
          setIsFullImageMode(prev => !prev);
        }
      },
    }),
  ).current;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.imageLayer}>
        <FlatList
          data={localImages}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => index.toString()}
          style={{
            position: 'relative',
            width: Dimensions.get('window').width,
            height: Dimensions.get('window').height,
            display: 'flex',
            flex: 1,
          }}
          contentContainerStyle={{
            alignItems: 'center', // ✅ 가로 중앙 정렬
            width: Dimensions.get('window').width * localImages.length,
            // alignSelf: 'flex-start',
          }}
          onMomentumScrollEnd={e => {
            const index = Math.round(
              e.nativeEvent.contentOffset.x /
                e.nativeEvent.layoutMeasurement.width,
            );
            setCurrentImageIndex(index);
          }}
          renderItem={({item}) => (
            <View
              {...panResponder.panHandlers}
              style={{
                width: Dimensions.get('window').width,
                height: Dimensions.get('window').height,
                justifyContent: 'center', // 세로 정중앙
                alignItems: 'center', // 가로 정중앙
              }}>
              <Image style={styles.memoryImage} source={{uri: item}} />
            </View>
          )}
        />

        {!isFullImageMode && localImages.length > 1 && (
          <View style={styles.imageIndexContainer}>
            <Text style={[styles.imageIndexText, {color: 'yellow'}]}>
              {currentImageIndex + 1}
            </Text>
            <Text style={styles.imageIndexText}> / {localImages.length}</Text>
          </View>
        )}
      </View>
      {!isFullImageMode && !commentIndex && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            minHeight: '15%',
            zIndex: 10,
            maxHeight: '30%',
          }}>
          <DescriptionSection
            memory={memory}
            commentList={commentList}
            onPressComment={() => setCommentIndex(true)}
          />
        </View>
      )}

      {!isFullImageMode && commentIndex && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            height: '35%',
            zIndex: 10,
          }}>
          <CommentSection
            commentList={commentList}
            commentText={commentText}
            onChangeComment={setCommentText}
            onSubmitComment={handleSendComment}
            onCloseComment={() => setCommentIndex(false)}
            user={user}
          />
        </View>
      )}

      {deleteModalVisible && (
        <ImageDeleteModal
          visible={deleteModalVisible}
          onClose={() => setDeleteModalVisible(false)}
          onConfirm={async () => {
            if (deleteTarget === '게시물') {
              await dispatch(deletePostThunk(memory.postId, familyId));
              setDeleteModalVisible(false);
              navigation.goBack();
            } else if (deleteTarget === '사진') {
              const targetImage = localImages[currentImageIndex];
              try {
                await dispatch(
                  deletePostImageThunk(memory.postId, targetImage, familyId),
                );
                const updated = localImages.filter(
                  (_, i) => i !== currentImageIndex,
                );
                setLocalImages(updated);
                setCurrentImageIndex(prev =>
                  prev >= updated.length ? updated.length - 1 : prev,
                );
                if (updated.length === 0) {
                  await dispatch(deletePostThunk(memory.postId, familyId));
                  navigation.goBack();
                }
              } catch (err) {
                console.error('❌ 이미지 삭제 실패:', err);
              } finally {
                setDeleteModalVisible(false);
              }
            }
          }}
          closeText="취소"
          confirmText="삭제"
          closeTextStyle={{
            fontSize: getResponsiveFontSize(14),
            fontFamily: 'Pretendard-Regular',
          }}
          confirmTextStyle={{
            fontSize: getResponsiveFontSize(14),
            fontFamily: 'Pretendard-Regular',
          }}
          closeButtonStyle={{
            flex: 1,
            backgroundColor: '#E0E0E0',
            paddingVertical: getResponsiveHeight(10),
            borderRadius: 8,
          }}
          confirmButtonStyle={{
            flex: 1,
            backgroundColor: '#FFC84D',
            paddingVertical: getResponsiveHeight(10),
            borderRadius: 8,
          }}
          children={
            <Text
              style={{
                fontSize: getResponsiveFontSize(17),
                fontFamily: 'Pretendard-SemiBold',
                textAlign: 'center',
                marginTop: getResponsiveHeight(10),
                marginBottom: getResponsiveHeight(5),
              }}>
              {deleteTarget === '게시물'
                ? '게시물을 삭제하시겠습니까?'
                : '사진을 삭제하시겠습니까?'}
            </Text>
          }
        />
      )}

      {showDeleteOptions && (
        <View style={styles.deleteOptions}>
          <TouchableOpacity
            style={styles.deleteOptionButton}
            onPress={() => {
              setShowDeleteOptions(false);
              setDeleteTarget('게시물');
              setDeleteModalVisible(true);
            }}>
            <Text style={styles.deleteOptionText}>게시물 전체 삭제</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.deleteOptionButton}
            onPress={() => {
              setShowDeleteOptions(false);
              setDeleteTarget('사진');
              setDeleteModalVisible(true);
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
    backgroundColor: 'white',
  },
  imageLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  memoryImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    resizeMode: 'contain',
    backgroundColor: 'transparent',
  },
  imageIndexContainer: {
    position: 'absolute',
    top: getResponsiveHeight(100),
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 11,
    paddingVertical: 3,
    borderRadius: 10,
    zIndex: 3,
  },
  imageIndexText: {
    color: 'white',
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-SemiBold',
  },
  deleteOptions: {
    position: 'absolute',
    top: getResponsiveHeight(95),
    right: getResponsiveWidth(15),
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
    borderRadius: 7,
    zIndex: 10,
    overflow: 'hidden',
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
    height: Platform.OS === 'android' ? 0.5 : 0.2,
    backgroundColor: 'black',
  },
});
