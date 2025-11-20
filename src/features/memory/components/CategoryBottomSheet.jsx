// src/screens/xxx/CategoryBottomSheetModal.js (경로는 있는 그대로 써줘)

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
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import LinearGradient from 'react-native-linear-gradient';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../../utils/responsive';

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
      setTempSelected(cat);
    };

    const data = [{title: '전체'}, ...categoryList];

    return (
      <BottomSheetModal
        ref={modalRef}
        index={0}
        snapPoints={['60%']}
        enableContentPanningGesture={false}
        handleIndicatorStyle={{width: 0, height: 0}}
        backdropComponent={props => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
        backgroundStyle={{
          backgroundColor: 'white',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}>
        <SafeAreaView style={styles.sheetContainer}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.title}>카테고리 선택</Text>
          </View>

          {/* 스크롤 + 하단 그라데이션 */}
          <View style={styles.listWrapper}>
            <BottomSheetScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}>
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
                    activeOpacity={0.8}
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
            </BottomSheetScrollView>

            {/* 리스트 하단 흰색 그라데이션 */}
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
              style={styles.fadeOverlay}
              pointerEvents="none"
            />
          </View>

          {/* 하단 버튼 */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.applyButton}
              activeOpacity={0.9}
              onPress={handleApply}>
              <Text style={styles.applyButtonText}>적용하기</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </BottomSheetModal>
    );
  },
);

CategoryBottomSheetModal.displayName = 'CategoryBottomSheetModal';

export default CategoryBottomSheetModal;

const styles = StyleSheet.create({
  sheetContainer: {
    flex: 1,
    paddingTop: getResponsiveHeight(12),
  },
  header: {
    alignItems: 'center',
    marginBottom: getResponsiveHeight(12),
  },
  title: {
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(18)
        : getResponsiveFontSize(20),
    fontFamily: 'Pretendard-Bold',
    fontWeight: '700',
    color: '#222',
  },
  listWrapper: {
    flex: 1,
    position: 'relative',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: getResponsiveWidth(15),
    paddingBottom: getResponsiveHeight(30), // 리스트 끝 여유
  },
  fadeOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: getResponsiveHeight(70), // 120 → 70 정도로 줄여보기
  },
  categoryItem: {
    paddingVertical: getResponsiveHeight(17), // 살짝 줄여서 덜 둔탁하게
    paddingHorizontal: getResponsiveWidth(15),
    borderRadius: 12,
    marginBottom: getResponsiveHeight(8),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // ✅ 기본 배경은 투명 + 옅은 테두리
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  selectedItem: {
    // ✅ 선택된 애만 카드처럼
    backgroundColor: '#FFF6DD',
    borderColor: '#FFC749',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryText: {
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(14)
        : getResponsiveFontSize(15),
    fontFamily: 'Pretendard-Medium',
    color: '#444', // 조금 더 진한 톤으로
  },
  selectedText: {
    fontFamily: 'Pretendard-Bold',
    fontWeight: '700',
    color: '#FF9A00', // 완전 노랑(#FFC84D)보다 살짝 주황 섞인 느낌
  },
  checkIcon: {
    width: getResponsiveIconSize(18),
    height: getResponsiveIconSize(18),
    resizeMode: 'contain',
  },
  footer: {
    paddingHorizontal: getResponsiveWidth(15),
    paddingBottom: getResponsiveHeight(Platform.OS === 'ios' ? 30 : 10),
    paddingTop: getResponsiveHeight(6),
  },
  applyButton: {
    width: '100%',
    paddingVertical: getResponsiveHeight(16),
    borderRadius: 10,
    backgroundColor: '#FFC749',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontFamily: 'Pretendard-Bold',
    fontWeight: '700',
    fontSize: getResponsiveFontSize(17),
  },
});
