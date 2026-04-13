// src/components/AppAlertModal.jsx
import React, {useEffect, useCallback, useMemo} from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import CustomModal from './CustomModal';
import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
} from 'utils/responsive';

/**
 * AppAlertModal
 * - CustomModal 기반 “앱 내 이벤트/공지 팝업”
 * - Primary/Secondary + 아래 작은 링크(Tertiary) 지원
 * - 이미지 지원(image / imageUri)
 */
export default function AppAlertModal({
  visible,
  title,
  subTitle,
  message,

 // 이미지
 // - image: require(...) 또는 {uri:'https://...'} 또는 { source, width, height, resizeMode }
 // - imageUri: 'https://...' (간편)
  image = null,
  imageUri = null,

  primaryText = '확인',
  secondaryText,
  tertiaryText,

  onPrimary,
  onSecondary,
  onTertiary,
  onRequestClose,

  autoDismissMs = null,
  showCloseButton = true,
  closeOnBackdropPress = true,
  hardwareBackCloses = true,
  /** 이미지 영역(View) 스타일 오버레이 */
  imageWrapStyle = null,
  /** Image에 합쳐지는 추가 스타일(예: marginVertical 리셋) */
  imageExtraStyle = null,
  /**
   * 가운데 이미지 양옆 작은 이미지
   * { left: require(...), right: require(...), iconSize: number }
   */
  imageFlank = null,
}) {
  const styles = useScaledStyleSheet(rf => ({

  modalBox: {borderRadius: getResponsiveWidth(22)},
  contentStyle: {paddingTop: 0},

  body: {
    width: '100%',
    alignItems: 'center',
  },

  imageWrap: {
    width: '100%',
    alignItems: 'center',
    paddingTop: getResponsiveHeight(6),
    paddingBottom: getResponsiveHeight(10),
  },

  image: {
 // 필요하면 둥글게
 // borderRadius: getResponsiveWidth(14),
    marginVertical: -getResponsiveHeight(13),
  },

  imageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: '100%',
  },

  flankImage: {
    marginVertical: 0,
    opacity: 0.92,
  },

  centerImageInRow: {
    marginVertical: 0,
    marginHorizontal: getResponsiveWidth(10),
  },

  message: {
    width: '100%',
    textAlign: 'center',
    fontSize: rf(15),
    fontWeight: '600',
    color: '#374151',
    lineHeight: Math.round(rf(22)),
  },

  tertiaryText: {
    fontSize: rf(12),
    fontWeight: '700',
    color: 'white',
    textDecorationLine: 'underline',
  },
  outsideDismissText: {
    fontSize: rf(13),
    fontWeight: '700',
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },

  buttonRow: {},
  closeText: {color: '#111827'},
  confirmText: {color: '#FFFFFF'},

  }));
 // 자동 닫힘
  useEffect(() => {
    if (!visible) return;
    if (!autoDismissMs) return;

    const t = setTimeout(() => {
      onRequestClose?.();
    }, autoDismissMs);

    return () => clearTimeout(t);
  }, [visible, autoDismissMs, onRequestClose]);

  const resolvedTitle = title ?? '이벤트 안내';
  const resolvedSubTitle = subTitle ?? '이벤트 서브타이틀';
  const resolvedMessage = message ?? '';

  const handleClose = useCallback(() => {
    onRequestClose?.();
  }, [onRequestClose]);

  const handlePrimary = useCallback(() => {
    onPrimary?.();
  }, [onPrimary]);

  const handleTertiary = useCallback(() => {
    onTertiary?.();
  }, [onTertiary]);

 // 이미지 source 정규화
 // 1) image가 {source: ...} 형태면 그걸 우선
 // 2) image가 require(...) 또는 {uri:...}면 그대로
 // 3) imageUri만 있으면 {uri:imageUri}
  const resolvedImage = useMemo(() => {
    if (image?.source) return image.source;
    if (image) return image;
    if (typeof imageUri === 'string' && imageUri.length > 0)
      return {uri: imageUri};
    return null;
  }, [image, imageUri]);

  const imageResizeMode = image?.resizeMode || 'contain';

  const imageWidth =
    typeof image?.width === 'number' ? image.width : getResponsiveWidth(240);

  const imageHeight =
    typeof image?.height === 'number' ? image.height : getResponsiveHeight(120);

  const flankSizeRaw = Number(imageFlank?.iconSize);
  const hasFlank =
    !!imageFlank?.left &&
    !!imageFlank?.right &&
    Number.isFinite(flankSizeRaw) &&
    flankSizeRaw > 0;
  const flankW = hasFlank ? getResponsiveWidth(flankSizeRaw) : 0;
  const flankH = hasFlank ? getResponsiveHeight(flankSizeRaw) : 0;

  return (
    <CustomModal
      visible={visible}
      showCloseButton={showCloseButton}
      onRequestClose={handleClose}
      onClose={handleClose}
      onConfirm={handlePrimary}
      closeText={undefined}
      confirmText={primaryText}
      closeOnBackdropPress={closeOnBackdropPress}
      hardwareBackCloses={hardwareBackCloses}
      title={resolvedTitle}
      subText={resolvedSubTitle}
      modalBoxStyle={styles.modalBox}
      contentStyle={styles.contentStyle}
      buttonBottomStyle={styles.buttonRow}
      confirmTextStyle={styles.confirmText}
      closeTextStyle={styles.closeText}
      footerOutside={
        secondaryText ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onSecondary}
            hitSlop={{top: 8, bottom: 8, left: 12, right: 12}}>
            <AppText allowFontScaling={false} style={styles.outsideDismissText}>
              {secondaryText}
            </AppText>
          </TouchableOpacity>
        ) : tertiaryText ? (
          <TouchableOpacity activeOpacity={0.85} onPress={handleTertiary}>
            <AppText allowFontScaling={false} style={styles.tertiaryText}>
              {tertiaryText}
            </AppText>
          </TouchableOpacity>
        ) : null
      }>
      <View style={styles.body}>
        {!!resolvedImage && (
          <View style={[styles.imageWrap, imageWrapStyle]}>
            {hasFlank ? (
              <View style={styles.imageRow}>
                <Image
                  source={imageFlank.left}
                  resizeMode="contain"
                  style={[
                    styles.image,
                    styles.flankImage,
                    {width: flankW, height: flankH},
                  ]}
                />
                <Image
                  source={resolvedImage}
                  resizeMode={imageResizeMode}
                  style={[
                    styles.image,
                    styles.centerImageInRow,
                    imageExtraStyle,
                    {width: imageWidth, height: imageHeight},
                  ]}
                />
                <Image
                  source={imageFlank.right}
                  resizeMode="contain"
                  style={[
                    styles.image,
                    styles.flankImage,
                    {width: flankW, height: flankH},
                  ]}
                />
              </View>
            ) : (
              <Image
                source={resolvedImage}
                resizeMode={imageResizeMode}
                style={[
                  styles.image,
                  imageExtraStyle,
                  {width: imageWidth, height: imageHeight},
                ]}
              />
            )}
          </View>
        )}

        {!!resolvedMessage && (
          <AppText allowFontScaling={false} style={styles.message}>
            {resolvedMessage}
          </AppText>
        )}
      </View>
    </CustomModal>
  );
}

