// src/hooks/useCreateFamily.js
import {useCallback, useState} from 'react';
import {useDispatch} from 'react-redux';
import {createFamilyThunk} from 'features/home/store/familyThunk';

export function useCreateFamily() {
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createFamily = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const newFamilyId = await dispatch(createFamilyThunk());
      return newFamilyId;
    } catch (e) {
      setError(e.response?.data?.message || e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  return {createFamily, loading, error};
}
