import React, {useState, forwardRef, useEffect, useMemo} from 'react';
import {TextInput, Keyboard, Platform} from 'react-native';
import {BottomSheetTextInput} from '@gorhom/bottom-sheet';
import {COLORS} from 'styles/style';
import {useColors, useIsDark} from 'hooks/useColors';

/**
 * 공통 입력 컴포넌트.
 * - 기본: borderColor '#E0E0E0', borderWidth 1
 * - 포커스: borderColor '#FFC84D', borderWidth 2
 * - 비활성: borderColor '#EEEEEE', backgroundColor '#F9F9F9'
 * - borderRadius는 style prop에서 유지
 *
 * @param {boolean} bottomSheet - @gorhom/bottom-sheet 내부에서 사용 시 true (BottomSheetTextInput: 키보드/시트 동기화 필수)
 * @param {boolean} disableFocusStyle - true면 내부 포커스 테두리 비활성화
 * @param {boolean} disableBaseStyle - true면 기본 회색 외곽 비활성화
 */
const CustomInput = forwardRef(function CustomInput(
  {
    style,
    editable = true,
    onFocus: onFocusProp,
    onBlur: onBlurProp,
    bottomSheet = false,
    disableFocusStyle = false,
    disableBaseStyle = false,
    ...props
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const colors = useColors();
  const isDark = useIsDark();
  /**
   * 바텀시트 + disableBaseStyle: 바깥 래퍼가 배경/테두리를 담당하므로 입력은 투명만 유지.
   * 내부에 surface 배경을 또 주고 editable 토글 시 네이티브 기본(밝은) 배경이 한 프레임 비치는 현상을 막음.
   */
  const bottomSheetInputStyle = useMemo(() => {
    if (disableBaseStyle) {
      return {backgroundColor: 'transparent'};
    }
    return {
      backgroundColor: isDark ? colors.surfaceMuted : '#F5F5F5',
    };
  }, [colors.surfaceMuted, isDark, disableBaseStyle]);

  /** 비활성 시에도 다크 모드에서 밝은 배경이 깜빡이지 않도록 테마 색 사용 */
  const disabledInputStyle = useMemo(
    () => ({
      borderColor: isDark ? colors.borderSubtle : '#EEEEEE',
      backgroundColor: isDark ? colors.surfaceMuted : '#F9F9F9',
    }),
    [colors.borderSubtle, colors.surfaceMuted, isDark],
  );

  const InputComponent = bottomSheet ? BottomSheetTextInput : TextInput;

  useEffect(() => {
    const sub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setFocused(false),
    );
    return () => sub.remove();
  }, []);

  const handleFocus = e => {
    setFocused(true);
    onFocusProp?.(e);
  };

  const handleBlur = e => {
    setFocused(false);
    onBlurProp?.(e);
  };

  return (
    <InputComponent
      ref={ref}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={props.accessibilityLabel ?? props.placeholder}
      accessibilityState={{disabled: !editable}}
      style={[
        style,
        !disableBaseStyle && defaultStyle,
        bottomSheet && bottomSheetInputStyle,
        !disableFocusStyle && focused && editable && focusedStyle,
        !editable && !disableBaseStyle && disabledInputStyle,
      ]}
      editable={editable}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    />
  );
});

const defaultStyle = {
  borderWidth: 1,
  borderColor: COLORS.disabled,
};

const focusedStyle = {
  borderWidth: 2,
  borderColor: COLORS.brandPrimary,
};

export default CustomInput;
