import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Calculate password strength
 * @param {string} password
 * @returns {{score: number, label: string, color: string}}
 */
function calculatePasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  
  let score = 0;
  
  // Length
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  
  // Character types
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[@$!%*?&#]/.test(password)) score += 1;
  
  // Determine label and color
  if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 4) return { score, label: 'Fair', color: 'bg-yellow-500' };
  if (score <= 5) return { score, label: 'Good', color: 'bg-green-500' };
  return { score, label: 'Strong', color: 'bg-green-600' };
}

/**
 * Password input with reveal toggle and optional strength meter
 */
const PasswordInput = React.forwardRef(({
  value,
  onChange,
  onBlur,
  className,
  disabled,
  placeholder = 'Enter your password',
  showStrengthMeter = false,
  showRevealToggle = true,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  
  const strength = showStrengthMeter ? calculatePasswordStrength(value) : null;
  const strengthPercentage = strength ? (strength.score / 6) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={cn('pr-10', className)}
          {...props}
        />
        {showRevealToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      
      {showStrengthMeter && value && (
        <div className="space-y-1">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn('h-full transition-all duration-300', strength.color)}
              style={{ width: `${strengthPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-600">
            Password strength: <span className="font-medium">{strength.label}</span>
          </p>
        </div>
      )}
    </div>
  );
});

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;

