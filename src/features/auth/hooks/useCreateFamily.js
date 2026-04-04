// src/hooks/useCreateFamily.js
import {useCallback, useState} from 'react';
import {useCreateFamilyMutation} from 'features/home/services/homeApi';

export function useCreateFamily() {
  const [createFamilyMutation] = useCreateFamilyMutation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createFamily = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await createFamilyMutation().unwrap();
      return result?.familyId ?? result;
    } catch (e) {
      setError(e?.data?.message || e?.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [createFamilyMutation]);

  return {createFamily, loading, error};
}
