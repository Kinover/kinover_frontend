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
  Dimensions,
} from 'react-native';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import BottomSheetLayout from 'components/BottomSheetLayout';
import {Shadow} from 'react-native-shadow-2';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

// 아이템 1개당 대략적인 높이 (padding 포함)
const ITEM_HEIGHT = getResponsiveHeight(52);
// 바텀시트가 가질 수 있는 최소/최대 비율
const MIN_SNAP_RATIO = 0.25; // 25%
const MAX_SNAP_RATIO = 0.75; // 75%
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

    // ✅ 카테고리 개수에 따라 바텀시트 높이 동적 계산
    const snapPoints = useMemo(() => {
      // 실제 화면에 보이는 개수(스크롤 없이)
      const visibleCount = Math.min(data.length, MAX_VISIBLE_ITEMS);

      // 내용 높이 대략 계산
      const contentHeight =
        visibleCount * ITEM_HEIGHT + getResponsiveHeight(150); // 헤더 + 여유분

      // 화면 비율로 변환
      const ratio = Math.min(
        MAX_SNAP_RATIO,
        Math.max(MIN_SNAP_RATIO, contentHeight / SCREEN_HEIGHT),
      );

      return [`${ratio * 100}%`]; // 예: "35%"
    }, [data.length]);

    // ✅ 스크롤 영역의 최대 높이 (이 이상이면 스크롤)
    const maxListHeight = useMemo(() => MAX_VISIBLE_ITEMS * ITEM_HEIGHT, []);

    return (
      <BottomSheetLayout
        modalRef={modalRef}
        snapPoints={snapPoints}
        enableContentPanningGesture={false}
        title="카테고리 선택"
        subtitle="보고 싶은 게시글의 카테고리를 선택해 주세요."
        innerContentStyle={styles.innerContent}
        useFixedFooter={false}>
        <SafeAreaView style={{flex: 1}}>
          <View style={styles.listWrapper}>
            {/* ✅ 카테고리가 많으면 이 영역 내부에서 스크롤 */}
            <ScrollView
              style={[styles.scrollArea, {maxHeight: maxListHeight}]}
              bounces={false}
              showsVerticalScrollIndicator={false}>
              {data.map((cat, index) => {
                const isSelected = cat.title === tempSelected?.title;
                const key = cat.id ? String(cat.id) : `${cat.title}-${index}`;

                const itemComponent = (
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
                );

                return (
                  <View
                    key={key}
                    style={{marginBottom: getResponsiveHeight(8)}}>
                    {itemComponent}
                  </View>
                );

                // ✅ 선택된 아이템만 Shadow 적용
                // return isSelected ? (
                //   <Shadow
                //     key={key}
                //     distance={2} // 🔹 퍼지는 정도 (짧게)
                //     offset={[0, 0]} // 🔹 위/아래 대칭으로
                //     startColor="rgba(0,0,0,0.12)" // 🔹 진하기
                //     endColor="rgba(0,0,0,0.0)"
                //     radius={11}
                //     style={{
                //       borderRadius: 11,
                //       marginBottom: getResponsiveHeight(8),
                //     }}>
                //     {itemComponent}
                //   </Shadow>
                // ) : (
                //   <View
                //     key={key}
                //     style={{marginBottom: getResponsiveHeight(8)}}>
                //     {itemComponent}
                //   </View>
                // );
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
    flexGrow: 0, // 내용 높이에 맞추되 maxHeight까지만
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
