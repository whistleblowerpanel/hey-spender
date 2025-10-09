import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

/**
 * Date picker input with relative date hint
 */
const DateInput = React.forwardRef(({
  value,
  onChange,
  onBlur,
  className,
  disabled,
  minDate,
  placeholder = 'Pick a date',
  showRelativeHint = true,
  ...props
}, ref) => {
  const handleSelect = (date) => {
    onChange?.(date);
  };

  const getRelativeHint = (date) => {
    if (!date || !showRelativeHint) return null;
    
    try {
      const distance = formatDistanceToNow(date, { addSuffix: true });
      return `(${distance})`;
    } catch {
      return null;
    }
  };

  const disabledDates = minDate ? (date) => date < minDate : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal border-2 border-black',
            !value && 'text-muted-foreground',
            className
          )}
          {...props}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? (
            <span>
              {format(value, 'PPP')}
              {showRelativeHint && (
                <span className="ml-2 text-xs text-gray-500">
                  {getRelativeHint(value)}
                </span>
              )}
            </span>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleSelect}
          disabled={disabledDates}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
});

DateInput.displayName = 'DateInput';

export default DateInput;

