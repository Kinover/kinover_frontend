import React from 'react';
import {Text, StyleSheet, Platform, View,ToastAndroid, Alert, Pressable} from 'react-native';
import {
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import CustomModal from '../../../components/CustomModal';
import Clipboard from '@react-native-clipboard/clipboard'; // ✅ 이렇게!
import FastImage from '@d11/react-native-fast-image';
export default function FamilyCodeModal({visible, onClose, familyCode}) {
  return (
    <CustomModal
      showCloseButton={false}
      visible={visible}
      onClose={onClose}
      onConfirm={onClose}
      confirmText="확인"
      buttonBottomStyle={styles.modalButtonRow}
      title={'가족 초대 코드'}
      subText={'복사 아이콘을 눌러,\n함께할 가족에게 코드를 알려주세요'}>
      {/* 추가된 가족코드 안내 문구 */}
      <View style={styles.codeContainer}>
        <Text style={styles.codeText}>{familyCode}</Text>
        <Pressable
          onPress={() => {
            Clipboard.setString(familyCode);
            if (Platform.OS === 'android') {
              ToastAndroid.show('복사되었습니다', ToastAndroid.SHORT);
            } else {
              Alert.alert('복사되었습니다');
            }
          }}>
          <FastImage
            source={require('../../../assets/icons/copy.png')}
            style={styles.copyIcon}
            resizeMode="contain"
          />
        </Pressable>
      </View>
    </CustomModal>
  );
}

const styles = StyleSheet.create({
  modalTitle: {
    color: 'black',
    fontSize: getResponsiveFontSize(22),
    textAlign: 'center',
    fontFamily: 'Pretendard-SemiBold',
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    marginBottom: getResponsiveHeight(10),
    marginTop: getResponsiveHeight(10),
    lineHeight: getResponsiveHeight(24),
  },
  codeContainer: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: getResponsiveWidth(10),
    paddingVertical: getResponsiveHeight(14),
    // paddingHorizontal: getResponsiveWidth(20),
    alignItems: 'flex-start',
    marginVertical: getResponsiveHeight(5),
  },
  modalText: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(14),
    textAlign: 'center',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: getResponsiveHeight(10),
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#FFC84D',
    paddingVertical: getResponsiveHeight(11),
    borderRadius: getResponsiveWidth(8),
  },
  helperText: {
    fontSize: getResponsiveFontSize(14),
    color: '#999',
    fontFamily: 'Pretendard-Regular',
    textAlign: 'center',
    marginBottom: getResponsiveHeight(8),
  },
  // codeContainer: {
  //   backgroundColor: '#F5F5F5',
  //   borderRadius: getResponsiveWidth(10),
  //   paddingVertical: getResponsiveHeight(14),
  //   paddingHorizontal: getResponsiveWidth(20), // 양쪽 여백 확보
  //   alignItems: 'center',
  //   justifyContent: 'space-between',
  //   flexDirection: 'row',
  //   marginVertical: getResponsiveHeight(5),
  // },
  codeText: {
    flex: 1, // 아이콘과 공간 나눔
    fontSize: getResponsiveFontSize(11),
    fontFamily: 'Pretendard-SemiBold',
    color: '#333',
    letterSpacing: 1,
    textAlign: 'left',
  },
  copyIcon: {
    width: getResponsiveIconSize(18),
    height: getResponsiveIconSize(18),
  },
});
