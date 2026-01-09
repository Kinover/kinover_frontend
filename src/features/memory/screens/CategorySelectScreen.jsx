// src/features/memory/screens/CategorySelectScreen.jsx

import React, {useState, useLayoutEffect, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';
import CategoryModal from '../components/CategoryModal';
import {fetchCategoryThunk} from '../store/categoryThunk';
import {SafeAreaView} from 'react-native-safe-area-context';
import {EMPTY_STYLE, HEADER_STYLES} from 'styles/style';
import uuid from 'react-native-uuid';

// ✅ 추가: post 단건 조회 thunk
import {fetchPostByIdThunk} from '../store/memoryThunk';

export default function CategorySelectPage({route}) {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const familyId = useSelector(state => state.family.familyId);
  const {categoryList} = useSelector(state => state.category);

  const mode = route?.params?.mode ?? '등록'; // '수정' | '등록'
  const postId = route?.params?.postId ?? null;
  const removedUrls = route?.params?.removedUrls ?? [];
  const isEditMode = mode === '수정';

  /** ✅ ImageSelectPage에서 넘어오는 값들 */
  const selectedImagesFromRoute = useMemo(
    () => route?.params?.selectedImages ?? [],
    [route?.params?.selectedImages],
  );

  /** ✅ 수정모드: 게시글 원본 데이터(스토어) */
  const postFromStore = useSelector(state =>
    postId ? state.memory?.postsById?.[postId] : null,
  );

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  /** -----------------------
   * ✅ 수정모드면 post fetch
   * ---------------------- */
  useEffect(() => {
    if (!isEditMode) return;
    if (!postId) return;
    if (!postFromStore) dispatch(fetchPostByIdThunk(postId));
  }, [dispatch, isEditMode, postId, postFromStore]);

  /** -----------------------
   * 카테고리 목록 조회
   * ---------------------- */
  useEffect(() => {
    if (!familyId) return;
    dispatch(fetchCategoryThunk(familyId));
  }, [dispatch, familyId]);

  /** -----------------------
   * ✅ 기본 선택 세팅
   * - 수정모드면 "게시글의 카테고리"를 우선으로 선택
   * - 없으면 첫번째 선택
   * ---------------------- */
  const didInitRef = React.useRef(false);

  useEffect(() => {
    if (!categoryList || categoryList.length === 0) return;

    // 이미 한번 초기화 했으면(사용자가 눌러서 바꿨을 수도) 더 안 건드림
    if (didInitRef.current) return;

    // ✅ 수정모드: 게시글의 categoryId로 맞추기
    if (isEditMode && postFromStore?.categoryId) {
      const idx = categoryList.findIndex(
        c => c.categoryId === postFromStore.categoryId,
      );
      if (idx >= 0) {
        setSelectedCategory(categoryList[idx]);
        setSelectedIndex(idx);
        didInitRef.current = true;
        return;
      }
    }

    // ✅ 그 외: 첫번째로
    setSelectedCategory(categoryList[0]);
    setSelectedIndex(0);
    didInitRef.current = true;
  }, [categoryList, isEditMode, postFromStore]);

  // postId 바뀌면 초기화 다시
  useEffect(() => {
    didInitRef.current = false;
  }, [postId]);

  /** -----------------------
   * 임시 카테고리 추가
   * ---------------------- */
  const handleAddCategory = () => {
    const title = newCategory.trim();
    if (!title) return;

    const generatedId = String(uuid.v4());

    const tempCategory = {
      categoryId: generatedId,
      title,
      isTemporary: true,
    };

    const updated = [...categoryList, tempCategory];

    setNewCategory('');
    setAddModalVisible(false);

    setSelectedCategory(tempCategory);
    setSelectedIndex(updated.length - 1);

    dispatch({type: 'category/setTempCategoryList', payload: updated});
  };

  /** -----------------------
   * 헤더 설정
   * ---------------------- */
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Text style={styles.headerTitle}>
          {isEditMode ? '카테고리 수정' : '카테고리 지정'}
        </Text>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            if (!selectedCategory) return;

            navigation.navigate('게시글작성화면', {
              selectedCategory,
              selectedImages: selectedImagesFromRoute,

              mode,
              postId,
              removedUrls,

              // ✅ 핵심: 수정모드면 원래 글내용을 미리 채우기 위해 전달
              initialContent: isEditMode ? postFromStore?.content ?? '' : '',
            });
          }}
          disabled={!selectedCategory}
          style={[styles.headerRight, !selectedCategory && {opacity: 0.35}]}
          activeOpacity={0.85}>
          <Image
            source={require('../../../assets/icons/check.png')}
            style={styles.checkImage}
          />
        </TouchableOpacity>
      ),
    });
  }, [
    navigation,
    selectedCategory,
    selectedImagesFromRoute,
    isEditMode,
    mode,
    postId,
    removedUrls,
    postFromStore,
  ]);

  /** -----------------------
   * 리스트 아이템
   * ---------------------- */
  const renderItem = ({item, index}) => {
    const isSelected = selectedIndex === index;

    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedIndex(index);
          setSelectedCategory(item);
        }}
        activeOpacity={0.85}
        style={[styles.itemContainer, isSelected && styles.selectedItem]}>
        <Text style={styles.itemText}>{item.title}</Text>

        <Image
          source={
            isSelected
              ? require('../../../assets/images/selected-bt.png')
              : require('../../../assets/images/unselected-bt.png')
          }
          style={styles.radioIcon}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={categoryList}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          `${item.categoryId || item.title}-${index}`
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setAddModalVisible(true)}
              activeOpacity={0.85}>
              <Text style={styles.addText}>카테고리 추가</Text>
            </TouchableOpacity>
            <View style={styles.separator} />
          </>
        }
      />

      <CategoryModal
        visible={addModalVisible}
        onClose={() => {
          setNewCategory('');
          setAddModalVisible(false);
        }}
        onConfirm={handleAddCategory}
        content={
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>새 카테고리를 입력해주세요</Text>
            <View style={styles.inputBox}>
              <TextInput
                placeholder="예: 2025 가족 여행"
                placeholderTextColor={EMPTY_STYLE.emptyColor}
                style={styles.input}
                value={newCategory}
                onChangeText={setNewCategory}
              />
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    borderTopWidth: 2,
    borderColor: '#E5E5E5',
  },

  headerTitle: {
    fontSize: HEADER_STYLES.defaultTitleFontSize,
    fontFamily: HEADER_STYLES.defaultTitleFontFamily,
    color: HEADER_STYLES.defaultTitleFontColor,
    lineHeight: getResponsiveHeight(26),
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  headerRight: {},
  checkImage: {
    width: HEADER_STYLES.headerRightIconWidth,
    height: HEADER_STYLES.headerRightIconHeight,
    marginRight: HEADER_STYLES.headerRightIconRightPadding,
    resizeMode: 'contain',
  },

  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: getResponsiveWidth(18),
    paddingHorizontal: getResponsiveWidth(22),
  },
  selectedItem: {
    backgroundColor: '#FFF3D2',
  },
  itemText: {
    fontSize: getResponsiveFontSize(14.5),
    fontFamily: 'Pretendard-Regular',
    color: 'black',
    textAlignVertical: 'center',
  },
  radioIcon: {
    width: getResponsiveWidth(14),
    height: getResponsiveHeight(14),
    resizeMode: 'contain',
  },

  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginHorizontal: getResponsiveWidth(5),
  },
  addButton: {
    paddingVertical: getResponsiveWidth(18),
    paddingHorizontal: getResponsiveWidth(22),
  },
  addText: {
    color: '#F8B500',
    fontSize: getResponsiveFontSize(14.5),
    fontFamily: 'Pretendard-Medium',
  },

  modalContent: {
    paddingHorizontal: getResponsiveWidth(10),
  },
  modalTitle: {
    color: 'black',
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(17)
        : getResponsiveFontSize(18),
    fontFamily: 'Pretendard-SemiBold',
    textAlign: 'center',
    marginBottom: getResponsiveHeight(12),
    marginTop: getResponsiveHeight(12),
  },
  inputBox: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: getResponsiveWidth(10),
    paddingVertical:
      Platform.OS === 'ios' ? getResponsiveHeight(10) : getResponsiveHeight(4),
  },
  input: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(14.5),
  },
});
