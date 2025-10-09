# Form System Quick Start Guide

## 🚀 Quick Start

### 1. Install Dependencies (Already Done)
```bash
npm install react-hook-form @hookform/resolvers libphonenumber-js currency.js react-number-format
```

### 2. Import What You Need

```jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import FormField from '@/components/forms/FormField';
import { wishlistItemSchema } from '@/lib/formValidation';
```

### 3. Create a Form (3 Steps)

```jsx
function MyForm() {
  // Step 1: Setup React Hook Form with Zod validation
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(wishlistItemSchema),
    defaultValues: { name: '', price: 0, quantity: 1 }
  });

  // Step 2: Define submit handler
  const onSubmit = (data) => {
    console.log(data); // Already validated!
    // Save to database...
  };

  // Step 3: Use FormField components
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormField
        control={control}
        name="name"
        label="Item Name"
        required
      />
      
      <FormField
        control={control}
        name="price"
        label="Price"
      />
      
      <FormField
        control={control}
        name="quantity"
        label="Quantity"
        required
      />
      
      <button type="submit">Save</button>
    </form>
  );
}
```

**That's it!** The form automatically:
- ✅ Detects that "Item Name" is a title field (max 120 chars)
- ✅ Detects that "Price" is currency (shows ₦, formats numbers)
- ✅ Detects that "Quantity" is a number (min 1, integer only)
- ✅ Validates on submit
- ✅ Shows helpful error messages
- ✅ Is fully accessible (ARIA, keyboard nav, screen reader friendly)

## 📋 Common Patterns

### Email Field
```jsx
<FormField
  control={control}
  name="email"
  label="Email"
  required
/>
```
Auto-applies: Email validation, lowercase on blur, autocomplete="email"

### Phone Field
```jsx
<FormField
  control={control}
  name="phone"
  label="Phone Number"
/>
```
Auto-applies: International phone picker (default Nigeria +234), E.164 storage

### Currency Field
```jsx
<FormField
  control={control}
  name="amount"
  label="Target Amount"
  required
/>
```
Auto-applies: ₦ symbol, thousands separators, min 0

### Password Field
```jsx
<FormField
  control={control}
  name="newPassword"
  label="New Password"
  required
/>
```
Auto-applies: Strength meter, reveal toggle, complexity validation

### Date Field
```jsx
<FormField
  control={control}
  name="deadline"
  label="Due Date"
  required
/>
```
Auto-applies: Date picker, min=today (for "due" dates), relative hints

### Description/Story Field
```jsx
<FormField
  control={control}
  name="story"
  label="Story"
  onAIPolish={handleAIPolish}
/>
```
Auto-applies: Textarea, character counter, "Polish with AI" button

### Visibility/Privacy Field
```jsx
<FormField
  control={control}
  name="visibility"
  label="Visibility"
  required
/>
```
Auto-applies: Radio group (Public/Unlisted/Private) with descriptions

## 🎨 Customization

### Override Placeholder
```jsx
<FormField
  control={control}
  name="name"
  label="Item Name"
  behaviorOverrides={{
    inputProps: {
      placeholder: 'Custom placeholder here'
    }
  }}
/>
```

### Add Help Text
```jsx
<FormField
  control={control}
  name="price"
  label="Price"
  description="Enter the price in Nigerian Naira"
/>
```

### Custom Validation
```jsx
import { z } from 'zod';

const customSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().min(18, 'Must be 18 or older'),
});

const { control, handleSubmit } = useForm({
  resolver: zodResolver(customSchema),
  defaultValues: { name: '', age: 0 }
});
```

## 🔧 Available Schemas

```javascript
import {
  // Basic types
  emailSchema,
  phoneSchema,
  urlSchema,
  usernameSchema,
  passwordSchema,
  nameSchema,
  titleSchema,
  
  // Numbers
  currencySchema,
  currencyRequiredSchema,
  quantitySchema,
  
  // Dates
  dateSchema,
  futureDateSchema,
  dateOptionalSchema,
  
  // Nigeria-specific
  bankAccountNGSchema,
  bvnSchema,
  ninSchema,
  
  // Composite (complete forms)
  wishlistItemSchema,
  cashGoalSchema,
  wishlistSchema,
  profileUpdateSchema,
  passwordChangeSchema,
  bankDetailsSchema
} from '@/lib/formValidation';
```

## 🖼️ Image Upload

```jsx
import { useWatch } from 'react-hook-form';
import ImageUploadField from '@/components/forms/ImageUploadField';

function MyForm() {
  const { control, setValue } = useForm({...});
  const imageUrl = useWatch({ control, name: 'image_url' });
  
  const handleImageUpload = async (file) => {
    // Upload to storage
    const url = await uploadToS3(file);
    return url;
  };
  
  return (
    <ImageUploadField
      label="Cover Image"
      value={imageUrl}
      onChange={(url) => setValue('image_url', url)}
      onUpload={handleImageUpload}
    />
  );
}
```

## 📱 Phone Input

```jsx
import PhoneInput from '@/components/forms/PhoneInput';

<PhoneInput
  value={phoneValue}
  onChange={setPhoneValue}
  defaultCountry="NG"
/>
// Stores: "+2348031234567" (E.164)
// Displays: "803 123 4567" (national format)
```

## 💰 Currency Input

```jsx
import CurrencyInput from '@/components/forms/CurrencyInput';

<CurrencyInput
  value={amount}
  onChange={setAmount}
  placeholder="0"
/>
// Input: "150000" or "150,000"
// Stores: 150000 (number)
// Displays: "150,000" (formatted)
```

## 🔒 Password Input

```jsx
import PasswordInput from '@/components/forms/PasswordInput';

<PasswordInput
  value={password}
  onChange={setPassword}
  showStrengthMeter={true}
  showRevealToggle={true}
/>
```

## 🏦 Bank Account Input (Nigeria)

```jsx
import BankAccountInput from '@/components/forms/BankAccountInput';

<BankAccountInput
  accountNumber={accountNumber}
  bankCode={bankCode}
  onAccountChange={setAccountNumber}
  onBankChange={setBankCode}
  onVerified={(result) => {
    console.log('Account Name:', result.account_name);
  }}
/>
```

## ✅ Multi-Form Example (like Settings Dashboard)

```jsx
function SettingsPage() {
  // Separate form for each section
  const profileForm = useForm({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: { full_name: '', username: '', phone: '' }
  });
  
  const passwordForm = useForm({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { newPassword: '', confirmPassword: '' }
  });
  
  const handleProfileUpdate = (data) => { /* save profile */ };
  const handlePasswordChange = (data) => { /* save password */ };
  
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Profile Form */}
      <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)}>
        <h2>Profile</h2>
        <FormField control={profileForm.control} name="full_name" label="Full Name" required />
        <FormField control={profileForm.control} name="username" label="Username" required />
        <FormField control={profileForm.control} name="phone" label="Phone Number" />
        <button type="submit">Save Profile</button>
      </form>
      
      {/* Password Form */}
      <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)}>
        <h2>Password</h2>
        <FormField control={passwordForm.control} name="newPassword" label="New Password" required />
        <FormField control={passwordForm.control} name="confirmPassword" label="Confirm Password" required />
        <button type="submit">Update Password</button>
      </form>
    </div>
  );
}
```

## 🎯 Field Detection Cheat Sheet

| Label Contains | Auto-Detects As | Special Features |
|----------------|-----------------|------------------|
| "email" | Email field | Validation, lowercase, autocomplete |
| "phone", "mobile" | Phone field | Country picker, E.164 storage |
| "amount", "price", "budget" | Currency | ₦ symbol, thousands separator |
| "quantity", "qty" | Number | Min 1, integer, stepper |
| "name", "full name" | Text | Title case, min 2 chars |
| "title" | Text | Max 120 chars, counter |
| "username" | Text | Lowercase, alphanumeric |
| "url", "link" | URL | HTTPS normalization |
| "date", "deadline" | Date | Picker, relative hints |
| "description", "story" | Textarea | Counter, AI polish button |
| "password" | Password | Strength meter, reveal |
| "visibility", "privacy" | Radio | Public/Unlisted/Private |
| "bank account" | Text | 10-digit, verification |
| "image", "photo" | Image | Upload, preview |

## 🆘 Troubleshooting

**Q: Field not detecting type correctly?**  
A: The label must contain one of the keywords above. Use `behaviorOverrides` to force a type.

**Q: Validation not working?**  
A: Ensure you're using `zodResolver` with a Zod schema.

**Q: Currency showing wrong format?**  
A: Make sure the value is a number, not a string.

**Q: Phone not saving correctly?**  
A: PhoneInput automatically converts to E.164. Check that onChange is wired properly.

**Q: Form not submitting?**  
A: Check browser console for validation errors. Use `formState.errors` to debug.

## 📚 Next Steps

1. Read full documentation: `docs/FORM_SYSTEM.md`
2. Check migrated forms for examples:
   - `src/components/dashboard/EditWishlistItemModal.jsx`
   - `src/components/dashboard/AddCashGoalModal.jsx`
   - `src/components/dashboard/SettingsDashboard.jsx`
   - `src/components/wizard/GetStartedWizard.jsx`
3. Create your own form!

## 💡 Pro Tips

- Always use `required` prop for required fields (adds red asterisk)
- Use `description` prop for help text
- Currency/phone inputs handle formatting automatically - just pass numbers/strings
- Password fields auto-show strength meter when label contains "password" (not "confirm")
- Date fields with "due/deadline" in label automatically set min=today
- All fields are accessible by default (ARIA, keyboard nav, screen readers)

---

Happy form building! 🎉

