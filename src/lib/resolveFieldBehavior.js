/**
 * Field Behavior Resolver
 * Automatically determines field type, validation, formatting, and UX based on field label/name
 */

import { t } from './i18n';
import {
  emailSchema,
  phoneSchema,
  urlSchema,
  urlOptionalSchema,
  usernameSchema,
  passwordSchema,
  nameSchema,
  titleSchema,
  descriptionSchema,
  requiredDescriptionSchema,
  currencySchema,
  currencyRequiredSchema,
  quantitySchema,
  dateSchema,
  futureDateSchema,
  dateOptionalSchema,
  bankAccountNGSchema,
  bvnSchema,
  ninSchema,
  imageUrlSchema,
  visibilitySchema,
  checkboxRequiredSchema,
} from './formValidation';

/**
 * Field behavior configuration
 * @typedef {Object} FieldBehavior
 * @property {'text'|'email'|'url'|'tel'|'number'|'currency'|'date'|'time'|'textarea'|'password'|'file'|'image'|'radio'|'select'|'checkbox'} type
 * @property {import('zod').ZodType} zodSchema
 * @property {Object} inputProps
 * @property {string} [helpText]
 * @property {string} [errorText]
 * @property {Function} [transformOnBlur]
 * @property {Function} [asyncValidate]
 * @property {Array} [options]
 * @property {Function} [formatValue]
 * @property {Function} [parseValue]
 */

/**
 * Normalize field identifier for matching
 * @param {string} str
 * @returns {string}
 */
function normalize(str) {
  return str.toLowerCase().replace(/[_\s-]/g, '');
}

/**
 * Check if label/name matches pattern
 * @param {string} identifier
 * @param {string[]} patterns
 * @returns {boolean}
 */
function matches(identifier, patterns) {
  const normalized = normalize(identifier);
  return patterns.some(pattern => normalized.includes(normalize(pattern)));
}

/**
 * Resolve field behavior based on label and/or name
 * @param {string} label - Field label (visible to user)
 * @param {string} [name] - Field name/key (optional)
 * @param {Object} [options] - Override options
 * @returns {FieldBehavior}
 */
export function resolveFieldBehavior(label, name = '', options = {}) {
  const identifier = `${label} ${name}`;
  
  // 1) EMAIL
  if (matches(identifier, ['email', 'e-mail'])) {
    return {
      type: 'email',
      zodSchema: emailSchema,
      inputProps: {
        type: 'email',
        autocomplete: 'email',
        placeholder: t('placeholder.email'),
      },
      errorText: t('error.email'),
      transformOnBlur: (value) => value.trim().toLowerCase(),
      ...options,
    };
  }
  
  // 2) PHONE
  if (matches(identifier, ['phone', 'mobile', 'phonenumber', 'tel'])) {
    return {
      type: 'tel',
      zodSchema: phoneSchema,
      inputProps: {
        type: 'tel',
        autocomplete: 'tel',
        placeholder: t('placeholder.phone'),
      },
      errorText: t('error.phone'),
      helpText: t('help.phone'),
      ...options,
    };
  }
  
  // 3) AMOUNT / CURRENCY
  if (matches(identifier, ['amount', 'price', 'targetamount', 'budget', 'ngn', 'cost', 'unitprice'])) {
    const isRequired = matches(identifier, ['target', 'required']);
    return {
      type: 'currency',
      zodSchema: isRequired ? currencyRequiredSchema : currencySchema,
      inputProps: {
        inputMode: 'decimal',
        placeholder: t('placeholder.amount'),
      },
      errorText: t('error.amount.min'),
      formatValue: (value) => {
        if (!value && value !== 0) return '';
        const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.]/g, ''));
        if (isNaN(num)) return '';
        return new Intl.NumberFormat('en-NG').format(num);
      },
      parseValue: (value) => {
        const cleaned = String(value).replace(/[^\d.]/g, '');
        return cleaned === '' ? 0 : parseFloat(cleaned);
      },
      ...options,
    };
  }
  
  // 4) QUANTITY
  if (matches(identifier, ['quantity', 'qty'])) {
    return {
      type: 'number',
      zodSchema: quantitySchema,
      inputProps: {
        type: 'number',
        min: 1,
        step: 1,
        placeholder: t('placeholder.quantity'),
      },
      errorText: t('error.quantity.min'),
      ...options,
    };
  }
  
  // 5) NAME
  if (matches(identifier, ['name', 'fullname', 'firstname', 'lastname'])) {
    let autocomplete = 'name';
    if (matches(identifier, ['first'])) autocomplete = 'given-name';
    if (matches(identifier, ['last'])) autocomplete = 'family-name';
    
    return {
      type: 'text',
      zodSchema: nameSchema,
      inputProps: {
        type: 'text',
        autocomplete,
        placeholder: t('placeholder.name'),
      },
      errorText: t('error.name.minLength'),
      transformOnBlur: (value) => {
        // Title case
        return value
          .trim()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      },
      ...options,
    };
  }
  
  // 6) TITLE
  if (matches(identifier, ['title', 'wishlisttitle', 'goaltitle'])) {
    return {
      type: 'text',
      zodSchema: titleSchema,
      inputProps: {
        type: 'text',
        maxLength: 120,
        placeholder: t('placeholder.title'),
      },
      errorText: t('error.title.maxLength'),
      helpText: 'Max 120 characters',
      showCharCount: true,
      ...options,
    };
  }
  
  // 7) USERNAME / HANDLE
  if (matches(identifier, ['username', 'handle'])) {
    return {
      type: 'text',
      zodSchema: usernameSchema,
      inputProps: {
        type: 'text',
        autocomplete: 'username',
        placeholder: t('placeholder.username'),
        pattern: '[a-z0-9_]+',
      },
      errorText: t('error.username.invalid'),
      helpText: t('help.username'),
      transformOnBlur: (value) => value.toLowerCase(),
      // asyncValidate: async (value) => {
      //   // TODO: Implement username uniqueness check
      //   return true;
      // },
      ...options,
    };
  }
  
  // 8) URL
  if (matches(identifier, ['url', 'link', 'producturl', 'website'])) {
    return {
      type: 'url',
      zodSchema: urlOptionalSchema,
      inputProps: {
        type: 'url',
        placeholder: t('placeholder.url'),
      },
      errorText: t('error.url'),
      transformOnBlur: (value) => {
        if (!value) return value;
        const trimmed = value.trim();
        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
          return `https://${trimmed}`;
        }
        return trimmed;
      },
      ...options,
    };
  }
  
  // 9) DATE
  if (matches(identifier, ['date', 'duedate', 'eventdate', 'deadline', 'when'])) {
    const isFuture = matches(identifier, ['due', 'deadline', 'future']);
    
    return {
      type: 'date',
      zodSchema: isFuture ? futureDateSchema : dateOptionalSchema,
      inputProps: {
        type: 'date',
      },
      errorText: isFuture ? t('error.date.past') : t('error.date.invalid'),
      ...options,
    };
  }
  
  // 10) TIME
  if (matches(identifier, ['time', 'timeofday'])) {
    return {
      type: 'time',
      zodSchema: dateSchema,
      inputProps: {
        type: 'time',
        step: 300, // 5 minutes
      },
      errorText: 'Choose a valid time',
      ...options,
    };
  }
  
  // 11) VISIBILITY / PRIVACY
  if (matches(identifier, ['visibility', 'privacy'])) {
    return {
      type: 'radio',
      zodSchema: visibilitySchema,
      options: [
        {
          value: 'public',
          label: 'Public (Show on Explore Page)',
          description: t('help.visibility.public'),
        },
        {
          value: 'unlisted',
          label: 'Unlisted (Link-only)',
          description: t('help.visibility.unlisted'),
        },
        {
          value: 'private',
          label: 'Private (Me only)',
          description: t('help.visibility.private'),
        },
      ],
      ...options,
    };
  }
  
  // 12) STORY / DESCRIPTION / NOTES / BIO
  if (matches(identifier, ['story', 'description', 'notes', 'bio', 'about', 'message'])) {
    const isRequired = matches(identifier, ['required', 'story']);
    
    return {
      type: 'textarea',
      zodSchema: isRequired ? requiredDescriptionSchema : descriptionSchema,
      inputProps: {
        placeholder: t('placeholder.description'),
        maxLength: 500,
      },
      errorText: isRequired ? t('error.description.minLength') : undefined,
      showCharCount: true,
      showAIPolish: true,
      ...options,
    };
  }
  
  // 13) COVER IMAGE / PHOTO / AVATAR
  if (matches(identifier, ['coverimage', 'photo', 'avatar', 'logo', 'banner', 'image'])) {
    return {
      type: 'image',
      zodSchema: imageUrlSchema,
      inputProps: {
        accept: 'image/*',
      },
      errorText: t('error.file.size'),
      helpText: 'Upload a JPG/PNG under 10MB',
      ...options,
    };
  }
  
  // 14) FILE / ATTACHMENT / DOCUMENT
  if (matches(identifier, ['file', 'attachment', 'document'])) {
    return {
      type: 'file',
      inputProps: {
        accept: '.pdf,.doc,.docx',
      },
      errorText: 'Upload a valid file',
      ...options,
    };
  }
  
  // 15) PASSWORD
  if (matches(identifier, ['password', 'newpassword', 'confirmpassword'])) {
    const isConfirm = matches(identifier, ['confirm']);
    
    return {
      type: 'password',
      zodSchema: isConfirm ? undefined : passwordSchema,
      inputProps: {
        type: 'password',
        autocomplete: isConfirm ? 'new-password' : 'current-password',
        placeholder: t('placeholder.password'),
        minLength: 8,
      },
      errorText: t('error.password.weak'),
      helpText: t('help.password'),
      showStrengthMeter: !isConfirm,
      showRevealToggle: true,
      ...options,
    };
  }
  
  // 16) BANK ACCOUNT NUMBER (NG)
  if (matches(identifier, ['bankaccount', 'accountnumber'])) {
    return {
      type: 'text',
      zodSchema: bankAccountNGSchema,
      inputProps: {
        type: 'text',
        inputMode: 'numeric',
        maxLength: 10,
        placeholder: t('placeholder.bankAccount'),
      },
      errorText: t('error.bankAccount.invalid'),
      helpText: t('help.bankAccount'),
      asyncValidate: async (value, bankCode) => {
        // TODO: Implement Paystack account verification
        return true;
      },
      ...options,
    };
  }
  
  // 17) BANK NAME / BANK CODE
  if (matches(identifier, ['bank', 'bankname', 'bankcode'])) {
    return {
      type: 'select',
      zodSchema: undefined, // Custom validation
      options: [], // Will be populated with NG banks
      inputProps: {
        placeholder: 'Select a bank',
      },
      errorText: 'Select a bank',
      ...options,
    };
  }
  
  // 18) BVN
  if (matches(identifier, ['bvn'])) {
    return {
      type: 'text',
      zodSchema: bvnSchema,
      inputProps: {
        type: 'text',
        inputMode: 'numeric',
        maxLength: 11,
        placeholder: '12345678901',
      },
      errorText: t('error.bvn.invalid'),
      ...options,
    };
  }
  
  // 19) NIN
  if (matches(identifier, ['nin'])) {
    return {
      type: 'text',
      zodSchema: ninSchema,
      inputProps: {
        type: 'text',
        inputMode: 'numeric',
        maxLength: 11,
        placeholder: '12345678901',
      },
      errorText: t('error.nin.invalid'),
      ...options,
    };
  }
  
  // 20) CHECKBOX (Terms, Consent)
  if (matches(identifier, ['terms', 'policy', 'consent', 'agree', 'accept'])) {
    return {
      type: 'checkbox',
      zodSchema: checkboxRequiredSchema,
      errorText: t('error.checkbox.required'),
      ...options,
    };
  }
  
  // DEFAULT: Plain text input
  return {
    type: 'text',
    inputProps: {
      type: 'text',
    },
    ...options,
  };
}

/**
 * Get Nigerian banks list (cached)
 * @returns {Promise<Array<{label: string, value: string, code: string}>>}
 */
export async function getNigerianBanks() {
  // TODO: Fetch from Paystack API or cache
  return [
    { label: 'Access Bank', value: '044', code: '044' },
    { label: 'Citibank Nigeria', value: '023', code: '023' },
    { label: 'Ecobank Nigeria', value: '050', code: '050' },
    { label: 'Fidelity Bank', value: '070', code: '070' },
    { label: 'First Bank of Nigeria', value: '011', code: '011' },
    { label: 'First City Monument Bank', value: '214', code: '214' },
    { label: 'Guaranty Trust Bank', value: '058', code: '058' },
    { label: 'Heritage Bank', value: '030', code: '030' },
    { label: 'Keystone Bank', value: '082', code: '082' },
    { label: 'Polaris Bank', value: '076', code: '076' },
    { label: 'Providus Bank', value: '101', code: '101' },
    { label: 'Stanbic IBTC Bank', value: '221', code: '221' },
    { label: 'Standard Chartered Bank', value: '068', code: '068' },
    { label: 'Sterling Bank', value: '232', code: '232' },
    { label: 'Union Bank of Nigeria', value: '032', code: '032' },
    { label: 'United Bank for Africa', value: '033', code: '033' },
    { label: 'Unity Bank', value: '215', code: '215' },
    { label: 'Wema Bank', value: '035', code: '035' },
    { label: 'Zenith Bank', value: '057', code: '057' },
  ];
}

export default resolveFieldBehavior;

