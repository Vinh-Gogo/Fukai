import { useState, useEffect, useCallback } from "react";

// Type for serializer/deserializer functions
type Serializer<T> = (value: T) => string;
type Deserializer<T> = (value: string) => T;

// Default serializers
const defaultSerializer = <T>(value: T): string => JSON.stringify(value);
const defaultDeserializer = <T>(value: T): T => value;

/**
 * Custom hook for managing localStorage with React state synchronization
 *
 * @param key - The localStorage key
 * @param initialValue - Initial value if key doesn't exist
 * @param options - Options for serialization and cross-tab sync
 * @returns [storedValue, setValue, removeValue]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: {
    serializer?: Serializer<T>;
    deserializer?: Deserializer<T>;
    syncAcrossTabs?: boolean;
  } = {},
) {
  const {
    serializer = defaultSerializer,
    deserializer = defaultDeserializer,
    syncAcrossTabs = false,
  } = options;

  // Get initial value from localStorage or use provided initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }
      return deserializer(JSON.parse(item));
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when state changes
  const setValue = useCallback(
    (value: T | ((prevValue: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (valueToStore === undefined) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, serializer(valueToStore));
        }

        // Dispatch custom event for cross-tab synchronization
        if (syncAcrossTabs) {
          window.dispatchEvent(
            new CustomEvent("localStorageChange", {
              detail: { key, value: valueToStore },
            }),
          );
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue, serializer, syncAcrossTabs],
  );

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);

      if (syncAcrossTabs) {
        window.dispatchEvent(
          new CustomEvent("localStorageChange", {
            detail: { key, value: undefined },
          }),
        );
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue, syncAcrossTabs]);

  // Listen for changes from other tabs
  useEffect(() => {
    if (!syncAcrossTabs) return;

    const handleStorageChange = (e: CustomEvent) => {
      if (e.detail.key === key) {
        setStoredValue(e.detail.value);
      }
    };

    window.addEventListener(
      "localStorageChange",
      handleStorageChange as EventListener,
    );
    return () =>
      window.removeEventListener(
        "localStorageChange",
        handleStorageChange as EventListener,
      );
  }, [key, syncAcrossTabs]);

  // Listen for storage events from other tabs/windows
  useEffect(() => {
    if (!syncAcrossTabs) return;

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = deserializer(JSON.parse(e.newValue));
          setStoredValue(newValue);
        } catch (error) {
          console.warn(
            `Error parsing localStorage value for key "${key}":`,
            error,
          );
        }
      } else if (e.key === key && e.newValue === null) {
        setStoredValue(initialValue);
      }
    };

    window.addEventListener("storage", handleStorageEvent);
    return () => window.removeEventListener("storage", handleStorageEvent);
  }, [key, initialValue, deserializer, syncAcrossTabs]);

  return [storedValue, setValue, removeValue] as const;
}

/**
 * Hook for simple boolean localStorage values
 */
export function useLocalStorageBoolean(
  key: string,
  initialValue: boolean = false,
) {
  return useLocalStorage(key, initialValue, {
    serializer: (value: boolean) => value.toString(),
    deserializer: (value: string) => value === "true",
  });
}

/**
 * Hook for simple string localStorage values
 */
export function useLocalStorageString(key: string, initialValue: string = "") {
  return useLocalStorage(key, initialValue, {
    serializer: (value: string) => value,
    deserializer: (value: string) => value,
  });
}

/**
 * Hook for number localStorage values
 */
export function useLocalStorageNumber(key: string, initialValue: number = 0) {
  return useLocalStorage(key, initialValue, {
    serializer: (value: number) => value.toString(),
    deserializer: (value: string) => {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? initialValue : parsed;
    },
  });
}
