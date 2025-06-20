import React, {useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import BottomSheet, {BottomSheetView} from '@gorhom/bottom-sheet';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../../utils/responsive';

export default function CategoryBottomSheet({
  sheetRef,
  isVisible,
  categoryList = [],
  selectedCategory,
  onSelectCategory,
  onCancel,
}) {
  const snapPoints = useMemo(() => ['60%'], []);

  return (
    <>
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        handleComponent={() => null}
        backgroundStyle={{
          backgroundColor: 'white',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}>
        <BottomSheetView style={styles.container}>
          <Text style={styles.title}>카테고리 선택</Text>
          <ScrollView contentContainerStyle={styles.listContainer}>
            {[{title: '전체'}, ...categoryList].map((cat, index) => {
              const isSelected = cat.title === selectedCategory?.title;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.categoryItem,
                    isSelected && styles.selectedItem,
                  ]}
                  onPress={() => onSelectCategory(cat)}>
                  <Text
                    style={[
                      styles.categoryText,
                      isSelected && styles.selectedText,
                    ]}>
                    {cat.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </BottomSheetView>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    position: 'absolute',
    zIndex: 0,
  },
  container: {
    paddingHorizontal: getResponsiveWidth(20),
    paddingVertical: getResponsiveWidth(25),
  },
  title: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
    fontFamily: 'Pretendard-Regular',
    marginBottom: getResponsiveHeight(30),
    textAlign: 'left',
  },
  listContainer: {
    paddingBottom: getResponsiveHeight(20),
  },
  categoryItem: {
    paddingVertical: getResponsiveHeight(20),
    paddingHorizontal: getResponsiveWidth(15),
    borderRadius: 13,
    backgroundColor: 'white',
    borderColor: '#D9D9D9',
    borderWidth: getResponsiveIconSize(1.4),
    marginBottom: getResponsiveHeight(8),
  },
  selectedItem: {
    backgroundColor: '#FFF6E1',
    borderColor: '#FFC84D',
    borderWidth: 1.4,
  },
  categoryText: {
    fontSize: getResponsiveFontSize(15),
    fontFamily: 'Pretendard-Medium',
    textAlign: 'left',
    color: '#808080',
  },
  selectedText: {
    fontFamily: 'Pretendard-SemiBold',
    fontWeight: 'bold',
    color: '#333',
  },
});
