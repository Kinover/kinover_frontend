// src/features/schedule/components/BirthdayModal.jsx
import React, {useMemo} from 'react';
import {View, Text, StyleSheet, Image} from 'react-native';
import CustomModal from '../../../components/CustomModal';
import ScreenConfetti from './ScreenConfetti';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
} from '../../../utils/responsive';

export default function BirthdayModal({visible, onClose, namesText}) {
  const parsed = useMemo(() => {
    const raw = String(namesText || '').trim();

    // "A, B 외 2명" / "A, B" / "A" 등 케이스 대응
    const hasEtc = raw.includes('외');
    const primary = raw
      .replace(/님의\s*생일.*$/g, '')
      .replace(/\s*님의\s*생일.*$/g, '')
      .trim();

    // 쉼표 기준으로 최대 3명까지 보여주기
    const names = primary
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 3);

    const first = names[0] || '가족';
    const second = names[1] || null;

    return {raw, names, first, second, hasEtc};
  }, [namesText]);

  const subtitle =
    parsed.raw && parsed.raw.length > 0 ? parsed.raw : '오늘은 특별한 날이에요';

  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      onConfirm={onClose}
      closeText="닫기"
      confirmText="축하하기"
      title="생일 축하해요! 🎂"
      subText={subtitle}
      modalBoxStyle={styles.modalBox}
      // ✅ 모달 밖(전체 화면)에서 팡! (모달 중앙쯤)
      overlayChildren={<ScreenConfetti visible={visible} originX={0.5} originY={0.52} />}>
      {/* ✅ 모달 안 “내용” */}
      <View style={styles.heroRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>HBD</Text>
        </View>

        <View style={{flex: 1}}>
          <Text style={styles.heroTitle} numberOfLines={2}>
            {parsed.first} {parsed.second ? `· ${parsed.second}` : ''}{' '}
            {parsed.hasEtc ? '그리고 또…' : ''}
          </Text>
          <Text style={styles.heroDesc}>
            작은 마음을 크게 보내는 날! 🎁
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* ✅ 축하 메시지 카드 */}
      <View style={styles.messageCard}>
        <View style={styles.messageHeader}>
          <Text style={styles.messageHeaderText}>오늘의 한마디</Text>
          <Text style={styles.messageEmoji}>💛</Text>
        </View>

        <Text style={styles.messageBody}>
          “태어난 날 축하해요!{'\n'}
          오늘 하루는 하고 싶은 거, 먹고 싶은 거 다 해도 되는 날이에요.”
        </Text>
      </View>

      {/* ✅ 아래 작은 아이템들 */}
      <View style={styles.miniGrid}>
        <View style={styles.miniItem}>
          <Text style={styles.miniLabel}>추천</Text>
          <Text style={styles.miniValue}>따뜻한 말 1개</Text>
        </View>
        <View style={styles.miniItem}>
          <Text style={styles.miniLabel}>오늘</Text>
          <Text style={styles.miniValue}>칭찬 듬뿍</Text>
        </View>
        <View style={styles.miniItem}>
          <Text style={styles.miniLabel}>미션</Text>
          <Text style={styles.miniValue}>사진 한 장</Text>
        </View>
      </View>

      {/* ✅ 작은 팁 */}
      <View style={styles.tipRow}>
        <Text style={styles.tipIcon}>✨</Text>
        <Text style={styles.tipText}>
          “축하하기”를 누르면 마음속으로 한 번 더 크게 축하해줘요.
        </Text>
      </View>
    </CustomModal>
  );
}

const styles = StyleSheet.create({
  modalBox: {
    width: getResponsiveWidth(320),
    maxWidth: '90%',
    alignSelf: 'center',
  },

  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(12),
    marginTop: getResponsiveHeight(6),
  },

  badge: {
    width: getResponsiveWidth(46),
    height: getResponsiveWidth(46),
    borderRadius: 999,
    backgroundColor: 'rgba(255, 200, 77, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 77, 0.35)',
  },
  badgeText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(12.5),
    color: '#111827',
    letterSpacing: 0.6,
  },

  heroTitle: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(15.5),
    color: '#111827',
    lineHeight: getResponsiveHeight(22),
  },
  heroDesc: {
    marginTop: getResponsiveHeight(4),
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(12.5),
    color: '#6B7280',
    lineHeight: getResponsiveHeight(18),
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(17,24,39,0.08)',
    marginVertical: getResponsiveHeight(12),
  },

  messageCard: {
    backgroundColor: 'rgba(17,24,39,0.03)',
    borderRadius: 14,
    paddingVertical: getResponsiveHeight(12),
    paddingHorizontal: getResponsiveWidth(12),
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveHeight(6),
  },
  messageHeaderText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(12.5),
    color: '#111827',
  },
  messageEmoji: {
    fontSize: getResponsiveFontSize(14),
  },
  messageBody: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(13.5),
    color: '#111827',
    lineHeight: getResponsiveHeight(20),
  },

  miniGrid: {
    flexDirection: 'row',
    gap: getResponsiveWidth(8),
    marginTop: getResponsiveHeight(10),
  },
  miniItem: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(10),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
  },
  miniLabel: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(11.5),
    color: '#6B7280',
    marginBottom: getResponsiveHeight(4),
  },
  miniValue: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(12.8),
    color: '#111827',
  },

  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(8),
    marginTop: getResponsiveHeight(12),
    paddingTop: getResponsiveHeight(10),
  },
  tipIcon: {
    fontSize: getResponsiveFontSize(14),
  },
  tipText: {
    flex: 1,
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(12.3),
    color: '#6B7280',
    lineHeight: getResponsiveHeight(18),
  },
});
