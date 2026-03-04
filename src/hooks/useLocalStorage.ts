'use client';

import { useState, useEffect, useCallback } from 'react';
import { getItem, setItem } from '@/lib/storage/store';

export function useLocalStorage<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setValue(getItem<T>(key, fallback));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set = useCallback((newVal: T | ((prev: T) => T)) => {
    setValue(prev => {
      const next = typeof newVal === 'function' ? (newVal as (p: T) => T)(prev) : newVal;
      setItem(key, next);
      return next;
    });
  }, [key]);

  return [value, set, hydrated] as const;
}
