// src/hooks/common/useSelectModal.js
import {useMemo, useState} from 'react';

export const useSelectModal = (value, options) => {
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => options.find(o => o.value === value),
    [options, value],
  );

  const selectedIndex = useMemo(() => {
    const idx = options.findIndex(o => o.value === value);
    return idx >= 0 ? idx : 0;
  }, [options, value]);

  const openModal = () => setOpen(true);
  const closeModal = () => setOpen(false);

  const handleChange = newValue => {
    closeModal();
    return newValue;
  };

  return {
    open,
    selected,
    selectedIndex,
    openModal,
    closeModal,
    handleChange,
  };
};
