import React, {
  forwardRef,
  useRef,
  useImperativeHandle,
  useCallback,
  useState,
} from 'react';
import BottomSheetLayout from 'components/bottomSheet/BottomSheetLayout';
import FamilyJoinOrCreateForm from 'features/auth/components/FamilyJoinOrCreateForm';
import {
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';

const FamilyJoinOrCreateBottomSheet = forwardRef((_, ref) => {
  const modalRef = useRef(null);
  const [formKey, setFormKey] = useState(0);

  const handleDismiss = useCallback(() => {
    setFormKey(k => k + 1);
  }, []);

  const closeSheet = useCallback(() => {
    modalRef.current?.dismiss?.();
  }, []);

  useImperativeHandle(ref, () => ({
    present: () => {
      setFormKey(k => k + 1);
      setTimeout(() => modalRef.current?.present?.(), 0);
    },
    dismiss: closeSheet,
  }));

  return (
    <BottomSheetLayout
      modalRef={modalRef}
      snapPoints={['88%']}
      enableContentPanningGesture
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      androidKeyboardInputMode="adjustResize"
      closeOnPressOutside
      onDismiss={handleDismiss}
      title="가족 모임 참여·만들기"
      subtitle="초대 코드로 참여하거나 새 모임을 만들어 보세요."
      headerCentered
      containerStyle={{paddingHorizontal: getResponsiveWidth(20)}}
      androidBottomPadding={getResponsiveHeight(8)}>
      <FamilyJoinOrCreateForm
        key={formKey}
        compact
        fromAppFlow
        surface="sheet"
        onSkipPress={closeSheet}
        onSheetSuccess={closeSheet}
      />
    </BottomSheetLayout>
  );
});

FamilyJoinOrCreateBottomSheet.displayName = 'FamilyJoinOrCreateBottomSheet';

export default FamilyJoinOrCreateBottomSheet;
