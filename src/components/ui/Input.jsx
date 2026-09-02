export default function Input({
  type = 'text',
  label,
  placeholder,
  value,
  name,
  id,
  required = false,
  disabled = false,
  error,
  hint,
  class: className = '',
  accept,
  multiple,
  onChange,
  'data-testid': testId,
  ...rest
}) {
  const inputId = id || name;
  const describedBy = [error && `${inputId}-error`, hint && `${inputId}-hint`].filter(Boolean).join(' ') || undefined;

  return (
    <div class={className} data-testid={testId}>
      {label && (
        <label htmlFor={inputId} class="label">
          {label}
          {required && <span class="text-[var(--color-error)] ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <input
        type={type}
        id={inputId}
        name={name}
        defaultValue={value}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        accept={accept}
        multiple={multiple}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={describedBy}
        class="input"
        onChange={onChange}
        {...rest}
      />
      {error && (
        <p id={`${inputId}-error`} class="mt-2 text-sm text-[var(--color-error)]" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} class="mt-2 body-sm">
          {hint}
        </p>
      )}
    </div>
  );
}