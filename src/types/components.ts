import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

/**
 * Base component props interface for consistent component patterns
 */
export interface BaseComponentProps {
  /** Additional CSS classes */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
  /** Test ID for testing purposes */
  'data-testid'?: string;
}

/**
 * Interactive component props interface
 */
export interface InteractiveComponentProps extends BaseComponentProps {
  /** Click handler */
  onClick?: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Tab index for accessibility */
  tabIndex?: number;
  /** ARIA label for screen readers */
  'aria-label'?: string;
}

/**
 * Card component props interface
 */
export interface CardComponentProps extends InteractiveComponentProps {
  /** Card title */
  title?: string;
  /** Card description */
  description?: string;
  /** Card icon */
  icon?: LucideIcon;
  /** Card variant */
  variant?: 'default' | 'primary' | 'secondary' | 'outline';
  /** Card size */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Status component props interface
 */
export interface StatusComponentProps extends BaseComponentProps {
  /** Status value */
  status: 'idle' | 'loading' | 'success' | 'error' | 'warning';
  /** Status text */
  text?: string;
  /** Show icon */
  showIcon?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Navigation item props interface
 */
export interface NavigationItemProps extends InteractiveComponentProps {
  /** Navigation item name */
  name: string;
  /** Navigation href */
  href: string;
  /** Navigation icon */
  icon: LucideIcon;
  /** Navigation description */
  description: string;
  /** Collapsed state for sidebar */
  collapsed?: boolean;
  /** Animation delay for staggered animations */
  delay?: number;
  /** Active state */
  active?: boolean;
}

/**
 * Form input props interface
 */
export interface InputComponentProps extends InteractiveComponentProps {
  /** Input label */
  label?: string;
  /** Input placeholder */
  placeholder?: string;
  /** Input value */
  value?: string;
  /** Input name */
  name?: string;
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'url' | 'search';
  /** Required field */
  required?: boolean;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Left icon */
  leftIcon?: LucideIcon;
  /** Right icon */
  rightIcon?: LucideIcon;
}

/**
 * Button component props interface
 */
export interface ButtonComponentProps extends InteractiveComponentProps {
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Button content */
  children: ReactNode;
  /** Left icon */
  leftIcon?: LucideIcon;
  /** Right icon */
  rightIcon?: LucideIcon;
  /** Full width */
  fullWidth?: boolean;
}

/**
 * Modal/Dialog props interface
 */
export interface ModalComponentProps extends BaseComponentProps {
  /** Modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal content */
  children: ReactNode;
  /** Modal footer */
  footer?: ReactNode;
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Show close button */
  showCloseButton?: boolean;
}

/**
 * Standard animation variants for consistent motion
 */
export const AnimationVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideIn: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
  },
} as const;

/**
 * Standard transition configurations
 */
export const TransitionConfig = {
  fast: { duration: 0.15, ease: 'easeOut' },
  normal: { duration: 0.3, ease: 'easeOut' },
  slow: { duration: 0.5, ease: 'easeOut' },
  bounce: { duration: 0.6, ease: [0.68, -0.55, 0.265, 1.55] },
} as const;

/**
 * Standard component size configurations
 */
export const SizeConfig = {
  sm: { padding: '0.5rem 0.75rem', fontSize: '0.875rem', height: '2rem' },
  md: { padding: '0.75rem 1rem', fontSize: '1rem', height: '2.5rem' },
  lg: { padding: '1rem 1.5rem', fontSize: '1.125rem', height: '3rem' },
} as const;
