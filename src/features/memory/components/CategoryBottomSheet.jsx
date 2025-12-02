// src/screens/xxx/CategoryBottomSheetModal.js

import React, {
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import BottomSheetLayout from 'components/BottomSheetLayout';

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

    const handleApply = () => {
      onSelectCategory?.(tempSelected);
      modalRef.current?.dismiss();
    };
    const handleSelect = cat => {
      setTempSelected(cat); // 로컬 하이라이트용
      onSelectCategory?.(cat); // 부모에 바로 반영
      modalRef.current?.dismiss(); // 바텀시트 닫기
    };

    const data = [{title: '전체'}, ...categoryList];

    return (
      <BottomSheetLayout
        modalRef={modalRef}
        snapPoints={['75%']}
        enableContentPanningGesture={false}
        title="카테고리 선택"
        subtitle="보고 싶은 게시글의 카테고리를 선택해 주세요."
        // footerProps 삭제
        innerContentStyle={styles.innerContent}
        useFixedFooter={false}>
        <SafeAreaView style={{flex: 1}}>
          <View style={styles.listWrapper}>
            {/* ✅ 여기서는 그냥 View 안에 map만 — 스크롤은 바깥 BottomSheetLayout이 맡음 */}
            <View style={styles.scrollArea}>
              {data.map((cat, index) => {
                const isSelected = cat.title === tempSelected?.title;
                const key = cat.id ? String(cat.id) : `${cat.title}-${index}`;

                return (
                  <TouchableOpacity
                    key={key}
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
              })}
            </View>

            {/* 페이드 효과는 그대로 유지 */}
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
              style={styles.fadeOverlay}
              pointerEvents="none"
            />
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
    // 필요하면 여기서만 살짝 조절 (레이아웃 기본 padding + α 느낌)
    paddingTop: getResponsiveHeight(6),
    paddingBottom: getResponsiveHeight(4),
  },
  listWrapper: {
    flex: 1,
    position: 'relative',
  },
  scrollArea: {
    flex: 1,
    paddingBottom: getResponsiveHeight(20),
  },
  fadeOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: getResponsiveHeight(60),
  },
  categoryItem: {
    paddingVertical: getResponsiveHeight(14),
    paddingHorizontal: getResponsiveWidth(14),
    borderRadius: 11,
    marginBottom: getResponsiveHeight(8),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  selectedItem: {
    backgroundColor: '#FFF6DD',
    borderColor: '#FFC749',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
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
