import React, {useMemo, useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
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
  // const snapPoints = useMemo(() => ['80%'], []);

  const snapPoints = useMemo(() => ['60%'], []);
  const [tempSelected, setTempSelected] = useState(selectedCategory);

  useEffect(() => {
    setTempSelected(selectedCategory); // bottom sheet 열릴 때 초기화
  }, [selectedCategory]);

  const handleApply = () => {
    onSelectCategory(tempSelected);
    sheetRef.current?.close();
  };

  return (
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
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>카테고리 선택</Text>
          <TouchableOpacity onPress={onCancel}>
            <Image
              style={styles.closeIcon}
              source={require('../../../assets/images/close-yellow.png')}
            />
          </TouchableOpacity>
        </View>

        {/* 카테고리 리스트 */}
        <ScrollView
          contentContainerStyle={[styles.listContainer, {flexGrow: 1}]}
          showsVerticalScrollIndicator={false}>
          {[{title: '전체'}, ...categoryList].map((cat, index) => {
            const isSelected = cat.title === tempSelected?.title;
            return (
              <TouchableOpacity
                key={index}
                style={[styles.categoryItem, isSelected && styles.selectedItem]}
                onPress={() => setTempSelected(cat)}>
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
          {/* 적용하기 버튼 */}
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>적용하기</Text>
          </TouchableOpacity>
        </ScrollView>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: getResponsiveWidth(20),
    paddingVertical: getResponsiveWidth(25),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveHeight(30),
  },
  title: {
    fontSize: getResponsiveFontSize(23),
    fontFamily: 'Pretendard-SemiBold',
    textAlign: 'left',
  },
  closeIcon: {
    width: getResponsiveIconSize(13),
    height: getResponsiveIconSize(13),
    resizeMode: 'contain',
  },
  listContainer: {
    // flexGrow: 1,
    paddingBottom: '90%',
  },
  categoryItem: {
    paddingVertical: getResponsiveHeight(20),
    paddingHorizontal: getResponsiveWidth(18),
    borderRadius: 13,
    backgroundColor: 'white',
    borderColor: '#D9D9D9',
    borderWidth: getResponsiveIconSize(1.4),
    marginBottom: getResponsiveHeight(8),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  checkIcon: {
    width: getResponsiveIconSize(13),
    height: getResponsiveIconSize(11),
    resizeMode: 'contain',
  },
  applyButton: {
    borderRadius: 13,
    backgroundColor: '#FFC749',
    paddingVertical: getResponsiveHeight(20),
    paddingHorizontal: getResponsiveWidth(18),
  },
  applyButtonText: {
    color: 'white',
    fontFamily: 'Pretendard-Bold',
    fontSize: getResponsiveFontSize(15),
    alignSelf: 'center',
  },
});
