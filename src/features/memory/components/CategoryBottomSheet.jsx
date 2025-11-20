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
                    <Image
                      source={
                        isSelected
                          ? require('../../../assets/icons/check-yellow.png')
                          : require('../../../assets/icons/check-gray.png')
                      }
                      style={styles.checkIcon}
                    />
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
    height: getResponsiveHeight(120), // 그라데이션 범위 (원하면 50~60으로 키워도 됨)
  },
  categoryItem: {
    paddingVertical: getResponsiveHeight(18),
    paddingHorizontal: getResponsiveWidth(15),
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: getResponsiveHeight(10),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedItem: {
    backgroundColor: '#FFFAEF',
  },
  categoryText: {
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(17)
        : getResponsiveFontSize(18),
    fontFamily: 'Pretendard-Medium',
    color: '#666',
  },
  selectedText: {
    fontFamily: 'Pretendard-Bold',
    fontWeight: '700',
    color: '#FFC84D',
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
