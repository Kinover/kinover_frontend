import React, {useMemo, useState, useEffect, useCallback} from 'react';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Clipboard from '@react-native-clipboard/clipboard';
import CustomModal from 'components/modal/CustomModal';
import ScreenConfetti from './ScreenConfetti';
import {hapticLight, hapticSuccess} from 'utils/haptic';
import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
} from 'utils/responsive';

export default function BirthdayModal({
  visible,
  onClose,
  namesText,
  onSendMessage,
  sendingMessage = false,
}) {
  const styles = useScaledStyleSheet(rf => ({

  modalBox: {
    width: getResponsiveWidth(326),
    maxWidth: '90%',
    alignSelf: 'center',
    borderRadius: getResponsiveWidth(20),
  },

  contentArea: {
    marginTop: getResponsiveHeight(4),
  },

  content: {
    gap: getResponsiveHeight(12),
  },

  heroCard: {
    borderRadius: getResponsiveWidth(16),
    paddingHorizontal: getResponsiveWidth(14),
    paddingVertical: getResponsiveHeight(12),
    borderWidth: 1,
    borderColor: 'rgba(255,200,77,0.42)',
  },

  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(8),
    marginBottom: getResponsiveHeight(10),
  },

  heroEmoji: {
    fontSize: rf(18),
  },

  heroTitle: {
    fontFamily: 'SpaceMono-Regular',
    fontSize: rf(14),
    color: '#111827',
    letterSpacing: 0.25,
  },

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: getResponsiveWidth(8),
  },

  nameBadge: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.08)',
    paddingHorizontal: getResponsiveWidth(11),
    paddingVertical: getResponsiveHeight(7),
  },

  nameBadgeText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: rf(12.5),
    color: '#111827',
  },

  countBadge: {
    borderRadius: 999,
    backgroundColor: '#111827',
    paddingHorizontal: getResponsiveWidth(10),
    paddingVertical: getResponsiveHeight(6),
    minWidth: getResponsiveWidth(52),
    alignItems: 'center',
  },

  countBadgeText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: rf(11.2),
    color: '#FFFFFF',
  },

  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(6),
    paddingHorizontal: getResponsiveWidth(2),
  },

  noticeIcon: {
    fontSize: rf(11.5),
    color: '#D97706',
  },

  noticeText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: rf(12.2),
    color: '#4B5563',
    lineHeight: getResponsiveHeight(17),
  },

  messageBox: {
    borderRadius: getResponsiveWidth(14),
    paddingVertical: getResponsiveHeight(13),
    paddingHorizontal: getResponsiveWidth(13),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.08)',
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: {width: 0, height: 4},
        }
      : {
          elevation: 0,
        }),
  },
  messageBoxPressed: {
    transform: [{scale: 0.99}],
    opacity: 0.94,
  },
  messageBoxCopied: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFD36A',
  },

  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: getResponsiveHeight(8),
  },

  messageLabel: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: rf(12),
    color: '#111827',
  },

  messageTag: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,200,77,0.2)',
    paddingHorizontal: getResponsiveWidth(8),
    paddingVertical: getResponsiveHeight(4),
  },
  messageTagCopied: {
    backgroundColor: '#FFB000',
  },

  messageTagText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: rf(10.4),
    color: '#92400E',
  },
  messageTagTextCopied: {
    color: '#111827',
  },

  messageBody: {
    fontFamily: 'Pretendard-Regular',
    fontSize: rf(13.2),
    color: '#111827',
    lineHeight: getResponsiveHeight(20),
  },

  }));
  const parsed = useMemo(() => {
    const raw = String(namesText || '').trim();

 // "OO, OO 외" / "OO님의 생일..." 등 들어와도 최대한 이름만 뽑기
    const cleaned = raw
      .replace(/님의\s*생일.*$/g, '')
      .replace(/\s*생일.*$/g, '')
      .trim();

    const hasEtc = raw.includes('외');

    const names = cleaned
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const first = names[0] || '가족';
    const second = names[1] || null;
    const total = names.length;

    const heroNames = `${first}${second ? ` · ${second}` : ''}${
      hasEtc ? ' 외' : ''
    }`;

    return {raw, heroNames, total};
  }, [namesText]);

 // subText는 "상황 설명"만 짧게
  const subtitle =
    parsed.raw && parsed.raw.length > 0
      ? '오늘 일정에 생일이 있어요.'
      : '오늘 일정에 생일이 등록되어 있어요.';

 // 메시지는 1개만, 짧고 자연스럽게
  const messageText = `${parsed.heroNames} 생일 축하해요! 🎉
오늘 하루, 웃는 일이 더 많았으면 해요.
늘 고맙고 소중해요.`;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!visible) setCopied(false);
  }, [visible]);

  const handleCopyMessage = useCallback(() => {
    hapticLight();
    Clipboard.setString(messageText);
    setCopied(true);
    hapticSuccess();
  }, [messageText]);

  const handleConfirm = () => {
    if (sendingMessage) return;
    if (typeof onSendMessage === 'function') {
      onSendMessage(messageText);
      return;
    }
    onClose?.();
  };

  return (
    <CustomModal
      showCloseButton
      visible={visible}
      onClose={onClose}
      onConfirm={handleConfirm}
      closeText="닫기"
      confirmText={sendingMessage ? '전송 중...' : '메시지 보내기'}
      title={`${parsed.heroNames} 생일`}
      subText={subtitle}
      modalBoxStyle={styles.modalBox}
      contentStyle={styles.contentArea}
      overlayChildren={
        <ScreenConfetti visible={visible} originX={0.5} originY={0.52} />
      }>
      <View style={styles.content}>
        <LinearGradient
          colors={['#FFF8E8', '#FFFDF6']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.heroCard}>
          <View style={styles.heroRow}>
            <AppText style={styles.heroEmoji}>🎂</AppText>
            <AppText style={styles.heroTitle}>Happy Birthday</AppText>
          </View>

          <View style={styles.badgeRow}>
            <View style={styles.nameBadge}>
              <AppText style={styles.nameBadgeText}>{parsed.heroNames}</AppText>
            </View>
            <View style={styles.countBadge}>
              <AppText style={styles.countBadgeText}>
                {parsed.total > 0 ? `${parsed.total}명` : '오늘'}
              </AppText>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.noticeRow}>
          <AppText style={styles.noticeIcon}>✦</AppText>
          <AppText style={styles.noticeText}>짧게라도 한마디 전하면 더 좋아요.</AppText>
        </View>

        <Pressable
          onPress={handleCopyMessage}
          hitSlop={8}
          style={({pressed}) => [
            styles.messageBox,
            copied && styles.messageBoxCopied,
            pressed && styles.messageBoxPressed,
          ]}>
          <View style={styles.messageHeader}>
            <AppText style={styles.messageLabel}>추천 문구</AppText>
            <View style={[styles.messageTag, copied && styles.messageTagCopied]}>
              <AppText style={[styles.messageTagText, copied && styles.messageTagTextCopied]}>
                {copied ? '복사됨' : '복사'}
              </AppText>
            </View>
          </View>
          <AppText style={styles.messageBody}>{messageText}</AppText>
        </Pressable>
      </View>
    </CustomModal>
  );
}

