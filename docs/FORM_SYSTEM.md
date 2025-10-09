# HeySpender Form System Documentation

## Overview

The HeySpender form system is a comprehensive, intelligent form infrastructure that automatically configures input types, validation, formatting, and user experience based on field labels and names.

## Architecture

### Core Components

1. **`resolveFieldBehavior.js`** - Field behavior resolver
   - Automatically detects field type from label/name
   - Returns configuration for input type, validation, formatting, and UX
   - Supports 20+ field patterns (email, phone, currency, etc.)

2. **`formValidation.js`** - Zod validation schemas
   - Centralized validation logic
   - Reusable schemas for common field types
   - Composite schemas for complete forms

3. **`i18n.js`** - Internationalization stub
   - Translation keys for all form labels, errors, and help text
   - Ready for future i18n implementation

4. **`FormField.jsx`** - Universal form field component
   - Integrates with React Hook Form
   - Automatically renders correct input type
   - Handles validation, errors, and help text
   - Accessible (ARIA attributes, screen reader friendly)

### Specialized Input Components

- **CurrencyInput** - Nigerian Naira with formatting
- **PhoneInput** - International phone with country picker (default: Nigeria +234)
- **PasswordInput** - Password with strength meter and reveal toggle
- **DateInput** - Date picker with relative hints
- **BankAccountInput** - Nigerian bank account with Paystack verification
- **ImageUploadField** - Image upload with preview

## Field Behavior Mapping

The system automatically detects field behavior based on label/name patterns:

| Pattern | Field Type | Auto-Applied Features |
|---------|-----------|----------------------|
| Email, E-mail | Email | Email validation, lowercase on blur, autocomplete="email" |
| Phone, Mobile, Tel | Phone | International format, E.164 storage, national display |
| Amount, Price, Budget, NGN | Currency | NGN formatting (₦), thousands separators, min 0 |
| Quantity, Qty | Number | Integer validation, min 1, stepper UI |
| Name, Full Name | Text | Title case on blur, min 2 chars |
| Title, Wishlist Title | Text | Max 120 chars, character counter |
| Username, Handle | Text | Lowercase, alphanumeric + underscore, async uniqueness check |
| URL, Link, Product URL | URL | HTTPS normalization, URL validation |
| Date, Due Date, Deadline | Date | Date picker, min=today for deadlines, relative hints |
| Description, Story, Notes | Textarea | Max 500 chars, character counter, "Polish with AI" button |
| Password | Password | Strength meter, reveal toggle, min 8 chars with complexity |
| Visibility, Privacy | Radio | Public/Unlisted/Private options with descriptions |
| Bank Account | Text | 10-digit validation, Paystack verification |
| Cover Image, Photo | Image | Upload with preview, 10MB limit, JPG/PNG/WEBP |

## Usage Examples

### Basic Form Field

```jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import FormField from '@/components/forms/FormField';
import { wishlistItemSchema } from '@/lib/formValidation';

function MyForm() {
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(wishlistItemSchema),
    defaultValues: {
      name: '',
      unit_price_estimate: 0,
      qty_total: 1
    }
  });

  const onSubmit = (data) => {
    console.log(data); // Data is already validated and formatted
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Automatically becomes text input with title validation */}
      <FormField
        control={control}
        name="name"
        label="Item Name"
        required
      />

      {/* Automatically becomes currency input with NGN formatting */}
      <FormField
        control={control}
        name="unit_price_estimate"
        label="Price"
      />

      {/* Automatically becomes number input with min=1 */}
      <FormField
        control={control}
        name="qty_total"
        label="Quantity"
        required
      />

      <button type="submit">Save</button>
    </form>
  );
}
```

### Currency Input

```jsx
<FormField
  control={control}
  name="target_amount"
  label="Target Amount"
  required
/>
// Renders: CurrencyInput with ₦ prefix, thousands separators
// Stores: Number (e.g., 150000)
// Displays: "150,000"
```

### Phone Input

```jsx
<FormField
  control={control}
  name="phone"
  label="Phone Number"
  description="Include country code"
/>
// Renders: PhoneInput with country picker (default: Nigeria +234)
// Stores: E.164 format (e.g., "+2348031234567")
// Displays: National format (e.g., "803 123 4567")
```

### Password with Strength Meter

```jsx
<FormField
  control={control}
  name="newPassword"
  label="New Password"
  required
/>
// Automatically shows:
// - Strength meter (Weak/Fair/Good/Strong)
// - Reveal/hide toggle
// - Validation: min 8 chars, uppercase, lowercase, number, symbol
```

### Date with Deadline Validation

```jsx
<FormField
  control={control}
  name="deadline"
  label="Due Date"
  required
/>
// Automatically applies:
// - Date picker
// - min=today (because label contains "due")
// - Relative hint "(in 12 days)"
```

### Visibility Radio Group

```jsx
<FormField
  control={control}
  name="visibility"
  label="Visibility"
  required
/>
// Automatically renders:
// - Radio group with Public/Unlisted/Private
// - Descriptions for each option
```

### Override Default Behavior

```jsx
<FormField
  control={control}
  name="name"
  label="Item Name"
  required
  behaviorOverrides={{
    inputProps: {
      placeholder: 'Custom placeholder',
      maxLength: 200
    },
    helpText: 'Custom help text'
  }}
/>
```

## Validation

### Built-in Zod Schemas

```javascript
import {
  emailSchema,
  phoneSchema,
  urlSchema,
  currencySchema,
  quantitySchema,
  nameSchema,
  titleSchema,
  passwordSchema,
  bankAccountNGSchema,
  // ... and more
} from '@/lib/formValidation';
```

### Composite Schemas

```javascript
import {
  wishlistItemSchema,
  cashGoalSchema,
  wishlistSchema,
  profileUpdateSchema,
  passwordChangeSchema,
  bankDetailsSchema
} from '@/lib/formValidation';
```

### Creating Custom Schemas

```javascript
import { z } from 'zod';
import { titleSchema, currencyRequiredSchema } from '@/lib/formValidation';

const customSchema = z.object({
  title: titleSchema,
  budget: currencyRequiredSchema,
  notes: z.string().optional()
});
```

## Accessibility Features

All form fields include:

- ✅ `<label>` with `htmlFor` association
- ✅ `aria-invalid` on validation errors
- ✅ `aria-describedby` pointing to help/error text
- ✅ `aria-required` for required fields
- ✅ Logical tab order
- ✅ Keyboard navigation (Enter to submit, Escape to close dialogs)
- ✅ Screen reader friendly error messages
- ✅ Focus states
- ✅ Required field indicator (red asterisk *)

## Internationalization (i18n)

The system uses a centralized translation function:

```javascript
import { t } from '@/lib/i18n';

// Usage
t('error.email') // "Enter a valid email like name@example.com"
t('placeholder.phone') // "+234 803 123 4567"
t('help.password') // "Must be at least 8 characters"
```

**Note:** Currently a stub. Replace with `react-i18next` or similar for production.

## Nigerian-Specific Features

### Currency (NGN)
- Symbol: ₦
- Format: Thousands separators (e.g., ₦150,000)
- Storage: Number in Naira (not kobo)

### Phone Numbers
- Default country: Nigeria (+234)
- Storage: E.164 format
- Display: National format

### Bank Accounts
- 10-digit validation
- Paystack account verification (planned)
- Nigerian banks list included

### Nigerian Banks Supported
Access Bank, Citibank, Ecobank, Fidelity, First Bank, FCMB, GTBank, Heritage, Keystone, Polaris, Providus, Stanbic IBTC, Standard Chartered, Sterling, Union Bank, UBA, Unity Bank, Wema, Zenith

## Error Messages

All error messages are:
- ✅ Short and human-readable
- ✅ Action-oriented
- ✅ Include examples when helpful
- ✅ Centralized in i18n map

Examples:
- Email: "Enter a valid email like name@example.com"
- Phone: "Enter a valid phone number (e.g., +234 803 123 4567)"
- Amount: "Enter an amount of ₦0 or more"
- Quantity: "Enter a whole number of 1 or more"
- Password: "Use 8+ chars with letters, a number, and a symbol"

## Performance Features

- ✅ Debounced async validations (400-600ms)
- ✅ Optimized re-renders with React Hook Form
- ✅ Lazy loading of bank lists
- ✅ Memoized formatters

## Security Features

- ✅ Never log secrets (BVN/NIN) in console
- ✅ Strip formatting before submit (currency separators)
- ✅ Sanitize URLs (enforce HTTPS)
- ✅ Validate on client AND server (Zod schemas reused)

## Migrated Forms

The following forms have been migrated to the new system:

1. ✅ **EditWishlistItemModal** - Edit wishlist items
2. ✅ **AddCashGoalModal** - Create cash goals
3. ✅ **SettingsDashboard** - User profile, email, password, notifications
4. ✅ **GetStartedWizard** - Multi-step onboarding wizard

## Future Enhancements

### Planned Features
- [ ] AI Polish API integration for story/description fields
- [ ] Paystack bank account verification
- [ ] Username uniqueness async validation
- [ ] QR code generation for share links
- [ ] Draft save (persist form values on navigation)
- [ ] Form analytics (track field completion rates)
- [ ] Advanced password strength (check against common passwords)
- [ ] Address autocomplete (Google Maps API)
- [ ] File upload progress indicators

### Testing
- [ ] Unit tests for `resolveFieldBehavior`
- [ ] Integration tests for FormField variants
- [ ] E2E tests for complete forms
- [ ] Accessibility audit (axe-core)
- [ ] Screen reader testing

## API Integration

### Server-Side Validation

Reuse the same Zod schemas on the server:

```javascript
// Server route (e.g., Next.js API route)
import { wishlistItemSchema } from '@/lib/formValidation';

export async function POST(request) {
  const body = await request.json();
  
  // Validate
  const result = wishlistItemSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ error: result.error }, { status: 400 });
  }
  
  // Use validated data
  const validatedData = result.data;
  // ... save to database
}
```

### Async Validation Example

```javascript
// In resolveFieldBehavior.js or custom component
asyncValidate: async (value) => {
  const response = await fetch('/api/check-username', {
    method: 'POST',
    body: JSON.stringify({ username: value })
  });
  const { available } = await response.json();
  if (!available) {
    throw new Error('Username already taken');
  }
  return true;
}
```

## Troubleshooting

### Issue: Field not auto-detecting type correctly
**Solution:** Check label/name matches a pattern in `resolveFieldBehavior.js`. Use `behaviorOverrides` to manually specify type.

### Issue: Validation not working
**Solution:** Ensure form is using `zodResolver` and schema is imported correctly.

### Issue: Currency not formatting
**Solution:** Verify `CurrencyInput` is rendering. Check `value` prop is a number.

### Issue: Phone not saving in E.164
**Solution:** `PhoneInput` automatically converts. Check `onChange` is wired to form state.

## Contributing

When adding new field types:

1. Add pattern to `resolveFieldBehavior.js`
2. Add Zod schema to `formValidation.js`
3. Add translations to `i18n.js`
4. Update this documentation
5. Add test cases

## Support

For questions or issues, contact the HeySpender development team.

---

**Last Updated:** October 8, 2025  
**Version:** 1.0.0  
**Stack:** React + React Hook Form + Zod + Tailwind CSS

