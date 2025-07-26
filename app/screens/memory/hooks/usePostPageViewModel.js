import {useState, useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';

import {
  fetchCommentsThunk,
  createCommentThunk,
} from '../../../redux/thunk/commentThunk';

import {
  deletePostThunk,
  deletePostImageThunk,
} from '../../../redux/thunk/memoryThunk';
import {useNavigation} from '@react-navigation/native';

export default function usePostPageViewModel(memory) {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user);
  const familyId = useSelector(state => state.family.familyId);
  const {commentList} = useSelector(state => state.comment);
  const navigation = useNavigation();

  const [commentText, setCommentText] = useState('');
  const [commentIndex, setCommentIndex] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [localImages, setLocalImages] = useState(memory.imageUrls || []);
  const [isImageFullScreen, setIsImageFullScreen] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState('');
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);

  useEffect(() => {
    if (memory?.postId) dispatch(fetchCommentsThunk(memory.postId));
  }, [memory]);

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    dispatch(
      createCommentThunk({
        postId: memory.postId,
        content: commentText.trim(),
        authorId: user.userId,
      }),
    );
    setCommentText('');
  };

  const handleDeletePost = async () => {
    try {
      await dispatch(deletePostThunk(memory.postId, familyId));
      navigation.goBack(); // ✅ 삭제 후 뒤로가기
    } catch (error) {
      console.warn('게시글 삭제 실패:', error);
    }
  };

  const handleDeleteImage = async () => {
    const targetImage = localImages[currentImageIndex];
    await dispatch(deletePostImageThunk(memory.postId, targetImage, familyId));
    const updated = localImages.filter((_, i) => i !== currentImageIndex);
    setLocalImages(updated);
    if (updated.length === 0) handleDeletePost();
  };

  return {
    user,
    commentList,
    commentText,
    setCommentText,
    commentIndex,
    setCommentIndex,
    currentImageIndex,
    setCurrentImageIndex,
    localImages,
    setLocalImages,
    isImageFullScreen,
    setIsImageFullScreen,
    deleteModalVisible,
    setDeleteModalVisible,
    deleteTarget,
    setDeleteTarget,
    showDeleteOptions,
    setShowDeleteOptions,
    handleSendComment,
    handleDeletePost,
    handleDeleteImage,
  };
}
