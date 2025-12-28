// src/screens/xxx/CategoryBottomSheetModal.js

import React, {
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import BottomSheetLayout from 'components/BottomSheetLayout';
import {useBottomSheetDynamicSnapPoints} from '@gorhom/bottom-sheet';

// 아이템 1개당 대략적인 높이 (padding 포함)
const ITEM_HEIGHT = getResponsiveHeight(52);
// 스크롤 없이 보여줄 최대 개수
const MAX_VISIBLE_ITEMS = 6;

const CategoryBottomSheetModal = forwardRef(
  ({categoryList = [], selectedCategory, onSelectCategory}, ref) => {
    const modalRef = useRef(null);
    const [tempSelected, setTempSelected] = useState(selectedCategory);

    useImperativeHandle(ref, () => ({
      present: () => modalRef.current?.present(),
      dismiss: () => modalRef.current?.dismiss(),
    }));

    useEffect(() => {
      setTempSelected(selectedCategory);
    }, [selectedCategory]);

    const handleSelect = cat => {
      setTempSelected(cat); // 로컬 하이라이트용
      onSelectCategory?.(cat); // 부모에 바로 반영
      modalRef.current?.dismiss(); // 바텀시트 닫기
    };

    const data = useMemo(
      () => [{title: '전체'}, ...categoryList],
      [categoryList],
    );

    // ✅ 바텀시트 높이 = 콘텐츠 양만큼
    // (CONTENT_HEIGHT 문자열을 "그냥" 쓰면 에러 나서, 이 훅이 필수)
    const initialSnapPoints = useMemo(() => ['CONTENT_HEIGHT'], []);
    const {
      animatedSnapPoints,
      animatedHandleHeight,
      animatedContentHeight,
      handleContentLayout,
    } = useBottomSheetDynamicSnapPoints(initialSnapPoints);

    // ✅ 리스트는 MAX_VISIBLE_ITEMS까지만 높이를 허용하고, 넘치면 내부 스크롤
    const maxListHeight = useMemo(
      () => MAX_VISIBLE_ITEMS * ITEM_HEIGHT,
      [],
    );

    return (
      <BottomSheetLayout
        modalRef={modalRef}
        // ✅ dynamic snap points
        snapPoints={animatedSnapPoints}
        handleHeight={animatedHandleHeight}
        contentHeight={animatedContentHeight}
        onContentLayout={handleContentLayout}
        enableContentPanningGesture={false}
        // 키보드가 있다 해도 시트 자체가 밀리지 않게(통일)
        keyboardBehavior="none"
        androidKeyboardInputMode="adjustNothing"
        title="카테고리 선택"
        subtitle="보고 싶은 게시글의 카테고리를 선택해 주세요."
        innerContentStyle={styles.innerContent}
        useFixedFooter={false}>
        <SafeAreaView style={{flex: 1}}>
          <View style={styles.listWrapper}>
            <ScrollView
              style={[styles.scrollArea, {maxHeight: maxListHeight}]}
              bounces={false}
              showsVerticalScrollIndicator={false}>
              {data.map((cat, index) => {
                const isSelected = cat.title === tempSelected?.title;
                const key = cat.id ? String(cat.id) : `${cat.title}-${index}`;

                return (
                  <View
                    key={key}
                    style={{marginBottom: getResponsiveHeight(8)}}>
                    <TouchableOpacity
                      style={[
                        styles.categoryItem,
                        isSelected && styles.selectedItem,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => handleSelect(cat)}>
                      <Text
                        style={[
                          styles.categoryText,
                          isSelected && styles.selectedText,
                        ]}>
                        {cat.title}
                      </Text>

                      {isSelected && (
                        <Image
                          source={require('../../../assets/icons/check-yellow.png')}
                          style={styles.checkIcon}
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </SafeAreaView>
      </BottomSheetLayout>
    );
  },
);

CategoryBottomSheetModal.displayName = 'CategoryBottomSheetModal';
export default CategoryBottomSheetModal;

const styles = StyleSheet.create({
  innerContent: {
    paddingTop: getResponsiveHeight(6),
    paddingBottom: getResponsiveHeight(4),
  },
  listWrapper: {
    flex: 1,
    position: 'relative',
  },
  scrollArea: {
    flexGrow: 0,
    paddingBottom: getResponsiveHeight(10),
  },
  categoryItem: {
    paddingVertical: getResponsiveHeight(14),
    paddingHorizontal: getResponsiveWidth(14),
    borderRadius: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    width: '100%',
  },
  selectedItem: {
    backgroundColor: '#FFF6DD',
    borderColor: '#FFC749',
  },
  categoryText: {
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(14)
        : getResponsiveFontSize(15),
    fontFamily: 'Pretendard-Medium',
    color: '#374151',
  },
  selectedText: {
    fontFamily: 'Pretendard-SemiBold',
    color: '#FF9A00',
  },
  checkIcon: {
    width: getResponsiveIconSize(15),
    height: getResponsiveIconSize(15),
    resizeMode: 'contain',
  },
});
