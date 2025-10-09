import React from 'react';
import { Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { resolveFieldBehavior } from '@/lib/resolveFieldBehavior';
import CurrencyInput from './CurrencyInput';
import PhoneInput from './PhoneInput';
import PasswordInput from './PasswordInput';
import DateInput from './DateInput';

/**
 * Universal FormField component
 * Automatically configures input type, validation, and UX based on field label/name
 * 
 * @param {Object} props
 * @param {import('react-hook-form').Control} props.control - React Hook Form control
 * @param {string} props.name - Field name (for form data)
 * @param {string} props.label - Field label (visible to user, determines behavior)
 * @param {string} [props.description] - Help text displayed below input
 * @param {boolean} [props.required] - Whether field is required
 * @param {Object} [props.behaviorOverrides] - Override auto-detected behavior
 * @param {string} [props.className] - Additional CSS classes
 */
const FormField = ({
  control,
  name,
  label,
  description,
  required = false,
  behaviorOverrides = {},
  className,
  disabled = false,
  onAIPolish,
  ...extraProps
}) => {
  // Resolve field behavior based on label and name
  const behavior = resolveFieldBehavior(label, name, behaviorOverrides);
  
  const fieldId = `field-${name}`;
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => {
        const hasError = !!error;
        const helpText = description || behavior.helpText;

        return (
          <div className={cn('space-y-2', className)}>
            {/* Label */}
            <Label
              htmlFor={fieldId}
              className="text-sm sm:text-base font-medium flex items-center gap-1"
            >
              {label}
              {required && <span className="text-red-600" aria-label="required">*</span>}
            </Label>

            {/* Input Field */}
            <div className="relative">
              {renderField(behavior, field, {
                id: fieldId,
                disabled,
                required,
                'aria-invalid': hasError,
                'aria-describedby': hasError ? errorId : helpText ? helpId : undefined,
                ...behavior.inputProps,
                ...extraProps,
              })}
            </div>

            {/* Character Count (for text/textarea with limits) */}
            {behavior.showCharCount && field.value && (
              <div className="flex justify-end">
                <span className="text-xs text-gray-500">
                  {field.value.length} / {behavior.inputProps.maxLength || 500}
                </span>
              </div>
            )}

            {/* AI Polish Button (for textarea/story fields) */}
            {behavior.showAIPolish && onAIPolish && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onAIPolish(field.value, field.onChange)}
                className="bg-white border-2 border-black text-black hover:bg-gray-50"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Polish with AI
              </Button>
            )}

            {/* Help Text */}
            {helpText && !hasError && (
              <p id={helpId} className="text-xs sm:text-sm text-gray-500">
                {helpText}
              </p>
            )}

            {/* Error Message */}
            {hasError && (
              <p
                id={errorId}
                role="alert"
                className="text-xs sm:text-sm text-red-600 font-medium"
              >
                {error.message || behavior.errorText}
              </p>
            )}
          </div>
        );
      }}
    />
  );
};

/**
 * Render the appropriate input component based on behavior type
 */
function renderField(behavior, field, props) {
  const { type } = behavior;

  // Handle different field types
  switch (type) {
    case 'currency':
      return (
        <CurrencyInput
          {...props}
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
        />
      );

    case 'tel':
      return (
        <PhoneInput
          {...props}
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
        />
      );

    case 'password':
      return (
        <PasswordInput
          {...props}
          value={field.value}
          onChange={(e) => field.onChange(e.target.value)}
          onBlur={field.onBlur}
          showStrengthMeter={behavior.showStrengthMeter}
          showRevealToggle={behavior.showRevealToggle}
        />
      );

    case 'date':
      return (
        <DateInput
          {...props}
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          minDate={behavior.inputProps?.min ? new Date(behavior.inputProps.min) : undefined}
        />
      );

    case 'textarea':
      return (
        <Textarea
          {...props}
          value={field.value || ''}
          onChange={field.onChange}
          onBlur={(e) => {
            field.onBlur();
            if (behavior.transformOnBlur) {
              field.onChange(behavior.transformOnBlur(e.target.value));
            }
          }}
          className="min-h-[120px] border-2 border-black"
        />
      );

    case 'radio':
      return (
        <RadioGroup
          value={field.value}
          onValueChange={field.onChange}
          disabled={props.disabled}
        >
          <div className="space-y-3">
            {behavior.options?.map((option) => (
              <div
                key={option.value}
                className="flex items-center space-x-3 p-3 bg-white/10 border border-gray-300 rounded-lg"
              >
                <RadioGroupItem
                  value={option.value}
                  id={`${props.id}-${option.value}`}
                  className="w-4 h-4 border-2 border-black rounded-none data-[state=checked]:bg-brand-green data-[state=checked]:border-brand-green [&>span]:hidden"
                />
                <div className="flex-1">
                  <Label
                    htmlFor={`${props.id}-${option.value}`}
                    className="font-medium cursor-pointer"
                  >
                    {option.label}
                  </Label>
                  {option.description && (
                    <p className="text-sm text-gray-500">{option.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </RadioGroup>
      );

    case 'checkbox':
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={props.id}
            checked={field.value}
            onCheckedChange={field.onChange}
            disabled={props.disabled}
            className="border-2 border-black"
          />
          <Label
            htmlFor={props.id}
            className="text-sm font-normal cursor-pointer"
          >
            {props['aria-label'] || 'I agree'}
          </Label>
        </div>
      );

    case 'email':
    case 'url':
    case 'text':
    case 'number':
    default:
      return (
        <Input
          {...props}
          value={field.value || ''}
          onChange={field.onChange}
          onBlur={(e) => {
            field.onBlur();
            if (behavior.transformOnBlur) {
              field.onChange(behavior.transformOnBlur(e.target.value));
            }
          }}
          className="border-2 border-black"
        />
      );
  }
}

export default FormField;

