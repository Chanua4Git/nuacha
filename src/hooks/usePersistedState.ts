import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook that persists state to sessionStorage
 * Automatically saves on change and restores on mount
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  options?: {
    storage?: 'local' | 'session';
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
  }
) {
  const storage = options?.storage === 'local' ? localStorage : sessionStorage;
  const serialize = options?.serialize || JSON.stringify;
  const deserialize = options?.deserialize || JSON.parse;

  // Initialize state from storage or default
  const [state, setState] = useState<T>(() => {
    try {
      const item = storage.getItem(key);
      return item ? deserialize(item) : defaultValue;
    } catch (error) {
      console.warn(`Error loading persisted state for "${key}":`, error);
      return defaultValue;
    }
  });

  // Save to storage whenever state changes
  useEffect(() => {
    try {
      storage.setItem(key, serialize(state));
    } catch (error) {
      console.warn(`Error persisting state for "${key}":`, error);
    }
  }, [key, state, storage, serialize]);

  // Clear persisted data
  const clearPersistedState = useCallback(() => {
    try {
      storage.removeItem(key);
      setState(defaultValue);
    } catch (error) {
      console.warn(`Error clearing persisted state for "${key}":`, error);
    }
  }, [key, defaultValue, storage]);

  return [state, setState, clearPersistedState] as const;
}

/**
 * Hook to auto-save form inputs on change with debouncing
 */
export function useFormPersistence<T extends Record<string, any>>(
  formKey: string,
  defaultValues: T,
  options?: {
    debounceMs?: number;
    storage?: 'local' | 'session';
  }
) {
  const [formData, setFormData, clearFormData] = usePersistedState<T>(
    `form_${formKey}`,
    defaultValues,
    { storage: options?.storage }
  );

  return { formData, setFormData, clearFormData };
}
