import React, {
  useRef,
  useMemo,
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
  ScrollView,
  Image,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../../utils/responsive';

const CategoryBottomSheetModal = forwardRef(
  ({categoryList = [], selectedCategory, onSelectCategory, onCancel}, ref) => {
    const modalRef = useRef(null);
    const snapPoints = useMemo(() => ['60%']); // ✅ 최대 80%
    const [tempSelected, setTempSelected] = useState(selectedCategory);

    useImperativeHandle(ref, () => ({
      present: () => modalRef.current?.present(),
      dismiss: () => modalRef.current?.dismiss(),
    }));

    useEffect(() => {
      setTempSelected(selectedCategory);
    }, [selectedCategory]);

    const handleApply = () => {
      onSelectCategory(tempSelected);
      modalRef.current?.dismiss();
    };

    return (
      <BottomSheetModal
        ref={modalRef}
        index={0} // 초기엔 닫힌 상태
        snapPoints={snapPoints}
        handleIndicatorStyle={{backgroundColor: '#ccc', width: 55}} // 색과 크기 조절 가능
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
        <View style={{flex: 1, maxHeight: '100%'}}>
          <BottomSheetScrollView
            contentContainerStyle={[styles.container]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title}>카테고리 선택</Text>
            </View>

            {[{title: '전체'}, ...categoryList].map((cat, index) => {
              const isSelected = cat.title === tempSelected?.title;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.categoryItem,
                    isSelected && styles.selectedItem,
                  ]}
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

            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>적용하기</Text>
            </TouchableOpacity>
          </BottomSheetScrollView>
        </View>
      </BottomSheetModal>
    );
  },
);

export default CategoryBottomSheetModal;

const styles = StyleSheet.create({
  container: {
    paddingVertical: getResponsiveWidth(20),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveHeight(30),
  },
  title: {
    paddingHorizontal: getResponsiveWidth(30),

    fontSize: getResponsiveFontSize(23),
    fontFamily: 'Pretendard-SemiBold',
    textAlign: 'left',
  },
  closeIcon: {
    width: getResponsiveIconSize(13),
    height: getResponsiveIconSize(13),
    resizeMode: 'contain',
  },
  categoryItem: {
    marginHorizontal: getResponsiveWidth(22),
    paddingVertical: getResponsiveHeight(20),
    paddingHorizontal: getResponsiveWidth(10),
    backgroundColor: 'white',
    borderRadius: 13,
    marginBottom: getResponsiveHeight(8),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedItem: {
    backgroundColor: '#FFF6E1',
    // borderColor: '#FFC84D',
    // borderWidth: 1.4,
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
    width: getResponsiveIconSize(17),
    height: getResponsiveIconSize(14),
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
