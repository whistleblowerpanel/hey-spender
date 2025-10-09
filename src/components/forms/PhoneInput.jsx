import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { parsePhoneNumber, AsYouType } from 'libphonenumber-js';

/**
 * International phone input with country picker
 * Default country: Nigeria (+234)
 * Stores full E.164 format, displays national format
 */
const PhoneInput = React.forwardRef(({
  value,
  onChange,
  onBlur,
  className,
  disabled,
  defaultCountry = 'NG',
  ...props
}, ref) => {
  const [country, setCountry] = useState(defaultCountry);
  const [phoneNumber, setPhoneNumber] = useState('');

  const countries = [
    { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
    { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
    { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭' },
    { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪' },
    { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦' },
  ];

  const currentCountry = countries.find(c => c.code === country) || countries[0];

  // Parse incoming value to display format
  useEffect(() => {
    if (value) {
      try {
        const parsed = parsePhoneNumber(value);
        if (parsed) {
          setCountry(parsed.country || defaultCountry);
          setPhoneNumber(parsed.nationalNumber);
        } else {
          setPhoneNumber(value);
        }
      } catch {
        setPhoneNumber(value);
      }
    } else {
      setPhoneNumber('');
    }
  }, [value, defaultCountry]);

  const handlePhoneChange = (e) => {
    const input = e.target.value;
    
    // Format as you type
    const formatter = new AsYouType(country);
    const formatted = formatter.input(input);
    
    setPhoneNumber(input);

    // Build E.164 format for storage
    try {
      const parsed = parsePhoneNumber(input, country);
      if (parsed && parsed.isValid()) {
        onChange?.(parsed.format('E.164'));
      } else {
        // Still pass the raw value even if not valid yet
        onChange?.(`${currentCountry.dialCode}${input.replace(/\D/g, '')}`);
      }
    } catch {
      onChange?.(`${currentCountry.dialCode}${input.replace(/\D/g, '')}`);
    }
  };

  const handleCountryChange = (newCountry) => {
    setCountry(newCountry);
    // Reformat phone number for new country
    if (phoneNumber) {
      try {
        const newCountryData = countries.find(c => c.code === newCountry);
        const fullNumber = `${newCountryData.dialCode}${phoneNumber.replace(/\D/g, '')}`;
        const parsed = parsePhoneNumber(fullNumber);
        if (parsed && parsed.isValid()) {
          onChange?.(parsed.format('E.164'));
        }
      } catch {
        // Keep existing
      }
    }
  };

  return (
    <div className={cn('flex gap-2', className)}>
      <Select value={country} onValueChange={handleCountryChange} disabled={disabled}>
        <SelectTrigger className="w-[140px] border-2 border-black">
          <SelectValue>
            <span className="flex items-center gap-2">
              <span>{currentCountry.flag}</span>
              <span className="text-sm">{currentCountry.dialCode}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {countries.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              <span className="flex items-center gap-2">
                <span>{c.flag}</span>
                <span>{c.name}</span>
                <span className="text-gray-500">{c.dialCode}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        ref={ref}
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneChange}
        onBlur={onBlur}
        disabled={disabled}
        placeholder="803 123 4567"
        className="flex-1 border-2 border-black"
        {...props}
      />
    </div>
  );
});

PhoneInput.displayName = 'PhoneInput';

export default PhoneInput;

