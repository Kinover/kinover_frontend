// src/screens/xxx/CategoryBottomSheetModal.js (경로는 있는 그대로 써줘)
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
import {BottomSheetScrollView} from '@gorhom/bottom-sheet';
import LinearGradient from 'react-native-linear-gradient';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import {BottomSheetButtons} from 'components/BottomSheetButtons';
import {KinoBottomSheet} from 'components/KinoBottomSheetModal';
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
      <KinoBottomSheet
        modalRef={modalRef}
        snapPoints={['55%']}
        enableContentPanningGesture={false}>
        <SafeAreaView style={styles.sheetContainer}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.title}>카테고리 선택</Text>
            <Text style={styles.sheetSubtitle}>
              보고 싶은 게시글의 카테고리를 선택해 주세요.
            </Text>
          </View>

          {/* 리스트 영역 */}
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
            </BottomSheetScrollView>

            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
              style={styles.fadeOverlay}
              pointerEvents="none"
            />
          </View>

          {/* 하단 버튼 */}
          <View style={styles.footer}>
            <BottomSheetButtons
              onSave={handleApply}
              saveLabel="적용하기"
              showCancel={false}
            />
          </View>
        </SafeAreaView>
      </KinoBottomSheet>
    );
  },
);

CategoryBottomSheetModal.displayName = 'CategoryBottomSheetModal';

export default CategoryBottomSheetModal;

// styles는 너가 쓰던 그대로 유지하면 됨

const styles = StyleSheet.create({
  sheetContainer: {
    flex: 1,
    paddingTop: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(22),
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: getResponsiveHeight(10),
  },
  title: {
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(18)
        : getResponsiveFontSize(19),
    fontFamily: 'Pretendard-SemiBold',
    color: '#111827',
  },
  sheetSubtitle: {
    marginTop: getResponsiveHeight(4),
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Regular',
    color: '#6B7280',
  },
  listWrapper: {
    flex: 1,
    position: 'relative',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
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
    width: getResponsiveIconSize(18),
    height: getResponsiveIconSize(18),
    resizeMode: 'contain',
  },
  footer: {
    paddingHorizontal: getResponsiveWidth(0),
    paddingBottom: getResponsiveHeight(Platform.OS === 'ios' ? 30 : 12),
  },
});
