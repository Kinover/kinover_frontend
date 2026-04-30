import React, {
  createContext,
  useContext,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import FamilyJoinOrCreateBottomSheet from 'features/auth/components/FamilyJoinOrCreateBottomSheet';

const FamilyJoinOrCreateSheetContext = createContext(null);

export function FamilyJoinOrCreateSheetProvider({children}) {
  const sheetRef = useRef(null);

  const openFamilyJoinOrCreateSheet = useCallback(() => {
    sheetRef.current?.present?.();
  }, []);

  const closeFamilyJoinOrCreateSheet = useCallback(() => {
    sheetRef.current?.dismiss?.();
  }, []);

  const value = useMemo(
    () => ({
      openFamilyJoinOrCreateSheet,
      closeFamilyJoinOrCreateSheet,
    }),
    [openFamilyJoinOrCreateSheet, closeFamilyJoinOrCreateSheet],
  );

  return (
    <FamilyJoinOrCreateSheetContext.Provider value={value}>
      {children}
      <FamilyJoinOrCreateBottomSheet ref={sheetRef} />
    </FamilyJoinOrCreateSheetContext.Provider>
  );
}

export function useFamilyJoinOrCreateSheet() {
  const ctx = useContext(FamilyJoinOrCreateSheetContext);
  if (!ctx) {
    throw new Error(
      'useFamilyJoinOrCreateSheet must be used within FamilyJoinOrCreateSheetProvider',
    );
  }
  return ctx;
}
