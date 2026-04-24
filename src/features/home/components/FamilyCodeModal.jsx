import React, {useState, useCallback, useEffect} from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveWidth,
  getResponsiveIconSize,
} from 'utils/responsive';
import CustomModal from 'components/modal/CustomModal';
import Clipboard from '@react-native-clipboard/clipboard';
import {BUTTON_STYLES, COLORS} from 'styles/style';

// HAPTIC (경로는 네 프로젝트에 맞게 유지/조정)
import {hapticLight, hapticSuccess} from 'utils/haptic';
import {FONTS} from 'styles/typography';

export default function FamilyCodeModal({visible, onClose, familyCode}) {
  const styles = useScaledStyleSheet(rf => ({

  innerWrapper: {
    width: '100%',
    alignItems: 'center',
  },

  codeCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: getResponsiveWidth(14),
    paddingVertical: getResponsiveHeight(14),
    paddingHorizontal: getResponsiveWidth(14),
    marginBottom: getResponsiveHeight(14),
    marginTop: getResponsiveHeight(4),
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },

  codeCardPressed: {
    transform: [{scale: 0.99}],
    opacity: 0.92,
  },

  codeCardCopied: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFD36A',
  },

  codeTextWrap: {
    flex: 1,
    paddingRight: getResponsiveWidth(10),
  },

  codeLabel: {
    fontFamily: FONTS.SEMI_BOLD,
    fontSize: rf(10.5),
    color: COLORS.textTertiary,
    letterSpacing: 1.4,
    marginBottom: getResponsiveHeight(4),
  },

  codeText: {
    fontFamily: FONTS.SEMI_BOLD,
    fontSize: rf(15),
    color: '#111827',
    letterSpacing: 1.2,
  },

 // 이제 오른쪽은 "버튼"처럼 보이기만 하고 실제 클릭 처리는 카드 전체가 함
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: getResponsiveWidth(6),
    paddingVertical: getResponsiveHeight(8),
    paddingHorizontal: getResponsiveWidth(12),
    borderRadius: 999,
    backgroundColor: COLORS.brandPrimary,
  },

  copyBtnCopied: {
    backgroundColor: '#FFB000',
  },

  copyIcon: {
    width: getResponsiveIconSize(16),
    height: getResponsiveIconSize(16),
    tintColor: '#FFFFFF',
  },

  copyIconCopied: {
    tintColor: '#111827',
  },

  copyText: {
    fontFamily: FONTS.SEMI_BOLD,
    fontSize: rf(12),
    color: '#111827',
  },

  copyTextCopied: {
    color: '#111827',
  },

  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
 // marginTop: getResponsiveHeight(10),
  },

  }));
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!familyCode) return;

 // 누르는 순간 가볍게
    hapticLight();

    Clipboard.setString(familyCode);
    setCopied(true);

 // 복사 성공 느낌
    hapticSuccess();
  }, [familyCode]);

  useEffect(() => {
    if (!visible) setCopied(false);
  }, [visible]);

  const subText = copied
    ? '초대 코드가 복사되었어요!'
    : '초대 코드를 복사해 가족에게 보내주세요';

  return (
    <CustomModal
      showCloseButton
      visible={visible}
      onClose={onClose}
      onConfirm={onClose}
      confirmText="확인"
      title="가족 초대 코드"
      subText={subText}>
      <View style={styles.innerWrapper}>
        {/* 카드 전체(=코드 영역)를 누르면 복사 */}
        <Pressable
          onPress={handleCopy}
          disabled={!familyCode}
          hitSlop={10}
          style={({pressed}) => [
            styles.codeCard,
            copied && styles.codeCardCopied,
            pressed && familyCode && styles.codeCardPressed,
            !familyCode && {opacity: 0.6},
          ]}>
          <View style={styles.codeTextWrap}>
            <AppText allowFontScaling={false} style={styles.codeLabel}>
              INVITE CODE
            </AppText>
            <AppText
              allowFontScaling={false}
              style={styles.codeText}
              numberOfLines={1}
              ellipsizeMode="middle">
              {familyCode || '-'}
            </AppText>
          </View>

          {/* 오른쪽은 "복사" 힌트용 (아이콘/텍스트만 표시, 눌러도 카드 onPress로 복사됨) */}
          <View style={[styles.copyBtn, copied && styles.copyBtnCopied]}>
            {/* <FastImage
              source={require('../../../assets/icons/copy.png')}
              style={[styles.copyIcon, copied && styles.copyIconCopied]}
              resizeMode="contain"
            /> */}
            <AppText
              allowFontScaling={false}
              style={[styles.copyText, copied && styles.copyTextCopied]}>
              {copied ? '복사됨' : '복사'}
            </AppText>
          </View>
        </Pressable>
      </View>
    </CustomModal>
  );
}

