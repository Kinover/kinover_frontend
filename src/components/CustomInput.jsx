import React, {useState, forwardRef, useEffect} from 'react';
import {TextInput, Keyboard, Platform} from 'react-native';
import {BottomSheetTextInput} from '@gorhom/bottom-sheet';

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
        !editable && disabledStyle,
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
  borderColor: '#D1D5DB',
};

const focusedStyle = {
  borderWidth: 2,
  borderColor: '#FFC84D',
};

const bottomSheetInputStyle = {
  backgroundColor: '#F5F5F5',
};

const disabledStyle = {
  borderColor: '#EEEEEE',
  backgroundColor: '#F9F9F9',
};

export default CustomInput;
