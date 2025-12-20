import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  const defaultProps = {
    children: 'Click me',
  }

  it('renders with default props', () => {
    render(<Button {...defaultProps} />)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-primary')
  })

  it('renders with different variants', () => {
    const { rerender } = render(<Button {...defaultProps} variant="secondary" />)
    expect(screen.getByRole('button')).toHaveClass('bg-secondary')

    rerender(<Button {...defaultProps} variant="outline" />)
    expect(screen.getByRole('button')).toHaveClass('border-input')

    rerender(<Button {...defaultProps} variant="ghost" />)
    expect(screen.getByRole('button')).toHaveClass('hover:bg-accent')
  })

  it('renders with different sizes', () => {
    const { rerender } = render(<Button {...defaultProps} size="sm" />)
    expect(screen.getByRole('button')).toHaveClass('h-8')

    rerender(<Button {...defaultProps} size="lg" />)
    expect(screen.getByRole('button')).toHaveClass('h-12')
  })

  it('handles click events', async () => {
    const user = userEvent.setup()
    const handleClick = jest.fn()
    render(<Button {...defaultProps} onClick={handleClick} />)

    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button {...defaultProps} disabled />)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('opacity-50')
  })

  it('shows loading state', () => {
    render(<Button {...defaultProps} loading />)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('opacity-50')
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('is full width when fullWidth prop is true', () => {
    render(<Button {...defaultProps} fullWidth />)
    expect(screen.getByRole('button')).toHaveClass('w-full')
  })

  it('handles keyboard interactions', async () => {
    const user = userEvent.setup()
    const handleClick = jest.fn()
    render(<Button {...defaultProps} onClick={handleClick} />)

    const button = screen.getByRole('button')
    button.focus()
    expect(button).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(handleClick).toHaveBeenCalledTimes(1)

    await user.keyboard(' ')
    expect(handleClick).toHaveBeenCalledTimes(2)
  })

  it('applies custom className', () => {
    render(<Button {...defaultProps} className="custom-class" />)
    expect(screen.getByRole('button')).toHaveClass('custom-class')
  })

  it('passes through additional props', () => {
    render(<Button {...defaultProps} type="submit" data-testid="custom-button" />)
    const button = screen.getByTestId('custom-button')
    expect(button).toHaveAttribute('type', 'submit')
  })
})
