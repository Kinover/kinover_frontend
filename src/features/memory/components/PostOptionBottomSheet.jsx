/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */

// src/features/post/components/PostOptionBottomSheet.jsx

import React, {useMemo} from 'react';
import {View, Text, StyleSheet, Image, TouchableOpacity, Dimensions} from 'react-native';

import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';

const {width: SCREEN_W} = Dimensions.get('window');

export default function PostOptionBottomSheet({
  sheetRef,
  currentMediaUri,
  currentLabel,
  isVideo,
  mediaCount,
  isBusy,
  onSaveCurrent,
  onSaveAll,
  onDeleteCurrentImage,
  onDeletePost,
  CameraRollAvailable = true,
}) {
  const snapPoints = useMemo(() => ['51%'], []);

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={styles.optionSheetBg}
      handleIndicatorStyle={styles.optionHandle}
      backdropComponent={props => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.38}
          pressBehavior="close"
        />
      )}>
      <BottomSheetScrollView
        contentContainerStyle={styles.optionContent}
        showsVerticalScrollIndicator={false}>
        {/* 상단 썸네일 + 제목 */}
        <View style={styles.optionTop}>
          <View style={styles.optionThumbWrap}>
            <Image
              source={
                currentMediaUri
                  ? {uri: currentMediaUri}
                  : require('../../../assets/images/default.png')
              }
              style={styles.optionThumb}
            />
            <View style={styles.optionBadge}>
              <Text allowFontScaling={false} style={styles.optionBadgeText}>{currentLabel}</Text>
            </View>
          </View>

          <View style={{flex: 1, minWidth: 0}}>
            <Text allowFontScaling={false} style={styles.optionTitle}>게시물 옵션</Text>
            <Text allowFontScaling={false} style={styles.optionSub} numberOfLines={1}>
              {isBusy ? '처리 중이에요…' : '저장/삭제를 빠르게 할 수 있어요'}
            </Text>
          </View>
        </View>

        {/* 2x2 퀵액션 */}
        <View style={styles.quickGrid}>
          <QuickAction
            title="현재 저장"
            sub={`${isVideo ? '영상' : '이미지'} 1개`}
            icon={require('../../../assets/icons/download.png')}
            disabled={isBusy || !currentMediaUri}
            onPress={onSaveCurrent}
            tone="primary"
          />
          <QuickAction
            title="전체 저장"
            sub={`${mediaCount}개`}
            icon={require('../../../assets/icons/download.png')}
            disabled={isBusy || mediaCount === 0}
            onPress={onSaveAll}
            tone="primary"
          />
          <QuickAction
            title="현재 삭제"
            sub="선택된 1개"
            icon={require('../../../assets/images/trash.png')}
            disabled={isBusy || !currentMediaUri}
            onPress={onDeleteCurrentImage}
            tone="danger"
          />
          <QuickAction
            title="게시글 삭제"
            sub="전체 삭제"
            icon={require('../../../assets/images/trash.png')}
            disabled={isBusy}
            onPress={onDeletePost}
            tone="danger"
          />
        </View>

        {/* 섹션: 저장 */}
        <View style={styles.optionSection}>
          <Text allowFontScaling={false} style={styles.sectionTitle}>저장</Text>
          <OptionRow
            title={`현재 ${isVideo ? '영상' : '이미지'} 저장`}
            subTitle="갤러리에 저장해요"
            icon={require('../../../assets/icons/download.png')}
            disabled={isBusy || !currentMediaUri}
            onPress={onSaveCurrent}
          />
          <OptionRow
            title="전체 이미지 저장"
            subTitle={`${mediaCount}개를 순서대로 저장해요`}
            icon={require('../../../assets/icons/download.png')}
            disabled={isBusy || mediaCount === 0}
            onPress={onSaveAll}
          />
        </View>

        {/* 섹션: 삭제 */}
        <View style={styles.optionSection}>
          <Text allowFontScaling={false} style={[styles.sectionTitle, {color: '#EF4444'}]}>삭제</Text>
          <OptionRow
            title="현재 이미지 삭제"
            subTitle="선택된 이미지 1장 삭제"
            icon={require('../../../assets/images/trash.png')}
            disabled={isBusy || !currentMediaUri}
            onPress={onDeleteCurrentImage}
            danger
          />
          <OptionRow
            title="게시글 삭제"
            subTitle="게시글 + 이미지 전체 삭제"
            icon={require('../../../assets/images/trash.png')}
            disabled={isBusy}
            onPress={onDeletePost}
            danger
          />
        </View>

        {!CameraRollAvailable && (
          <Text allowFontScaling={false} style={styles.optionHint}>
            * 저장 기능을 쓰려면 @react-native-camera-roll/camera-roll 설치가 필요해요.
          </Text>
        )}

        <Text allowFontScaling={false} style={styles.optionHint}>
          * 저장은 네트워크/권한 상태에 따라 조금 걸릴 수 있어요.
        </Text>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

/** ✅ 퀵액션 카드 (2x2) */
function QuickAction({title, sub, icon, onPress, disabled, tone = 'primary'}) {
  const danger = tone === 'danger';
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.quickCard,
        danger ? styles.quickCardDanger : styles.quickCardPrimary,
        disabled && {opacity: 0.48},
      ]}>
      <View style={[styles.quickIconWrap, danger && styles.quickIconWrapDanger]}>
        <Image
          source={icon}
          style={[styles.quickIcon, danger && {tintColor: '#EF4444'}]}
        />
      </View>
      <View style={{flex: 1, minWidth: 0}}>
        <Text allowFontScaling={false}
          style={[styles.quickTitle, danger && {color: '#EF4444'}]}
          numberOfLines={1}>
          {title}
        </Text>
        <Text allowFontScaling={false} style={styles.quickSub} numberOfLines={1}>
          {sub}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

/** ✅ 리스트형 옵션 Row */
function OptionRow({
  title,
  subTitle,
  icon,
  onPress,
  danger = false,
  disabled = false,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.rowItem,
        danger && styles.rowItemDanger,
        disabled && {opacity: 0.5},
      ]}>
      <View style={[styles.rowIconWrap, danger && styles.rowIconWrapDanger]}>
        <Image
          source={icon}
          style={[styles.rowIcon, danger && {tintColor: '#EF4444'}]}
        />
      </View>

      <View style={{flex: 1, minWidth: 0}}>
        <Text allowFontScaling={false}
          style={[styles.rowTitle, danger && {color: '#EF4444'}]}
          numberOfLines={1}>
          {title}
        </Text>
        <Text allowFontScaling={false} style={styles.rowSub} numberOfLines={1}>
          {subTitle}
        </Text>
      </View>

      <Image
        source={require('../../../assets/images/rightArrow.png')}
        style={[
          styles.rowChevron,
          danger && {tintColor: 'rgba(239,68,68,0.7)'},
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  /** 옵션 시트 */
  optionSheetBg: {
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: getResponsiveWidth(22),
    borderTopRightRadius: getResponsiveWidth(22),
  },
  optionHandle: {
    backgroundColor: 'rgba(17,24,39,0.16)',
    width: getResponsiveWidth(44),
  },
  optionContent: {
    paddingHorizontal: getResponsiveWidth(16),
    paddingTop: getResponsiveHeight(8),
    paddingBottom: getResponsiveHeight(26),
    gap: getResponsiveHeight(14),
  },

  optionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(12),
    paddingBottom: getResponsiveHeight(8),
  },
  optionThumbWrap: {
    width: getResponsiveWidth(48),
    height: getResponsiveWidth(48),
    borderRadius: getResponsiveWidth(14),
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.08)',
    overflow: 'hidden',
  },
  optionThumb: {width: '100%', height: '100%'},
  optionBadge: {
    position: 'absolute',
    right: getResponsiveWidth(6),
    bottom: getResponsiveWidth(6),
    paddingHorizontal: getResponsiveWidth(6),
    paddingVertical: getResponsiveHeight(2),
    borderRadius: getResponsiveWidth(999),
    backgroundColor: 'rgba(17,24,39,0.75)',
  },
  optionBadgeText: {
    color: '#fff',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(10.5),
  },

  optionTitle: {
    color: '#111827',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(16.5),
  },
  optionSub: {
    marginTop: getResponsiveHeight(3),
    color: 'rgba(107,114,128,0.95)',
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(12.5),
  },

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getResponsiveWidth(10),
  },
  quickCard: {
    width:
      (SCREEN_W - getResponsiveWidth(16) * 2 - getResponsiveWidth(10)) / 2,
    paddingHorizontal: getResponsiveWidth(12),
    paddingVertical: getResponsiveHeight(12),
    borderRadius: getResponsiveWidth(16),
    borderWidth: 1,
  },
  quickCardPrimary: {
    backgroundColor: '#fff',
    borderColor: 'rgba(17,24,39,0.08)',
  },
  quickCardDanger: {
    backgroundColor: 'rgba(239,68,68,0.04)',
    borderColor: 'rgba(239,68,68,0.18)',
  },
  quickIconWrap: {
    width: getResponsiveWidth(34),
    height: getResponsiveWidth(34),
    borderRadius: getResponsiveWidth(12),
    backgroundColor: 'rgba(255,200,77,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: getResponsiveHeight(10),
  },
  quickIconWrapDanger: {backgroundColor: 'rgba(239,68,68,0.12)'},
  quickIcon: {
    width: getResponsiveWidth(18),
    height: getResponsiveWidth(18),
    resizeMode: 'contain',
    tintColor: '#111827',
  },
  quickTitle: {
    color: '#111827',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(14),
  },
  quickSub: {
    marginTop: getResponsiveHeight(3),
    color: 'rgba(107,114,128,0.95)',
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(12),
  },

  optionSection: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveWidth(18),
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.08)',
    padding: getResponsiveWidth(12),
    gap: getResponsiveHeight(10),
  },
  sectionTitle: {
    color: '#111827',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(13.5),
    marginBottom: getResponsiveHeight(4),
  },

  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(12),
    paddingHorizontal: getResponsiveWidth(10),
    paddingVertical: getResponsiveHeight(10),
    borderRadius: getResponsiveWidth(14),
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
  },
  rowItemDanger: {
    backgroundColor: 'rgba(239,68,68,0.04)',
    borderColor: 'rgba(239,68,68,0.14)',
  },
  rowIconWrap: {
    width: getResponsiveWidth(34),
    height: getResponsiveWidth(34),
    borderRadius: getResponsiveWidth(12),
    backgroundColor: 'rgba(255,200,77,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowIconWrapDanger: {backgroundColor: 'rgba(239,68,68,0.12)'},
  rowIcon: {
    width: getResponsiveWidth(18),
    height: getResponsiveWidth(18),
    resizeMode: 'contain',
    tintColor: '#111827',
  },
  rowTitle: {
    color: '#111827',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(13.8),
  },
  rowSub: {
    marginTop: getResponsiveHeight(2),
    color: 'rgba(107,114,128,0.95)',
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(12),
  },
  rowChevron: {
    width: getResponsiveWidth(14),
    height: getResponsiveWidth(14),
    resizeMode: 'contain',
    tintColor: 'rgba(17,24,39,0.35)',
  },

  optionHint: {
    marginTop: getResponsiveHeight(2),
    textAlign: 'center',
    color: 'rgba(107,114,128,0.95)',
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(11.5),
  },
});
