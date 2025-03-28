import React, {useState, useMemo} from 'react';
import BottomSheet, {BottomSheetView} from '@gorhom/bottom-sheet';
import { Modal } from 'react-native';

import {BlurView} from '@react-native-community/blur';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../utils/responsive';
import {useSelector} from 'react-redux';

export default function UserAddBottomSheet({onClose, user}) {
  const family = useSelector(state => state.family);
  const [bottomSheetIndex, setBottomSheetIndex] = useState(0);

  const snapPoints = ['70%'];

  return (
    <Modal visible={true} transparent animationType="fade">

      <BlurView
        style={[
          StyleSheet.absoluteFill,
          {
           flex:1,
            position: 'absolute',
            backgroundColor: 'rgba(0, 0, 0, 0.4)', // ← ✅ 핵심!
          },
        ]}
        blurType="light" // or 'light', 'extraLight', etc.
        blurAmount={2} // 흐림 정도
        reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.4)"
        // ✅ 여기!
      ></BlurView>
      <BottomSheet
        index={bottomSheetIndex}
        snapPoints={snapPoints}
        onChange={index => setBottomSheetIndex(index)}
        handleIndicatorStyle={{display: 'none'}}
        enablePanDownToClose={true}
        onClose={onClose}>
        <BottomSheetView style={styles.sheetContentContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.titleText}>
            {`'${user.name}' 님의\n구성원 설정을 변경하시겠습니까?`}
            </Text>

            {/* 역할 선택 */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>
                나의 역할
                <Text
                  style={{color: 'black', fontFamily: 'Pretendard-Regular'}}>
                  이 무엇인지 알려주세요
                </Text>
              </Text>
              <View style={styles.roleImageRow}>
                {/* 이미지 반복 */}
                {[0, 1, 2, 3].map((_, i) => (
                  <Image
                    key={i}
                    source={require('../../assets/images/kino-yellow.png')}
                    style={styles.roleImage}
                  />
                ))}
              </View>
            </View>

            {/* 색상 선택 */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>
                나의 색깔
                <Text
                  style={{color: 'black', fontFamily: 'Pretendard-Regular'}}>
                  을 골라주세요
                </Text>
              </Text>
              <View style={styles.colorCircleRow}>
                {[...Array(12)].map((_, i) => (
                  <View key={i} style={styles.colorCircle} />
                ))}
              </View>
            </View>

            {/* 버튼 */}
            <View style={styles.bottomContainer}>
              <TouchableOpacity style={styles.applyButton}>
                <Text style={styles.applyButtonText}>적용하기</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>취소하기</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </BottomSheetView>
      </BottomSheet>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetContentContainer: {
    paddingHorizontal: getResponsiveWidth(35),
    paddingTop: getResponsiveHeight(25),
  },
  titleText: {
    fontSize: getResponsiveFontSize(20),
    marginBottom: getResponsiveHeight(20),
    fontFamily: 'Pretendard-SemiBold',
  },
  sectionContainer: {
    marginBottom: getResponsiveHeight(20),
    borderColor: '#FFC84D',
    borderWidth: 1,
    padding: getResponsiveIconSize(14),
    borderRadius: getResponsiveIconSize(10),
    gap: getResponsiveIconSize(15),
    backgroundColor: '#FFF8E9',
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize(15),
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFB800',
    marginBottom: getResponsiveHeight(10),
  },
  roleImageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleImage: {
    width: getResponsiveWidth(60),
    height: getResponsiveHeight(60),
    resizeMode: 'contain',
  },
  colorCircleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: getResponsiveWidth(10),
  },
  colorCircle: {
    width: getResponsiveWidth(30),
    height: getResponsiveWidth(30),
    borderRadius: getResponsiveWidth(15),
    backgroundColor: '#D9D9D9',
  },
  bottomConatiner:{
    
  },
  applyButton: {
    backgroundColor: '#FFC84D',
    paddingVertical: getResponsiveHeight(12),
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: getResponsiveHeight(10),
  },
  applyButtonText: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
    color: '#000',
  },
  cancelButton: {
    backgroundColor: '#D9D9D9',
    paddingVertical: getResponsiveHeight(12),
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: getResponsiveFontSize(14),
    fontWeight: '600',
    color: '#000',
  },
});
