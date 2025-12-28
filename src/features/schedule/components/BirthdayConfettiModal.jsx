// src/features/schedule/components/BirthdayModal.jsx
import React, {useMemo} from 'react';
import {View, Text, StyleSheet, Platform} from 'react-native';
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

    const hasEtc = raw.includes('외');
    const primary = raw
      .replace(/님의\s*생일.*$/g, '')
      .replace(/\s*님의\s*생일.*$/g, '')
      .trim();

    const names = primary
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 3);

    const first = names[0] || '가족';
    const second = names[1] || null;

    return {raw, names, first, second, hasEtc};
  }, [namesText]);

  // ✅ 일정탭 느낌: “오늘 일정” 톤으로 더 자연스럽게
  const subtitle =
    parsed.raw && parsed.raw.length > 0
      ? parsed.raw
      : '오늘 일정에 생일이 등록되어 있어요';

  // ✅ 이름 문자열(표시용)
  const heroNames = `${parsed.first}${parsed.second ? ` · ${parsed.second}` : ''}${
    parsed.hasEtc ? ' 외' : ''
  }`;

  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      onConfirm={onClose}
      closeText="닫기"
      confirmText="메시지 보내기"
      title="생일 일정 🎉"
      subText={subtitle}
      modalBoxStyle={styles.modalBox}
      overlayChildren={
        <ScreenConfetti visible={visible} originX={0.5} originY={0.52} />
      }>
      {/* ✅ 상단 히어로 카드 (일정탭 톤으로 변경) */}
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>B-DAY</Text>
          </View>

          <View style={{flex: 1}}>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {heroNames}
            </Text>
            <Text style={styles.heroDesc}>
              오늘은 생일 일정이 있어요. 짧게라도 마음 전해보자 🫶
            </Text>
          </View>

          <View style={styles.sparkWrap}>
            <Text style={styles.spark}>🎈</Text>
          </View>
        </View>

        {/* ✅ 일정형 “체크리스트” 느낌 */}
        <View style={styles.heroStatsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>추천</Text>
            <Text style={styles.statValue}>축하 한마디</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>오늘</Text>
            <Text style={styles.statValue}>사진 1장</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>선택</Text>
            <Text style={styles.statValue}>전화 3분</Text>
          </View>
        </View>
      </View>

      {/* ✅ 메시지 카드 (좀 더 “일정/알림” 톤으로) */}
      <View style={styles.messageCard}>
        <View style={styles.messageHeader}>
          <View style={styles.messageHeaderLeft}>
            <View style={styles.messageDot} />
            <Text style={styles.messageHeaderText}>바로 보낼 수 있는 문장</Text>
          </View>
          <Text style={styles.messageEmoji}>💌</Text>
        </View>

        <Text style={styles.messageBody}>
          생일 축하해요! 🎉{'\n'}
          오늘 하루는 제일 기분 좋은 일만 가득했으면 좋겠어요.{'\n'}
          항상 고마워요 💛
        </Text>
      </View>

      {/* ✅ 하단 팁 (일정탭 행동 유도) */}
      <View style={styles.tipBox}>
        <Text style={styles.tipIcon}>🗓️</Text>
        <Text style={styles.tipText}>
          “메시지 보내기”를 누르면 채팅으로 바로 이동해서 축하를 전할 수 있어요.
        </Text>
      </View>
    </CustomModal>
  );
}

const styles = StyleSheet.create({
  modalBox: {
    width: getResponsiveWidth(326),
    maxWidth: '90%',
    alignSelf: 'center',
  },

  /* =========================
   * Hero Card
   * ========================= */
  heroCard: {
    borderRadius: 18,
    paddingVertical: getResponsiveHeight(14),
    paddingHorizontal: getResponsiveWidth(14),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.08)',
    shadowColor: '#000',
    shadowOpacity: Platform.OS === 'ios' ? 0.08 : 0,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 6},
    elevation: Platform.OS === 'android' ? 2 : 0,
  },

  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(10),
  },

  badge: {
    width: getResponsiveWidth(52),
    height: getResponsiveWidth(46),
    borderRadius: 999,
    backgroundColor: 'rgba(255, 200, 77, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 77, 0.34)',
  },
  badgeText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(12),
    color: '#111827',
    letterSpacing: 0.6,
  },

  heroTitle: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(15.8),
    color: '#111827',
    lineHeight: getResponsiveHeight(22),
  },
  heroDesc: {
    marginTop: getResponsiveHeight(4),
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(12.6),
    color: '#6B7280',
    lineHeight: getResponsiveHeight(18),
  },

  sparkWrap: {
    width: getResponsiveWidth(34),
    height: getResponsiveWidth(34),
    borderRadius: 999,
    backgroundColor: 'rgba(255, 200, 77, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 77, 0.22)',
  },
  spark: {
    fontSize: getResponsiveFontSize(14),
  },

  heroStatsRow: {
    flexDirection: 'row',
    gap: getResponsiveWidth(8),
    marginTop: getResponsiveHeight(12),
  },
  statPill: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: getResponsiveHeight(9),
    paddingHorizontal: getResponsiveWidth(10),
    backgroundColor: 'rgba(17,24,39,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
  },
  statLabel: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(11.2),
    color: '#6B7280',
    marginBottom: getResponsiveHeight(3),
  },
  statValue: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(12.6),
    color: '#111827',
  },

  /* =========================
   * Message Card
   * ========================= */
  messageCard: {
    marginTop: getResponsiveHeight(12),
    borderRadius: 16,
    paddingVertical: getResponsiveHeight(12),
    paddingHorizontal: getResponsiveWidth(12),
    backgroundColor: 'rgba(255, 200, 77, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 77, 0.20)',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveHeight(8),
  },
  messageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(6),
  },
  messageDot: {
    width: getResponsiveWidth(6),
    height: getResponsiveWidth(6),
    borderRadius: 999,
    backgroundColor: '#F59E0B',
  },
  messageHeaderText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(12.6),
    color: '#111827',
  },
  messageEmoji: {
    fontSize: getResponsiveFontSize(14),
  },
  messageBody: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(13.6),
    color: '#111827',
    lineHeight: getResponsiveHeight(20),
  },

  /* =========================
   * Tip
   * ========================= */
  tipBox: {
    marginTop: getResponsiveHeight(12),
    borderRadius: 14,
    paddingVertical: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(10),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(8),
  },
  tipIcon: {
    fontSize: getResponsiveFontSize(14),
  },
  tipText: {
    flex: 1,
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(12.4),
    color: '#6B7280',
    lineHeight: getResponsiveHeight(18),
  },
});
