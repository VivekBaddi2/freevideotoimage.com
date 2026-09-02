export default function Card({
  variant = 'default',
  padding = 'lg',
  class: className = '',
  children,
  'data-testid': testId,
  ...rest
}) {
  const baseClasses = 'bg-[var(--color-canvas-elevated)] border border-[var(--color-hairline)] rounded-[var(--radius-md)]';

  const variantClasses = {
    default: '',
    elevated: 'shadow-[0px_2px_2px_rgba(0,0,0,0.04),0px_8px_16px_-4px_rgba(0,0,0,0.08)]',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-[var(--spacing-sm)]',
    md: 'p-[var(--spacing-md)]',
    lg: 'p-[var(--spacing-lg)]',
    xl: 'p-[var(--spacing-xl)]',
  };

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`;

  return (
    <div
      class={combinedClasses}
      data-testid={testId}
      {...rest}
    >
      {children}
    </div>
  );
}