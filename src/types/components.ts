import React from 'react'

// ============================================================================
// COMMON PROP INTERFACES
// ============================================================================

/**
 * Standard size variants used across components
 */
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/**
 * Standard variant types for components
 */
export type ComponentVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive'
  | 'success'
  | 'warning'
  | 'info'

/**
 * Common spacing values
 */
export type Spacing = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'

/**
 * Common shadow/elevation values
 */
export type Shadow = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

/**
 * Common border radius values
 */
export type BorderRadius = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full'

/**
 * Common loading states
 */
export interface LoadingStateProps {
  loading?: boolean
  disabled?: boolean
}

/**
 * Common error state props
 */
export interface ErrorStateProps {
  error?: string
  helperText?: string
  hasError?: boolean
}

/**
 * Common accessibility props
 */
export interface AccessibilityProps {
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  role?: string
}

/**
 * Base component props that all UI components should extend
 */
export interface BaseComponentProps extends
  LoadingStateProps,
  Partial<AccessibilityProps> {

  /** Additional CSS classes */
  className?: string

  /** Component ID */
  id?: string

  /** Test ID for testing */
  'data-testid'?: string
}

// ============================================================================
// BUTTON COMPONENT PROPS
// ============================================================================

export interface ButtonProps extends
  BaseComponentProps,
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseComponentProps> {

  /** Button variant */
  variant?: ComponentVariant

  /** Button size */
  size?: ComponentSize

  /** Whether button takes full width */
  fullWidth?: boolean

  /** Button content */
  children: React.ReactNode

  /** Left icon */
  leftIcon?: React.ReactNode

  /** Right icon */
  rightIcon?: React.ReactNode

  /** Button type */
  type?: 'button' | 'submit' | 'reset'
}

// ============================================================================
// CARD COMPONENT PROPS
// ============================================================================

export interface CardProps extends BaseComponentProps {
  /** Card padding */
  padding?: Spacing

  /** Card shadow/elevation */
  shadow?: Shadow

  /** Whether to show border */
  border?: boolean

  /** Border radius */
  rounded?: boolean | BorderRadius

  /** Card content */
  children: React.ReactNode

  /** Whether card is interactive/hoverable */
  interactive?: boolean
}

export interface CardSectionProps extends BaseComponentProps {
  children: React.ReactNode
}

export type CardHeaderProps = CardSectionProps
export type CardContentProps = CardSectionProps
export type CardFooterProps = CardSectionProps

export interface CardTitleProps extends BaseComponentProps {
  children: React.ReactNode
  /** Title level for semantic HTML */
  level?: 1 | 2 | 3 | 4 | 5 | 6
}

export interface CardDescriptionProps extends BaseComponentProps {
  children: React.ReactNode
}

// ============================================================================
// INPUT COMPONENT PROPS
// ============================================================================

export interface InputProps extends
  BaseComponentProps,
  ErrorStateProps,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof BaseComponentProps | keyof ErrorStateProps | 'size'> {

  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'

  /** Input size */
  size?: ComponentSize

  /** Left icon/element */
  leftAddon?: React.ReactNode

  /** Right icon/element */
  rightAddon?: React.ReactNode

  /** Whether input is clearable */
  clearable?: boolean
}

export interface TextareaProps extends
  BaseComponentProps,
  ErrorStateProps,
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, keyof BaseComponentProps | keyof ErrorStateProps> {

  /** Textarea size */
  size?: ComponentSize

  /** Number of visible rows */
  rows?: number

  /** Whether textarea is resizable */
  resizable?: boolean

  /** Auto-resize based on content */
  autoResize?: boolean
}

// ============================================================================
// FORM COMPONENT PROPS
// ============================================================================

export interface FormFieldProps extends BaseComponentProps {
  /** Field label */
  label?: string

  /** Field description */
  description?: string

  /** Whether field is required */
  required?: boolean

  /** Field layout direction */
  layout?: 'vertical' | 'horizontal'

  /** Label width (for horizontal layout) */
  labelWidth?: string | number
}

export interface FormProps extends BaseComponentProps {
  /** Form submission handler */
  onSubmit?: (data: Record<string, unknown>) => void | Promise<void>

  /** Form validation mode */
  validationMode?: 'onChange' | 'onBlur' | 'onSubmit'

  /** Form layout */
  layout?: 'vertical' | 'horizontal' | 'inline'

  /** Form size */
  size?: ComponentSize
}

// ============================================================================
// LAYOUT COMPONENT PROPS
// ============================================================================

export interface ContainerProps extends BaseComponentProps {
  /** Container size constraint */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'

  /** Container padding */
  padding?: Spacing

  /** Center content */
  center?: boolean

  children: React.ReactNode
}

export interface FlexProps extends BaseComponentProps {
  /** Flex direction */
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse'

  /** Justify content */
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly'

  /** Align items */
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch'

  /** Flex wrap */
  wrap?: boolean | 'wrap' | 'nowrap' | 'wrap-reverse'

  /** Gap between items */
  gap?: Spacing

  children: React.ReactNode
}

export interface GridProps extends BaseComponentProps {
  /** Number of columns */
  columns?: number | string

  /** Gap between grid items */
  gap?: Spacing

  /** Minimum item width */
  minChildWidth?: string | number

  children: React.ReactNode
}

// ============================================================================
// OVERLAY COMPONENT PROPS
// ============================================================================

export interface ModalProps extends BaseComponentProps {
  /** Whether modal is open */
  isOpen: boolean

  /** Modal close handler */
  onClose: () => void

  /** Modal title */
  title?: string

  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'

  /** Whether modal is centered */
  centered?: boolean

  /** Whether to show close button */
  closable?: boolean

  /** Modal content */
  children: React.ReactNode
}

export interface DrawerProps extends BaseComponentProps {
  /** Whether drawer is open */
  isOpen: boolean

  /** Drawer close handler */
  onClose: () => void

  /** Drawer title */
  title?: string

  /** Drawer position */
  position?: 'left' | 'right' | 'top' | 'bottom'

  /** Drawer size */
  size?: string | number

  /** Whether to show close button */
  closable?: boolean

  /** Drawer content */
  children: React.ReactNode
}

export interface TooltipProps extends BaseComponentProps {
  /** Tooltip content */
  content: React.ReactNode

  /** Tooltip placement */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto'

  /** Trigger element */
  children: React.ReactNode

  /** Whether tooltip is disabled */
  disabled?: boolean
}

// ============================================================================
// DATA DISPLAY COMPONENT PROPS
// ============================================================================

export interface BadgeProps extends BaseComponentProps {
  /** Badge variant */
  variant?: ComponentVariant

  /** Badge size */
  size?: ComponentSize

  /** Badge content */
  children: React.ReactNode
}

export interface AvatarProps extends BaseComponentProps {
  /** Avatar source URL */
  src?: string

  /** Avatar alt text */
  alt?: string

  /** Avatar fallback content */
  fallback?: React.ReactNode

  /** Avatar size */
  size?: ComponentSize

  /** Avatar shape */
  shape?: 'circle' | 'square' | 'rounded'

  /** Whether avatar is online */
  online?: boolean
}

export interface TableProps extends BaseComponentProps {
  /** Table data */
  data?: Record<string, unknown>[]

  /** Table columns configuration */
  columns?: Record<string, unknown>[]

  /** Loading state */
  loading?: boolean

  /** Empty state content */
  emptyContent?: React.ReactNode

  /** Table size */
  size?: ComponentSize

  /** Whether table is selectable */
  selectable?: boolean

  /** Selection change handler */
  onSelectionChange?: (selectedRows: Record<string, unknown>[]) => void
}

// ============================================================================
// FEEDBACK COMPONENT PROPS
// ============================================================================

export interface AlertProps extends BaseComponentProps {
  /** Alert type */
  type?: 'success' | 'error' | 'warning' | 'info'

  /** Alert title */
  title?: string

  /** Alert message */
  message?: string

  /** Whether alert is closable */
  closable?: boolean

  /** Alert close handler */
  onClose?: () => void

  /** Alert icon */
  icon?: React.ReactNode

  /** Alert content */
  children?: React.ReactNode
}

export interface ToastProps extends AlertProps {
  /** Toast duration in milliseconds */
  duration?: number

  /** Toast position */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center'
}

export interface SpinnerProps extends BaseComponentProps {
  /** Spinner size */
  size?: ComponentSize

  /** Spinner color */
  color?: string

  /** Spinner thickness */
  thickness?: number

  /** Custom spinner label */
  label?: string
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Extract props for a component, excluding children if it's required
 */
export type ComponentProps<T extends React.ElementType> = React.ComponentPropsWithoutRef<T>

/**
 * Create a polymorphic component prop interface
 */
export type PolymorphicProps<E extends React.ElementType, P = Record<string, never>> = P & {
  as?: E
} & Omit<ComponentProps<E>, keyof P>

/**
 * Interactive component props for hoverable/clickable elements
 */
export interface InteractiveComponentProps extends EventHandlers {
  /** Whether component is interactive */
  interactive?: boolean

  /** Hover state */
  hover?: boolean

  /** Active/pressed state */
  active?: boolean

  /** Focus state */
  focused?: boolean

  /** Disabled state */
  disabled?: boolean
}

/**
 * Animation variants for Framer Motion
 */
export interface AnimationVariants {
  initial?: Record<string, unknown>
  animate?: Record<string, unknown>
  exit?: Record<string, unknown>
  hover?: Record<string, unknown>
  tap?: Record<string, unknown>
  focus?: Record<string, unknown>
  disabled?: Record<string, unknown>
}

/**
 * Transition configuration for animations
 */
export interface TransitionConfig {
  duration?: number
  delay?: number
  ease?: string | number[]
  type?: 'tween' | 'spring' | 'keyframes' | 'inertia' | 'just'
  stiffness?: number
  damping?: number
  mass?: number
  bounce?: number
  restSpeed?: number
  restDelta?: number
  repeat?: number
  repeatType?: 'loop' | 'reverse' | 'mirror'
  repeatDelay?: number
}

/**
 * Common event handlers
 */
export interface EventHandlers {
  onClick?: (event: React.MouseEvent) => void
  onMouseEnter?: (event: React.MouseEvent) => void
  onMouseLeave?: (event: React.MouseEvent) => void
  onFocus?: (event: React.FocusEvent) => void
  onBlur?: (event: React.FocusEvent) => void
  onKeyDown?: (event: React.KeyboardEvent) => void
  onKeyUp?: (event: React.KeyboardEvent) => void
}
