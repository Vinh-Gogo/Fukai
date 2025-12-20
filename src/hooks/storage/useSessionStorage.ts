import { useState, useEffect, useCallback } from 'react'

// Type for serializer/deserializer functions
type Serializer<T> = (value: T) => string
type Deserializer<T> = (value: string) => T

// Default serializers
const defaultSerializer = <T>(value: T): string => JSON.stringify(value)
const defaultDeserializer = <T>(value: T): T => value

/**
 * Custom hook for managing sessionStorage with React state synchronization
 *
 * @param key - The sessionStorage key
 * @param initialValue - Initial value if key doesn't exist
 * @param options - Options for serialization
 * @returns [storedValue, setValue, removeValue]
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T,
  options: {
    serializer?: Serializer<T>
    deserializer?: Deserializer<T>
  } = {}
) {
  const {
    serializer = defaultSerializer,
    deserializer = defaultDeserializer,
  } = options

  // Get initial value from sessionStorage or use provided initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.sessionStorage.getItem(key)
      if (item === null) {
        return initialValue
      }
      return deserializer(JSON.parse(item))
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Update sessionStorage when state changes
  const setValue = useCallback((value: T | ((prevValue: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)

      if (valueToStore === undefined) {
        window.sessionStorage.removeItem(key)
      } else {
        window.sessionStorage.setItem(key, serializer(valueToStore))
      }
    } catch (error) {
      console.warn(`Error setting sessionStorage key "${key}":`, error)
    }
  }, [key, storedValue, serializer])

  // Remove value from sessionStorage
  const removeValue = useCallback(() => {
    try {
      window.sessionStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (error) {
      console.warn(`Error removing sessionStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue] as const
}

/**
 * Hook for simple boolean sessionStorage values
 */
export function useSessionStorageBoolean(
  key: string,
  initialValue: boolean = false
) {
  return useSessionStorage(key, initialValue, {
    serializer: (value: boolean) => value.toString(),
    deserializer: (value: string) => value === 'true',
  })
}

/**
 * Hook for simple string sessionStorage values
 */
export function useSessionStorageString(
  key: string,
  initialValue: string = ''
) {
  return useSessionStorage(key, initialValue, {
    serializer: (value: string) => value,
    deserializer: (value: string) => value,
  })
}

/**
 * Hook for number sessionStorage values
 */
export function useSessionStorageNumber(
  key: string,
  initialValue: number = 0
) {
  return useSessionStorage(key, initialValue, {
    serializer: (value: number) => value.toString(),
    deserializer: (value: string) => {
      const parsed = parseFloat(value)
      return isNaN(parsed) ? initialValue : parsed
    },
  })
}
