import React, {useState, useCallback} from 'react';
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
import ToastModal from '../../../components/ToastModal';

export default function FamilyCodeModal({visible, onClose, familyCode}) {
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = useCallback(() => {
    setToastVisible(true);
  }, []);

  const hideToast = useCallback(() => {
    setToastVisible(false);
  }, []);

  const handleCopy = () => {
    Clipboard.setString(familyCode);
    showToast(); // 🎉 토스트 표시
  };

  return (
    <>
      <CustomModal
        showCloseButton={false}
        visible={visible}
        onClose={onClose}
        onConfirm={onClose}
        confirmText="확인"
        buttonBottomStyle={styles.modalButtonRow}
        title={'가족 초대 코드'}
        subText={'복사 아이콘을 눌러,\n함께할 가족에게 코드를 알려주세요'}>
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
      </CustomModal>

      {/* ✅ 토스트 모달 */}
      <ToastModal
        visible={toastVisible}
        onClose={hideToast}
        message="복사되었습니다!"
        duration={1300}
        useNativeModal={false}
      />
    </>
  );
}

const styles = StyleSheet.create({
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
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: getResponsiveHeight(10),
  },
  codeText: {
    flex: 1,
    fontSize: getResponsiveFontSize(11),
    fontFamily: 'Pretendard-SemiBold',
    color: '#333',
    letterSpacing: 1,
  },
  copyIcon: {
    width: getResponsiveIconSize(18),
    height: getResponsiveIconSize(18),
  },
});
