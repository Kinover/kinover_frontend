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
      onSelectCategory(tempSelected);
      modalRef.current?.dismiss();
    };

    return (
      <BottomSheetModal
        ref={modalRef}
        index={0}
        snapPoints={['60%']} // ✅ 고정 높이
        enableContentPanningGesture={false} // ✅ 위아래 이동 불가
        handleIndicatorStyle={{width: 0}}
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
          <View style={styles.header}>
            <Text style={styles.title}>카테고리 선택</Text>
          </View>

          {/* ✅ 스크롤 영역 */}
          <BottomSheetScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
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
          </BottomSheetScrollView>
          {/* ✅ 고정 버튼 */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
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
    // flex: 1,
    height: Platform.OS === 'android' ? '55%' : '55%',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    // paddingVertical: getResponsiveHeight(10),
    // paddingBottom: '50%', // ✅ footer랑 겹치지 않게 여유 확보
  },
  header: {
    marginBottom: getResponsiveHeight(20),
    alignItems: 'center',
    // borderBottomColor:'lightgray',
    // paddingBottom:20,
    // borderBottomWidth:0.3,
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
  categoryItem: {
    paddingHorizontal: getResponsiveWidth(15),
    marginHorizontal: getResponsiveWidth(15),
    paddingVertical: getResponsiveHeight(22),
    // paddingHorizontal: getResponsiveWidth(20),
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: getResponsiveHeight(10),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedItem: {
    // backgroundColor: '#FFF6E1',

    backgroundColor: '#FFFAEF',

    // borderColor: '#FFC84D',
    // borderWidth: 1.2,
  },
  categoryText: {
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(17)
        : getResponsiveFontSize(18),
    fontFamily: 'Pretendard-Medium',
    color: '#666',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  selectedText: {
    fontFamily: 'Pretendard-Bold',
    fontWeight: '700',
    color: '#FFC84D',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  checkIcon: {
    width: getResponsiveIconSize(18),
    height: getResponsiveIconSize(18),
    resizeMode: 'contain',
    objectFit: 'contain',
  },
  footer: {
    // position:'absolute',
    // bottom:'20',
    paddingHorizontal: getResponsiveWidth(15),
  },
  applyButton: {
    flex: 1,
    paddingVertical: getResponsiveHeight(18),
    borderRadius: 10,
    backgroundColor: '#FFC749',
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontFamily: 'Pretendard-Bold',
    fontWeight: '700',
    fontSize: getResponsiveFontSize(17),
  },
});
