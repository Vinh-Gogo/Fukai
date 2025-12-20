import { useState, useCallback } from 'react'
import { validateUrl } from '@/lib/crawl'

/**
 * Business logic hook for crawl job form
 * Handles form state, validation, and submission logic
 */
export function useCrawlJobForm(onAddJob: (url: string) => void | Promise<void>) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Validate URL and return validation result
  const validateInputUrl = useCallback((inputUrl: string): { isValid: boolean; error?: string } => {
    if (!inputUrl.trim()) {
      return { isValid: false, error: 'URL is required' }
    }

    const validation = validateUrl(inputUrl.trim())
    if (!validation.isValid) {
      return { isValid: false, error: validation.error || 'Invalid URL format' }
    }

    return { isValid: true }
  }, [])

  // Handle URL input change with real-time validation
  const handleUrlChange = useCallback((newUrl: string) => {
    setUrl(newUrl)

    // Clear error when user starts typing
    if (error && newUrl !== url) {
      setError(null)
    }
  }, [error, url])

  // Submit the form
  const submitForm = useCallback(async () => {
    if (!url.trim() || isSubmitting) return

    const validation = validateInputUrl(url.trim())
    if (!validation.isValid) {
      setError(validation.error || 'Invalid URL')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onAddJob(url.trim())
      setUrl('') // Clear form on success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add crawl job'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }, [url, isSubmitting, validateInputUrl, onAddJob])

  // Handle form submission (from form onSubmit)
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    submitForm()
  }, [submitForm])

  // Handle keyboard submission
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submitForm()
    }
  }, [submitForm])

  // Reset form state
  const resetForm = useCallback(() => {
    setUrl('')
    setError(null)
    setIsSubmitting(false)
  }, [])

  // Check if form can be submitted
  const canSubmit = Boolean(url.trim() && !error && !isSubmitting)

  return {
    // State
    url,
    error,
    isSubmitting,
    canSubmit,

    // Actions
    handleUrlChange,
    handleSubmit,
    handleKeyPress,
    submitForm,
    resetForm,
    setError,

    // Validation
    validateUrl: validateInputUrl,
  }
}
