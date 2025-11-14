//src/components/EventTypeSelect.jsx
'use client';
import { CATEGORIES } from '@/lib/categories';

export default function EventTypeSelect({
  value = '',
  onChange,
  placeholder = 'Select category…',
  required = false,
  className = '',
  disabled = false,
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      required={required}
      disabled={disabled}
      className={`form-select ${className}`}
    >
      <option value="">{placeholder}</option>
      {CATEGORIES.map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  );
}
