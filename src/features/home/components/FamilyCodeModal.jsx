import React, {useState, useCallback, useEffect} from 'react';
import {Text, StyleSheet, View, Pressable} from 'react-native';
import {
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import CustomModal from '../../../components/CustomModal';
import Clipboard from '@react-native-clipboard/clipboard';
import FastImage from '@d11/react-native-fast-image';

export default function FamilyCodeModal({visible, onClose, familyCode}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!familyCode) return;
    Clipboard.setString(familyCode);
    setCopied(true);
  }, [familyCode]);

  // 모달이 닫힐 때마다 문구 초기화
  useEffect(() => {
    if (!visible) {
      setCopied(false);
    }
  }, [visible]);

  const subText = copied
    ? '초대 코드가 복사되었어요.'
    : '복사 아이콘을 눌러,\n함께할 가족에게 코드를 알려주세요';

  return (
    <CustomModal
      showCloseButton={false}
      visible={visible}
      onClose={onClose}
      onConfirm={onClose}
      confirmText="확인"
      buttonBottomStyle={styles.modalButtonRow}
      title="가족 초대 코드"
      subText={subText}>
      <View style={styles.innerWrapper}>
        <View style={styles.codeContainer}>
          <Text style={styles.codeText}>{familyCode}</Text>

          <Pressable onPress={handleCopy}>
            <FastImage
              source={require('../../../assets/icons/copy.png')}
              style={styles.copyIcon}
              resizeMode="contain"
            />
          </Pressable>
        </View>
      </View>
    </CustomModal>
  );
}

const styles = StyleSheet.create({
  innerWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  codeContainer: {
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: getResponsiveWidth(10),
    paddingVertical: getResponsiveHeight(14),
    paddingHorizontal: getResponsiveWidth(10),
    marginVertical: getResponsiveHeight(5),
    width: '100%',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: getResponsiveHeight(10),
  },
  codeText: {
    flex: 1,
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-SemiBold',
    color: '#333',
    letterSpacing: 1,
  },
  copyIcon: {
    width: getResponsiveIconSize(18),
    height: getResponsiveIconSize(18),
  },
});
