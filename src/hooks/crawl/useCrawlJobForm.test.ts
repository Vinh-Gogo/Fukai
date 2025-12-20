import { renderHook, act } from '@testing-library/react'
import { useCrawlJobForm } from './useCrawlJobForm'

// Mock the validation function
jest.mock('@/lib/crawl', () => ({
  validateUrl: jest.fn(),
}))

import { validateUrl } from '@/lib/crawl'

const mockValidateUrl = validateUrl as jest.MockedFunction<typeof validateUrl>

describe('useCrawlJobForm', () => {
  const mockOnAddJob = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockValidateUrl.mockReturnValue({ isValid: true })
  })

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useCrawlJobForm(mockOnAddJob))

    expect(result.current.url).toBe('')
    expect(result.current.error).toBeNull()
    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.canSubmit).toBe(false)
  })

  it('updates URL when handleUrlChange is called', () => {
    const { result } = renderHook(() => useCrawlJobForm(mockOnAddJob))

    act(() => {
      result.current.handleUrlChange('https://example.com')
    })

    expect(result.current.url).toBe('https://example.com')
    expect(result.current.canSubmit).toBe(true)
  })

  it('clears error when user starts typing', () => {
    const { result } = renderHook(() => useCrawlJobForm(mockOnAddJob))

    // First set an error
    act(() => {
      result.current.setError('Some error')
    })

    // Then change URL (should clear the error)
    act(() => {
      result.current.handleUrlChange('https://example.com')
    })

    expect(result.current.error).toBeNull() // Error should be cleared on typing
    expect(result.current.canSubmit).toBe(true)
  })

  it('submits form successfully', async () => {
    const { result } = renderHook(() => useCrawlJobForm(mockOnAddJob))

    act(() => {
      result.current.handleUrlChange('https://example.com')
    })

    await act(async () => {
      await result.current.submitForm()
    })

    expect(mockOnAddJob).toHaveBeenCalledWith('https://example.com')
    expect(result.current.url).toBe('') // Should be cleared after success
    expect(result.current.isSubmitting).toBe(false)
  })

  it('handles submission errors', async () => {
    const errorMessage = 'Network error'
    mockOnAddJob.mockRejectedValueOnce(new Error(errorMessage))

    const { result } = renderHook(() => useCrawlJobForm(mockOnAddJob))

    act(() => {
      result.current.handleUrlChange('https://example.com')
    })

    await act(async () => {
      await result.current.submitForm()
    })

    expect(result.current.error).toBe(errorMessage)
    expect(result.current.isSubmitting).toBe(false)
  })

  it('prevents submission when URL is empty', async () => {
    const { result } = renderHook(() => useCrawlJobForm(mockOnAddJob))

    await act(async () => {
      await result.current.submitForm()
    })

    expect(mockOnAddJob).not.toHaveBeenCalled()
  })

  it('prevents double submission', async () => {
    mockOnAddJob.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    const { result } = renderHook(() => useCrawlJobForm(mockOnAddJob))

    act(() => {
      result.current.handleUrlChange('https://example.com')
    })

    // Start first submission
    act(() => {
      result.current.submitForm()
    })

    expect(result.current.isSubmitting).toBe(true)

    // Try to submit again while first is in progress
    await act(async () => {
      await result.current.submitForm()
    })

    expect(mockOnAddJob).toHaveBeenCalledTimes(1)
  })

  it('handles keyboard submission', () => {
    const { result } = renderHook(() => useCrawlJobForm(mockOnAddJob))

    act(() => {
      result.current.handleUrlChange('https://example.com')
    })

    const mockEvent = {
      preventDefault: jest.fn(),
      key: 'Enter',
    } as React.KeyboardEvent<HTMLInputElement>

    act(() => {
      result.current.handleKeyPress(mockEvent)
    })

    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(mockOnAddJob).toHaveBeenCalledWith('https://example.com')
  })

  it('ignores keyboard submission with shift key', () => {
    const { result } = renderHook(() => useCrawlJobForm(mockOnAddJob))

    act(() => {
      result.current.handleUrlChange('https://example.com')
    })

    const mockEvent = {
      preventDefault: jest.fn(),
      key: 'Enter',
      shiftKey: true,
    } as React.KeyboardEvent<HTMLInputElement>

    act(() => {
      result.current.handleKeyPress(mockEvent)
    })

    expect(mockEvent.preventDefault).not.toHaveBeenCalled()
  })

  it('validates URL correctly', () => {
    const { result } = renderHook(() => useCrawlJobForm(mockOnAddJob))

    // Test empty URL
    expect(result.current.validateUrl('').isValid).toBe(false)

    // Test valid URL
    mockValidateUrl.mockReturnValueOnce({ isValid: true })
    expect(result.current.validateUrl('https://example.com').isValid).toBe(true)

    // Test invalid URL
    mockValidateUrl.mockReturnValueOnce({ isValid: false, error: 'Invalid URL' })
    expect(result.current.validateUrl('invalid').isValid).toBe(false)
  })

  it('resets form state', () => {
    const { result } = renderHook(() => useCrawlJobForm(mockOnAddJob))

    act(() => {
      result.current.handleUrlChange('https://example.com')
      result.current.setError('Test error')
    })

    expect(result.current.url).toBe('https://example.com')
    expect(result.current.error).toBe('Test error')

    act(() => {
      result.current.resetForm()
    })

    expect(result.current.url).toBe('')
    expect(result.current.error).toBeNull()
    expect(result.current.isSubmitting).toBe(false)
  })
})
