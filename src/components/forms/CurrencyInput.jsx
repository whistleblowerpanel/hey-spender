import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Currency input component for Nigerian Naira (₦)
 * Formats display with thousands separators, stores as number
 */
const CurrencyInput = React.forwardRef(({
  value,
  onChange,
  onBlur,
  className,
  disabled,
  placeholder = '0',
  ...props
}, ref) => {
  const [displayValue, setDisplayValue] = useState('');

  // Format number with thousands separators
  const formatCurrency = (num) => {
    if (!num && num !== 0) return '';
    const number = typeof num === 'number' ? num : parseFloat(String(num).replace(/[^\d.]/g, ''));
    if (isNaN(number)) return '';
    return new Intl.NumberFormat('en-NG').format(number);
  };

  // Parse formatted string to number
  const parseCurrency = (str) => {
    const cleaned = String(str).replace(/[^\d.]/g, '');
    return cleaned === '' ? '' : cleaned;
  };

  // Update display value when prop value changes
  useEffect(() => {
    if (value !== undefined && value !== null) {
      setDisplayValue(formatCurrency(value));
    }
  }, [value]);

  const handleChange = (e) => {
    const input = e.target.value;
    const parsed = parseCurrency(input);
    
    // Update display with formatting
    setDisplayValue(parsed ? formatCurrency(parsed) : '');
    
    // Call onChange with numeric value
    if (onChange) {
      const numericValue = parsed === '' ? 0 : parseFloat(parsed);
      onChange(numericValue);
    }
  };

  const handleBlur = (e) => {
    // Ensure proper formatting on blur
    if (displayValue) {
      const parsed = parseCurrency(displayValue);
      setDisplayValue(formatCurrency(parsed));
    }
    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium pointer-events-none">
        ₦
      </div>
      <Input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        className={cn('pl-8', className)}
        {...props}
      />
    </div>
  );
});

CurrencyInput.displayName = 'CurrencyInput';

export default CurrencyInput;

