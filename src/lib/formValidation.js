/**
 * Form validation utilities and Zod schemas for HeySpender
 */

import { z } from 'zod';
import { t } from './i18n';

// ============================================================================
// REGEX PATTERNS
// ============================================================================

export const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[1-9]\d{1,14}$/,
  url: /^https?:\/\/.+/,
  username: /^[a-z0-9_]+$/,
  slug: /^[a-z0-9-]+$/,
  bankAccountNG: /^\d{10}$/,
  bvn: /^\d{11}$/,
  nin: /^\d{11}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/,
};

// ============================================================================
// ZOD SCHEMAS - Basic Types
// ============================================================================

export const emailSchema = z
  .string()
  .min(1, t('error.required'))
  .email(t('error.email'))
  .transform(val => val.trim().toLowerCase());

export const phoneSchema = z
  .string()
  .min(1, t('error.required'))
  .regex(PATTERNS.phone, t('error.phone'));

export const urlSchema = z
  .string()
  .min(1, t('error.required'))
  .url(t('error.url'))
  .refine(val => val.startsWith('http://') || val.startsWith('https://'), {
    message: t('error.url')
  });

export const urlOptionalSchema = z
  .string()
  .optional()
  .transform(val => {
    if (!val || val.trim() === '') return undefined;
    const trimmed = val.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return `https://${trimmed}`;
    }
    return trimmed;
  });

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be less than 30 characters')
  .regex(PATTERNS.username, t('error.username.invalid'))
  .transform(val => val.toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, t('error.password.weak'))
  .regex(PATTERNS.password, t('error.password.weak'));

export const nameSchema = z
  .string()
  .min(2, t('error.name.minLength'))
  .transform(val => {
    // Title case transformation
    return val
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  });

export const titleSchema = z
  .string()
  .min(1, t('error.required'))
  .max(120, t('error.title.maxLength'));

export const descriptionSchema = z
  .string()
  .max(500, 'Description must be less than 500 characters')
  .optional();

export const requiredDescriptionSchema = z
  .string()
  .min(20, t('error.description.minLength'))
  .max(500, 'Description must be less than 500 characters');

// ============================================================================
// ZOD SCHEMAS - Numbers & Currency
// ============================================================================

export const currencySchema = z
  .union([z.string(), z.number()])
  .transform(val => {
    if (typeof val === 'number') return val;
    // Remove formatting (commas, currency symbols)
    const cleaned = String(val).replace(/[^\d.]/g, '');
    return cleaned === '' ? 0 : parseFloat(cleaned);
  })
  .pipe(
    z.number().min(0, t('error.amount.min'))
  );

export const currencyRequiredSchema = z
  .union([z.string(), z.number()])
  .transform(val => {
    if (typeof val === 'number') return val;
    const cleaned = String(val).replace(/[^\d.]/g, '');
    if (cleaned === '' || cleaned === '0') {
      throw new z.ZodError([{
        code: 'custom',
        message: t('error.amount.required'),
        path: []
      }]);
    }
    return parseFloat(cleaned);
  })
  .pipe(
    z.number().min(1, t('error.amount.required'))
  );

export const quantitySchema = z
  .union([z.string(), z.number()])
  .transform(val => {
    if (typeof val === 'number') return val;
    const cleaned = String(val).replace(/\D/g, '');
    return cleaned === '' ? 1 : parseInt(cleaned, 10);
  })
  .pipe(
    z.number().int(t('error.quantity.integer')).min(1, t('error.quantity.min'))
  );

// ============================================================================
// ZOD SCHEMAS - Dates
// ============================================================================

export const dateSchema = z.date({
  required_error: t('error.date.invalid'),
  invalid_type_error: t('error.date.invalid'),
});

export const futureDateSchema = z.date().refine(
  date => date >= new Date(new Date().setHours(0, 0, 0, 0)),
  { message: t('error.date.past') }
);

export const dateOptionalSchema = z.date().optional().nullable();

// ============================================================================
// ZOD SCHEMAS - Nigeria-specific
// ============================================================================

export const bankAccountNGSchema = z
  .string()
  .regex(PATTERNS.bankAccountNG, t('error.bankAccount.invalid'));

export const bvnSchema = z
  .string()
  .regex(PATTERNS.bvn, t('error.bvn.invalid'));

export const ninSchema = z
  .string()
  .regex(PATTERNS.nin, t('error.nin.invalid'));

// ============================================================================
// ZOD SCHEMAS - Files
// ============================================================================

export const imageFileSchema = z
  .instanceof(File)
  .refine(file => file.size <= 10 * 1024 * 1024, t('error.file.size'))
  .refine(
    file => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type),
    t('error.file.type')
  );

export const imageUrlSchema = z
  .string()
  .optional()
  .nullable()
  .transform(val => {
    if (!val || val === '') return undefined;
    return val;
  });

// ============================================================================
// ZOD SCHEMAS - Enums
// ============================================================================

export const visibilitySchema = z.enum(['public', 'unlisted', 'private'], {
  required_error: 'Please select a visibility option',
});

// ============================================================================
// ZOD SCHEMAS - Checkboxes & Agreements
// ============================================================================

export const checkboxRequiredSchema = z
  .boolean()
  .refine(val => val === true, { message: t('error.checkbox.required') });

// ============================================================================
// COMPOSITE SCHEMAS - Forms
// ============================================================================

export const wishlistItemSchema = z.object({
  name: titleSchema,
  description: descriptionSchema,
  unit_price_estimate: currencySchema,
  qty_total: quantitySchema,
  product_url: urlOptionalSchema,
  image_url: imageUrlSchema,
  wishlist_id: z.string().uuid('Please select a wishlist'),
});

export const cashGoalSchema = z.object({
  title: titleSchema,
  target_amount: currencyRequiredSchema,
  deadline: dateOptionalSchema,
  wishlist_id: z.string().uuid('Please select a wishlist'),
});

export const wishlistSchema = z.object({
  title: titleSchema,
  occasion: z.string().optional(),
  story: descriptionSchema,
  visibility: visibilitySchema,
  event_date: dateOptionalSchema,
  cover_image_url: imageUrlSchema,
});

export const profileUpdateSchema = z.object({
  full_name: nameSchema,
  username: usernameSchema,
  phone: phoneSchema.optional(),
});

export const emailUpdateSchema = z.object({
  email: emailSchema,
});

export const passwordChangeSchema = z.object({
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: t('error.password.mismatch'),
  path: ['confirmPassword'],
});

export const bankDetailsSchema = z.object({
  account_number: bankAccountNGSchema,
  bank_code: z.string().min(1, 'Please select a bank'),
  account_name: z.string().min(1, 'Account name is required'),
});

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Format validation errors for display
 * @param {z.ZodError} error
 * @returns {Object<string, string>}
 */
export function formatZodErrors(error) {
  const formatted = {};
  error.errors.forEach(err => {
    const path = err.path.join('.');
    formatted[path] = err.message;
  });
  return formatted;
}

/**
 * Validate data against schema and return errors
 * @param {z.ZodSchema} schema
 * @param {any} data
 * @returns {{success: boolean, data?: any, errors?: Object}}
 */
export function validateSchema(schema, data) {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: formatZodErrors(error) };
    }
    return { success: false, errors: { _form: 'Validation failed' } };
  }
}

/**
 * Async validation wrapper for React Hook Form
 * @param {z.ZodSchema} schema
 */
export function zodResolver(schema) {
  return async (data) => {
    try {
      const validated = await schema.parseAsync(data);
      return { values: validated, errors: {} };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = {};
        error.errors.forEach(err => {
          const path = err.path.join('.');
          errors[path] = { type: 'validation', message: err.message };
        });
        return { values: {}, errors };
      }
      return { values: {}, errors: { _form: { type: 'validation', message: 'Validation failed' } } };
    }
  };
}

