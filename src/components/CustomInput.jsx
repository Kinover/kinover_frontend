import React, {useState, forwardRef} from 'react';
import {TextInput} from 'react-native';
import {BottomSheetTextInput} from '@gorhom/bottom-sheet';

/**
 * 공통 입력 컴포넌트.
 * - 기본: borderColor '#E0E0E0', borderWidth 1
 * - 포커스: borderColor '#FFC84D', borderWidth 2
 * - 비활성: borderColor '#EEEEEE', backgroundColor '#F9F9F9'
 * - borderRadius는 style prop에서 유지
 *
 * @param {boolean} bottomSheet - @gorhom/bottom-sheet 내부에서 사용 시 true
 */
const CustomInput = forwardRef(function CustomInput(
  {
    style,
    editable = true,
    onFocus: onFocusProp,
    onBlur: onBlurProp,
    bottomSheet = false,
    ...props
  },
  ref,
) {
  const [focused, setFocused] = useState(false);

  const InputComponent = bottomSheet ? BottomSheetTextInput : TextInput;

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
      style={[
        defaultStyle,
        style,
        focused && editable && focusedStyle,
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
  borderColor: '#E0E0E0',
};

const focusedStyle = {
  borderWidth: 2,
  borderColor: '#FFC84D',
};

const disabledStyle = {
  borderColor: '#EEEEEE',
  backgroundColor: '#F9F9F9',
};

export default CustomInput;
