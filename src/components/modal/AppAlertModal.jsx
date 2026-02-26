// src/components/AppAlertModal.jsx
import React, {useEffect, useCallback, useMemo} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import CustomModal from './CustomModal';
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
}) {
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

 /** 왼쪽 버튼(secondaryText, 예: "오늘 하루 보지 않기") 클릭 시: 저장 후 닫기 */
  const handleLeftButton = useCallback(() => {
    if (onSecondary) {
      onSecondary();
    } else {
      onRequestClose?.();
    }
  }, [onSecondary, onRequestClose]);

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

  return (
    <CustomModal
      visible={visible}
      showCloseButton
      onRequestClose={handleClose}
      onClose={handleLeftButton}
      onConfirm={handlePrimary}
      closeText={secondaryText}
      confirmText={primaryText}
      closeOnBackdropPress
      title={resolvedTitle}
      subText={resolvedSubTitle}
      modalBoxStyle={styles.modalBox}
      contentStyle={styles.contentStyle}
      buttonBottomStyle={styles.buttonRow}
      confirmTextStyle={styles.confirmText}
      closeTextStyle={styles.closeText}
      useViewOverlayOnIOS
      footerOutside={
        tertiaryText ? (
          <TouchableOpacity activeOpacity={0.85} onPress={handleTertiary}>
            <Text allowFontScaling={false} style={styles.tertiaryText}>
              {tertiaryText}
            </Text>
          </TouchableOpacity>
        ) : null
      }>
      <View style={styles.body}>
        {!!resolvedImage && (
          <View style={styles.imageWrap}>
            <Image
              source={resolvedImage}
              resizeMode={imageResizeMode}
              style={[styles.image, {width: imageWidth, height: imageHeight}]}
            />
          </View>
        )}

        {!!resolvedMessage && (
          <Text allowFontScaling={false} style={styles.message}>
            {resolvedMessage}
          </Text>
        )}
      </View>
    </CustomModal>
  );
}

const styles = StyleSheet.create({
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

  message: {
    width: '100%',
    textAlign: 'center',
    fontSize: getResponsiveFontSize(15),
    fontWeight: '600',
    color: '#374151',
    lineHeight: Math.round(getResponsiveFontSize(22)),
  },

  tertiaryText: {
    fontSize: getResponsiveFontSize(12),
    fontWeight: '700',
    color: 'white',
    textDecorationLine: 'underline',
  },

  buttonRow: {},
  closeText: {color: '#111827'},
  confirmText: {color: '#FFFFFF'},
});
