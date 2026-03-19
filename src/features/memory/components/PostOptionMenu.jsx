/* eslint-disable react-native/no-inline-styles */
// src/features/post/components/PostOptionMenu.jsx

import React, {
  useEffect,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {View, TouchableOpacity, StyleSheet, Pressable} from 'react-native';
import AppText from 'components/AppText';

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
} from 'utils/responsive';

// 기존 JSX의 <Text />를 접근성 정책 포함 AppText로 통일
const Text = AppText;

function PostOptionsMenu(
  {
    visible,
    setVisible,
    isChromeHidden,

    disableMenu,
    canSaveCurrent,
    canSaveAll,
    canDeleteCurrent,

    currentLabel,
    mediaCount,

    onSaveCurrent,
    onSaveAll,
    onEditPost,
    onDeleteCurrentImage,
    onDeletePost,
  },
  ref,
) {
  const anim = useSharedValue(0);
  const closingRef = useRef(false);

  const finishClose = useCallback(() => {
    setVisible?.(false);
    closingRef.current = false;
  }, [setVisible]);

  const close = useCallback(() => {
    if (!visible) return;
    if (closingRef.current) return;

    closingRef.current = true;

    anim.value = withTiming(0, {duration: 120}, () => {
      runOnJS(finishClose)();
    });
  }, [visible, anim, finishClose]);

  const open = useCallback(() => {
    if (visible) return;
    setVisible?.(true);
  }, [visible, setVisible]);

  useImperativeHandle(ref, () => ({close, open}), [close, open]);

  useEffect(() => {
    if (!visible) return;
    closingRef.current = false;
    anim.value = 0;
    anim.value = withTiming(1, {duration: 140});
  }, [visible, anim]);

  useEffect(() => {
    if (visible) return;
    anim.value = 0;
    closingRef.current = false;
  }, [visible, anim]);

 // dim만 투명도 조절 (검정 잔상 방지)
  const dimStyle = useAnimatedStyle(() => ({
    opacity: anim.value * 0.12, // 필요하면 0.08~0.18 조절
  }));

  const boxStyle = useAnimatedStyle(() => ({
    opacity: anim.value,
    transform: [{translateY: (1 - anim.value) * -6}],
  }));

  const actuallyVisible = visible && !isChromeHidden;
  if (!actuallyVisible) return null;

  return (
    <View style={styles.root} pointerEvents="box-none">
      {/* dim */}
      <Animated.View style={[styles.dim, dimStyle]} pointerEvents="none" />

      {/* 바깥 클릭 닫기 */}
      <Pressable style={StyleSheet.absoluteFillObject} onPress={close} />

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
          ]}
        >
          <Text style={styles.menuText}>
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
          ]}
        >
          <Text style={styles.menuText}>
            전체 미디어 저장 ({mediaCount || 0})
          </Text>
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity
          onPress={() => {
            close();
            onEditPost?.();
          }}
          disabled={disableMenu}
          activeOpacity={0.85}
          style={[styles.menuItem, disableMenu && {opacity: 0.5}]}
        >
          <Text style={styles.menuText}>
            게시글 수정
          </Text>
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
          ]}
        >
          <Text style={[styles.menuText, {color: '#FF5A5F'}]}>
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
          style={[styles.menuItem, disableMenu && {opacity: 0.5}]}
        >
          <Text style={[styles.menuText, {color: '#FF5A5F'}]}>
            게시글 삭제
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default forwardRef(PostOptionsMenu);

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 70 ,
    paddingRight: 14,
    zIndex: 9999,
    elevation: 9999,
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
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
