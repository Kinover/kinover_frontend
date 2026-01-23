/* eslint-disable react-native/no-inline-styles */
// src/features/post/components/PostOptionsMenu.jsx

import React, {useEffect, useMemo} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Platform} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';

export default function PostOptionsMenu({
  visible,
  setVisible, // ✅ 내부 애니메이션 종료 후 false 처리용
  isChromeHidden,

  // ✅ disabled 상태
  disableMenu,
  canSaveCurrent,
  canSaveAll,
  canDeleteCurrent,

  // ✅ labels
  currentLabel,
  mediaCount,

  // ✅ actions
  onClose,
  onSaveCurrent,
  onSaveAll,
  onEditPost,
  onDeleteCurrentImage,
  onDeletePost,
}) {
  const anim = useSharedValue(0);

  const close = () => {
    anim.value = withTiming(0, {duration: 120}, finished => {
      if (finished) runOnJS(setVisible)(false);
    });
    onClose?.();
  };

  useEffect(() => {
    if (!visible) return;
    anim.value = withTiming(1, {duration: 140});
  }, [visible, anim]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: anim.value,
  }));

  const boxStyle = useAnimatedStyle(() => ({
    opacity: anim.value,
    transform: [{translateY: (1 - anim.value) * -6}],
  }));

  const rootPointer = useMemo(
    () => (visible ? 'auto' : 'none'),
    [visible],
  );

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents={rootPointer}
      style={[
        styles.menuOverlay,
        overlayStyle,
        isChromeHidden && {opacity: 0},
      ]}>
      {/* 바깥 클릭하면 닫힘 */}
      <TouchableOpacity
        style={StyleSheet.absoluteFillObject}
        activeOpacity={1}
        onPress={close}
      />

      <Animated.View style={[styles.menuBox, boxStyle]}>
        <TouchableOpacity
          onPress={() => {
            close();
            onSaveCurrent?.();
          }}
          disabled={disableMenu || !canSaveCurrent}
          activeOpacity={0.85}
          style={[
            styles.menuItem,
            (disableMenu || !canSaveCurrent) && {opacity: 0.5},
          ]}>
          <Text allowFontScaling={false} style={styles.menuText}>
            현재 미디어 저장{currentLabel ? ` (${currentLabel})` : ''}
          </Text>
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity
          onPress={() => {
            close();
            onSaveAll?.();
          }}
          disabled={disableMenu || !canSaveAll}
          activeOpacity={0.85}
          style={[
            styles.menuItem,
            (disableMenu || !canSaveAll) && {opacity: 0.5},
          ]}>
          <Text allowFontScaling={false} style={styles.menuText}>
            전체 미디어 저장 ({mediaCount || 0})
          </Text>
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        {/* ✅ 게시글 수정 추가 */}
        <TouchableOpacity
          onPress={() => {
            close();
            onEditPost?.();
          }}
          disabled={disableMenu}
          activeOpacity={0.85}
          style={[styles.menuItem, disableMenu && {opacity: 0.5}]}>
          <Text allowFontScaling={false} style={styles.menuText}>게시글 수정</Text>
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity
          onPress={() => {
            close();
            onDeleteCurrentImage?.();
          }}
          disabled={disableMenu || !canDeleteCurrent}
          activeOpacity={0.85}
          style={[
            styles.menuItem,
            (disableMenu || !canDeleteCurrent) && {opacity: 0.5},
          ]}>
          <Text allowFontScaling={false} style={[styles.menuText, {color: '#FF5A5F'}]}>
            현재 미디어 삭제
          </Text>
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity
          onPress={() => {
            close();
            onDeletePost?.();
          }}
          disabled={disableMenu}
          activeOpacity={0.85}
          style={[styles.menuItem, disableMenu && {opacity: 0.5}]}>
          <Text allowFontScaling={false} style={[styles.menuText, {color: '#FF5A5F'}]}>게시글 삭제</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    backgroundColor: 'rgba(0,0,0,0.10)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 52 : 16,
    paddingRight: 14,
  },
  menuBox: {
    width: getResponsiveWidth(190),
    backgroundColor: 'rgba(20,20,20,0.96)',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 6},
    elevation: 12,
    marginTop: getResponsiveHeight(40),
  },
  menuItem: {
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  menuText: {
    color: '#fff',
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(13),
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
});
