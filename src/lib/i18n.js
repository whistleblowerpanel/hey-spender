/**
 * Internationalization stub for HeySpender
 * TODO: Replace with proper i18n library (e.g., react-i18next)
 */

const translations = {
  en: {
    // Form field labels
    'field.email': 'Email',
    'field.phone': 'Phone Number',
    'field.name': 'Name',
    'field.firstName': 'First Name',
    'field.lastName': 'Last Name',
    'field.fullName': 'Full Name',
    'field.username': 'Username',
    'field.password': 'Password',
    'field.confirmPassword': 'Confirm Password',
    'field.amount': 'Amount',
    'field.price': 'Price',
    'field.targetAmount': 'Target Amount',
    'field.quantity': 'Quantity',
    'field.title': 'Title',
    'field.description': 'Description',
    'field.story': 'Story',
    'field.url': 'URL',
    'field.productUrl': 'Product URL',
    'field.date': 'Date',
    'field.deadline': 'Deadline',
    'field.bankAccount': 'Bank Account Number',
    'field.bankName': 'Bank Name',
    'field.visibility': 'Visibility',
    'field.coverImage': 'Cover Image',
    
    // Placeholders
    'placeholder.email': 'name@example.com',
    'placeholder.phone': '+234 803 123 4567',
    'placeholder.name': 'John Doe',
    'placeholder.username': 'johndoe',
    'placeholder.password': 'Enter your password',
    'placeholder.amount': '50,000',
    'placeholder.quantity': '1',
    'placeholder.title': 'My Birthday Wishlist',
    'placeholder.description': 'Tell us more...',
    'placeholder.url': 'https://example.com',
    'placeholder.bankAccount': '0123456789',
    
    // Error messages
    'error.required': 'This field is required',
    'error.email': 'Enter a valid email like name@example.com',
    'error.phone': 'Enter a valid phone number (e.g., +234 803 123 4567)',
    'error.url': 'Enter a valid link starting with https://',
    'error.amount.min': 'Enter an amount of ₦0 or more',
    'error.amount.required': 'Please enter an amount',
    'error.quantity.min': 'Enter a whole number of 1 or more',
    'error.quantity.integer': 'Quantity must be a whole number',
    'error.name.minLength': 'Enter a name with at least 2 characters',
    'error.title.maxLength': 'Add a short title (max 120 characters)',
    'error.username.invalid': 'Use letters, numbers or underscores',
    'error.username.taken': 'This username is already taken',
    'error.password.weak': 'Use 8+ chars with letters, a number, and a symbol',
    'error.password.mismatch': 'Passwords do not match',
    'error.bankAccount.invalid': 'Enter a 10-digit account number',
    'error.bvn.invalid': 'Enter an 11-digit BVN',
    'error.nin.invalid': 'Enter an 11-digit NIN',
    'error.date.invalid': 'Choose a valid date',
    'error.date.past': 'Date cannot be in the past',
    'error.file.size': 'Upload a JPG/PNG under 10MB',
    'error.file.type': 'Upload a valid image file',
    'error.description.minLength': 'Tell us a bit more (min 20 characters)',
    'error.checkbox.required': 'Please agree to continue',
    
    // Help text
    'help.username': 'Use letters, numbers or underscores',
    'help.phone': 'Include country code',
    'help.password': 'Must be at least 8 characters',
    'help.bankAccount': 'We\'ll verify this with your bank',
    'help.visibility.public': 'Anyone can find and view your wishlist',
    'help.visibility.unlisted': 'Only people with the link can view it',
    'help.visibility.private': 'Only you can view it',
    
    // Button labels
    'button.submit': 'Submit',
    'button.cancel': 'Cancel',
    'button.save': 'Save',
    'button.upload': 'Upload',
    'button.remove': 'Remove',
    'button.polishAI': 'Polish with AI',
  }
};

/**
 * Get translation for key
 * @param {string} key - Translation key
 * @param {Object} [params] - Parameters for interpolation
 * @returns {string}
 */
export function t(key, params = {}) {
  const locale = 'en'; // TODO: Get from context or localStorage
  let translation = translations[locale]?.[key] || key;
  
  // Simple parameter interpolation
  Object.keys(params).forEach(param => {
    translation = translation.replace(`{${param}}`, params[param]);
  });
  
  return translation;
}

/**
 * Check if translation exists
 * @param {string} key
 * @returns {boolean}
 */
export function hasTranslation(key) {
  const locale = 'en';
  return !!translations[locale]?.[key];
}

export default { t, hasTranslation };

