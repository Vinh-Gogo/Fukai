import { useCallback } from 'react'
import { useUIStore } from '@/stores/ui'

/**
 * Hook for managing loading states with Zustand store integration
 *
 * @param key - Optional key for specific loading state, uses global if not provided
 * @returns Object with loading state and control functions
 */
export function useLoading(key?: string) {
  const {
    globalLoading,
    loadingStates,
    setGlobalLoading,
    setLoadingState,
    removeLoadingState,
  } = useUIStore()

  const isLoading = key ? loadingStates[key] || false : globalLoading

  const startLoading = useCallback(() => {
    if (key) {
      setLoadingState(key, true)
    } else {
      setGlobalLoading(true)
    }
  }, [key, setLoadingState, setGlobalLoading])

  const stopLoading = useCallback(() => {
    if (key) {
      setLoadingState(key, false)
    } else {
      setGlobalLoading(false)
    }
  }, [key, setLoadingState, setGlobalLoading])

  const removeLoading = useCallback(() => {
    if (key) {
      removeLoadingState(key)
    }
  }, [key, removeLoadingState])

  const withLoading = useCallback(
    async <T>(asyncFn: () => Promise<T>): Promise<T> => {
      try {
        startLoading()
        const result = await asyncFn()
        return result
      } finally {
        stopLoading()
      }
    },
    [startLoading, stopLoading]
  )

  return {
    isLoading,
    startLoading,
    stopLoading,
    removeLoading,
    withLoading,
  }
}

/**
 * Hook for managing multiple loading states
 *
 * @param keys - Array of keys for loading states
 * @returns Object with loading states and control functions
 */
export function useMultipleLoading(keys: string[]) {
  const { loadingStates, setLoadingState, removeLoadingState } = useUIStore()

  const loadingStatesMap = keys.reduce((acc, key) => {
    acc[key] = loadingStates[key] || false
    return acc
  }, {} as Record<string, boolean>)

  const startLoading = useCallback(
    (key: string) => {
      if (keys.includes(key)) {
        setLoadingState(key, true)
      }
    },
    [keys, setLoadingState]
  )

  const stopLoading = useCallback(
    (key: string) => {
      if (keys.includes(key)) {
        setLoadingState(key, false)
      }
    },
    [keys, setLoadingState]
  )

  const removeLoading = useCallback(
    (key: string) => {
      if (keys.includes(key)) {
        removeLoadingState(key)
      }
    },
    [keys, removeLoadingState]
  )

  const startAllLoading = useCallback(() => {
    keys.forEach((key) => setLoadingState(key, true))
  }, [keys, setLoadingState])

  const stopAllLoading = useCallback(() => {
    keys.forEach((key) => setLoadingState(key, false))
  }, [keys, setLoadingState])

  const removeAllLoading = useCallback(() => {
    keys.forEach((key) => removeLoadingState(key))
  }, [keys, removeLoadingState])

  const isAnyLoading = Object.values(loadingStatesMap).some(Boolean)
  const isAllLoading = Object.values(loadingStatesMap).every(Boolean)

  return {
    loadingStates: loadingStatesMap,
    startLoading,
    stopLoading,
    removeLoading,
    startAllLoading,
    stopAllLoading,
    removeAllLoading,
    isAnyLoading,
    isAllLoading,
  }
}

/**
 * Hook for managing async operations with loading states
 *
 * @param key - Optional key for loading state
 * @returns Function to wrap async operations with loading state
 */
export function useAsyncLoading(key?: string) {
  const { withLoading } = useLoading(key)

  const executeAsync = useCallback(
    async <T>(
      asyncFn: () => Promise<T>,
      onSuccess?: (result: T) => void,
      onError?: (error: Error) => void
    ): Promise<T | undefined> => {
      try {
        const result = await withLoading(asyncFn)
        onSuccess?.(result)
        return result
      } catch (error) {
        onError?.(error as Error)
        throw error
      }
    },
    [withLoading]
  )

  return { executeAsync }
}

/**
 * Hook for managing form submission loading states
 *
 * @param formId - Unique identifier for the form
 * @returns Object with form loading state and submission handler
 */
export function useFormLoading(formId: string) {
  const { isLoading, withLoading } = useLoading(`form-${formId}`)

  const submitForm = useCallback(
    async <T = unknown>(
      submitFn: () => Promise<T>,
      options?: {
        onSuccess?: (result: T) => void
        onError?: (error: Error) => void
        resetOnError?: boolean
      }
    ): Promise<T | undefined> => {
      try {
        const result = await withLoading(submitFn)
        options?.onSuccess?.(result)
        return result
      } catch (error) {
        options?.onError?.(error as Error)
        throw error
      }
    },
    [withLoading]
  )

  return {
    isSubmitting: isLoading,
    submitForm,
  }
}

/**
 * Hook for managing API call loading states with automatic error handling
 *
 * @param key - Optional key for loading state
 * @returns Object with API call wrapper and loading state
 */
export function useApiLoading(key?: string) {
  const { isLoading, withLoading } = useLoading(key)
  const { addError } = useErrorStore.getState()

  const callApi = useCallback(
    async <T>(
      apiFn: () => Promise<T>,
      options?: {
        errorMessage?: string
        showError?: boolean
        onSuccess?: (result: T) => void
        onError?: (error: Error) => void
      }
    ): Promise<T | undefined> => {
      try {
        const result = await withLoading(apiFn)
        options?.onSuccess?.(result)
        return result
      } catch (error) {
        const err = error as Error

        if (options?.showError !== false) {
          addError({
            type: 'network',
            title: options?.errorMessage || 'API Error',
            message: err.message,
            details: { originalError: err },
            retryable: true,
            retryAction: async () => {
              try {
                await callApi(apiFn, { ...options, showError: false })
              } catch {
                // Ignore retry errors in the error handler
              }
            },
          })
        }

        options?.onError?.(err)
        throw error
      }
    },
    [withLoading]
  )

  return {
    isLoading,
    callApi,
  }
}

// Import here to avoid circular dependency
import { useErrorStore } from '@/stores/error'
