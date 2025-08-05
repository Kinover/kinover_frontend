import { useState, useEffect } from 'react';

export default function useSyncedArrayData(newData) {
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!newData) return;

    setData(prev => {
      const hasChanged =
        prev.length !== newData.length ||
        prev.some((item, idx) => JSON.stringify(item) !== JSON.stringify(newData[idx]));

      return hasChanged ? newData : prev;
    });
  }, [newData]);

  return data;
}
