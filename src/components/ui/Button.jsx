export default function Button({
  variant = 'primary',
  size = 'lg',
  disabled = false,
  type = 'button',
  href,
  class: className = '',
  children,
  'data-testid': testId,
  onClick,
  ...rest
}) {
  const isLink = !!href;

  const baseClasses = 'inline-flex items-center justify-center font-sans font-medium transition-all duration-150 ease-out whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-link)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)] disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-[var(--color-ink)] text-white rounded-[var(--radius-pill)] border-none hover:opacity-90 active:opacity-70',
    secondary: 'bg-[var(--color-canvas-elevated)] text-[var(--color-ink)] rounded-[var(--radius-pill)] border border-[var(--color-hairline)] hover:bg-[var(--color-hairline-soft)] active:bg-[var(--color-hairline)]',
    nav: 'bg-[var(--color-canvas-elevated)] text-[var(--color-ink)] rounded-[var(--radius-sm)] border border-[var(--color-hairline)] hover:bg-[var(--color-hairline-soft)] active:bg-[var(--color-hairline)]',
    ghost: 'bg-transparent text-[var(--color-body)] rounded-[var(--radius-full)] border-none hover:bg-[var(--color-hairline-soft)] hover:text-[var(--color-ink)] active:bg-[var(--color-hairline)]',
  };

  const sizeClasses = {
    lg: 'text-[var(--text-button-lg)] leading-[var(--text-button-lg--line-height)] px-[14px] h-[44px] gap-2',
    md: 'text-[var(--text-button-md)] leading-[var(--text-button-md--line-height)] px-[12px] h-[36px] gap-1.5',
    sm: 'text-[var(--text-button-md)] leading-[var(--text-button-md--line-height)] px-[10px] h-[32px] gap-1.5',
  };

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if (isLink) {
    return (
      <a
        href={href}
        class={combinedClasses}
        data-testid={testId}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      class={combinedClasses}
      data-testid={testId}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}