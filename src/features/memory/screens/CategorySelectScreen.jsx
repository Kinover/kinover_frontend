// src/features/memory/screens/CategorySelectScreen.jsx

import React, {useState, useLayoutEffect, useEffect, useMemo} from 'react';
import { View, FlatList, Image, Platform } from 'react-native';
import SpringPressable from 'components/SpringPressable';
import CustomInput from 'components/CustomInput';
import {useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';
import CategoryModal from '../components/modals/CategoryModal';
import {SafeAreaView} from 'react-native-safe-area-context';
import {EMPTY_STYLE, HEADER_STYLES} from 'styles/style';
import {useColors, useIsDark} from 'hooks/useColors';
import uuid from 'react-native-uuid';
import {useGetCategoriesQuery, useGetPostByIdQuery} from '../services/memoryApi';
import {setTempCategoryList} from '../store/categorySlice';

import CheckBadge from 'components/CheckBadge';
import {FONTS} from 'styles/typography';

export default function CategorySelectPage({route}) {
  const colors = useColors();
  const isDark = useIsDark();
  const headerTheme = useMemo(() => HEADER_STYLES.get(colors), [colors]);
  const headerIconTint = isDark ? '#FFFFFF' : '#111827';

  const styles = useScaledStyleSheet(
    rf => ({
  container: {
    flex: 1,
    backgroundColor: colors.surfacePrimary,
    borderTopWidth: 1,
    borderColor: colors.borderSubtle,
  },

  headerTitle: {
    fontSize: headerTheme.defaultTitleFontSize,
    fontFamily: headerTheme.defaultTitleFontFamily,
    color: headerTheme.defaultTitleFontColor,
    lineHeight: getResponsiveHeight(26),
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  headerRight: {},
  checkImage: {
    width: HEADER_STYLES().headerRightIconWidth,
    height: HEADER_STYLES().headerRightIconHeight,
    marginRight: HEADER_STYLES().headerRightIconRightPadding,
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
    backgroundColor: isDark ? 'rgba(255, 200, 77, 0.22)' : '#FFF3D2',
  },
  itemText: {
    fontSize: rf(14.5),
    fontFamily: FONTS.REGULAR,
    color: colors.textPrimary,
    textAlignVertical: 'center',
  },
  itemTextOnSelected: {
    color: colors.textOnBrandPrimary,
  },

 // 오른쪽 영역(체크뱃지 자리)
  rightArea: {
    width: getResponsiveWidth(18),
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  badgePlaceholder: {
    width: getResponsiveWidth(16),
    height: getResponsiveWidth(16),
  },

  separator: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginHorizontal: getResponsiveWidth(5),
  },
  addButton: {
    paddingVertical: getResponsiveWidth(18),
    paddingHorizontal: getResponsiveWidth(22),
  },
  addText: {
    color: colors.brandPrimaryStrong,
    fontSize: rf(14.5),
    fontFamily: FONTS.MEDIUM,
  },

  modalContent: {
    paddingHorizontal: getResponsiveWidth(10),
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize:
      Platform.OS === 'android'
        ? rf(17)
        : rf(18),
    fontFamily: FONTS.SEMI_BOLD,
    textAlign: 'center',
    marginBottom: getResponsiveHeight(12),
    marginTop: getResponsiveHeight(12),
  },
  inputBox: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 8,
    paddingHorizontal: getResponsiveWidth(10),
    paddingVertical:
      Platform.OS === 'ios' ? getResponsiveHeight(10) : getResponsiveHeight(4),
  },
  inputWrap: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: getResponsiveWidth(10),
    backgroundColor: colors.surfaceMuted,
    marginTop: getResponsiveHeight(8),
    marginBottom: getResponsiveHeight(8),
    paddingHorizontal: getResponsiveWidth(12),
  },
  inputWrapFocused: {
    borderColor: '#FFC84D',
  },
  input: {
    paddingVertical:
      Platform.OS === 'android'
        ? getResponsiveHeight(10)
        : getResponsiveHeight(12),
    paddingHorizontal: 0,
    fontSize: rf(16),
    fontFamily: FONTS.REGULAR,
    color: colors.textPrimary,
    backgroundColor: 'transparent',
    borderWidth: 0,
    ...(Platform.OS === 'android' ? {includeFontPadding: false} : null),
  },

  }),
    [colors, headerTheme, isDark],
  );
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const fallbackCategoryList = useSelector(state => state.category?.categoryList || []);

  const mode = route?.params?.mode ?? '등록'; // '수정' | '등록'
  const postId = route?.params?.postId ?? null;
  const removedUrls = route?.params?.removedUrls ?? [];
  const isEditMode = mode === '수정';

 /** ImageSelectPage에서 넘어오는 값들 */
  const selectedImagesFromRoute = useMemo(
    () => route?.params?.selectedImages ?? [],
    [route?.params?.selectedImages],
  );

 /** 수정모드: 게시글 원본 데이터(스토어) */
  const fallbackPostFromStore = useSelector(state =>
    postId ? state.memory?.postsById?.[postId] : null,
  );
  const {data: categoryQueryData = []} = useGetCategoriesQuery();
  const {data: postQueryData} = useGetPostByIdQuery(postId, {skip: !postId});

  const categoryList = useMemo(() => {
    const server = Array.isArray(categoryQueryData) ? categoryQueryData : [];
    const local = Array.isArray(fallbackCategoryList) ? fallbackCategoryList : [];

    if (!server.length) {
      return local;
    }

    const serverIds = new Set(
      server.map(c => String(c?.categoryId ?? '')),
    );
    const pendingLocal = local.filter(
      c =>
        c?.isTemporary &&
        c?.categoryId != null &&
        !serverIds.has(String(c.categoryId)),
    );
    return [...server, ...pendingLocal];
  }, [categoryQueryData, fallbackCategoryList]);
  const postFromStore = postQueryData ?? fallbackPostFromStore;

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [isCategoryInputFocused, setIsCategoryInputFocused] = useState(false);

 /** -----------------------
 * 기본 선택 세팅
 * - 수정모드면 "게시글의 카테고리"를 우선으로 선택
 * - 없으면 첫번째 선택
 * ---------------------- */
  const didInitRef = React.useRef(false);

  useEffect(() => {
    if (!categoryList || categoryList.length === 0) return;

 // 이미 한번 초기화 했으면(사용자가 눌러서 바꿨을 수도) 더 안 건드림
    if (didInitRef.current) return;

 // 수정모드: 게시글의 categoryId로 맞추기
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

 // 그 외: 첫번째로
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

    dispatch(setTempCategoryList(updated));
  };

 /** -----------------------
 * 헤더 설정
 * ---------------------- */
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <AppText style={styles.headerTitle}>
          {isEditMode ? '카테고리 수정' : '카테고리 지정'}
        </AppText>
      ),
      headerRight: () => (
        <SpringPressable
          onPress={() => {
            if (!selectedCategory) return;

            navigation.navigate('게시글작성화면', {
              selectedCategory,
              selectedImages: selectedImagesFromRoute,

              mode,
              postId,
              removedUrls,

              initialContent: isEditMode ? postFromStore?.content ?? '' : '',
            });
          }}
          disabled={!selectedCategory}
          style={[styles.headerRight, !selectedCategory && {opacity: 0.35}]}
          activeOpacity={0.85}>
          <Image
            source={require('../../../assets/icons/check.png')}
            style={[styles.checkImage, {tintColor: headerIconTint}]}
          />
        </SpringPressable>
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
    headerIconTint,
    styles,
  ]);

 /** -----------------------
 * 리스트 아이템
 * ---------------------- */
  const renderItem = ({item, index}) => {
    const isSelected = selectedIndex === index;

    return (
      <SpringPressable
        onPress={() => {
          setSelectedIndex(index);
          setSelectedCategory(item);
        }}
        activeOpacity={0.85}
        style={[styles.itemContainer, isSelected && styles.selectedItem]}>
        <AppText
          style={[styles.itemText, isSelected && styles.itemTextOnSelected]}>
          {item.title}
        </AppText>

        {/* 기존 라디오 이미지 제거 → 체크뱃지로 통일 */}
        <View style={styles.rightArea}>
          {isSelected ? (
            <CheckBadge
              size={getResponsiveWidth(16)}
              dotSize={getResponsiveWidth(8)}
              borderWidth={2}
              borderColor={colors.brandPrimary}
              backgroundColor="#FFFFFF"
              dotColor={colors.brandPrimary}
            />
          ) : (
            <View style={styles.badgePlaceholder} />
          )}
        </View>
      </SpringPressable>
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
            <SpringPressable
              style={styles.addButton}
              onPress={() => setAddModalVisible(true)}
              activeOpacity={0.85}>
              <AppText style={styles.addText}>
                카테고리 추가
              </AppText>
            </SpringPressable>
            <View style={styles.separator} />
          </>
        }
      />

      <CategoryModal
        visible={addModalVisible}
        onClose={() => {
          setNewCategory('');
          setIsCategoryInputFocused(false);
          setAddModalVisible(false);
        }}
        onConfirm={handleAddCategory}
        confirmDisabled={newCategory.trim().length === 0}
        content={
          <View
            style={[
              styles.inputWrap,
              isCategoryInputFocused && styles.inputWrapFocused,
            ]}>
            <CustomInput
              disableBaseStyle={true}
              disableFocusStyle={true}
              placeholder="예: 2026 가족 여행"
              placeholderTextColor={EMPTY_STYLE().emptyColor}
              style={styles.input}
              value={newCategory}
              onChangeText={setNewCategory}
              onFocus={() => setIsCategoryInputFocused(true)}
              onBlur={() => setIsCategoryInputFocused(false)}
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}

