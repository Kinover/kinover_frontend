import React from 'react';
import {Text, StyleSheet, Platform, View, Image} from 'react-native';
import {
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import CustomModal from '../../../components/customModal';
import {Clipboard} from '@react-native-clipboard/clipboard';

import {ToastAndroid, Alert, Pressable} from 'react-native';

export default function FamilyCodeModal({visible, onClose, familyCode}) {
  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      onConfirm={onClose}
      confirmText="닫기"
      confirmButtonStyle={styles.confirmButton}
      confirmTextStyle={styles.modalText}
      buttonBottomStyle={styles.modalButtonRow}>
      {/* 추가된 가족코드 안내 문구 */}
      <Text style={styles.modalTitle}>가족 코드는 다음과 같습니다.</Text>

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
          <Image
            source={require('../../../assets/icons/copy.png')}
            style={styles.copyIcon}
            resizeMode="contain"
          />
        </Pressable>
      </View>

      <Text style={styles.helperText}>
        복사 아이콘을 눌러, 함께할 가족에게 코드를 알려주세요
      </Text>
    </CustomModal>
  );
}

const styles = StyleSheet.create({
  modalTitle: {
    fontSize: getResponsiveFontSize(17),
    textAlign: 'center',
    fontFamily: 'Pretendard-SemiBold',
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    marginBottom: getResponsiveHeight(5),
    marginTop: getResponsiveHeight(20),
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
    fontSize: getResponsiveFontSize(11.5),
    color: '#999',
    fontFamily: 'Pretendard-Regular',
    textAlign: 'center',
    marginTop: getResponsiveHeight(4),
  },
  codeContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: getResponsiveWidth(10),
    paddingVertical: getResponsiveHeight(14),
    paddingHorizontal: getResponsiveWidth(20), // 양쪽 여백 확보
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    marginVertical: getResponsiveHeight(5),
  },
  codeText: {
    flex: 1, // 아이콘과 공간 나눔
    fontSize: getResponsiveFontSize(13),
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
