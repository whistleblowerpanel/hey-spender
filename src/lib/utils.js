import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

/**
 * Converts technical error messages to user-friendly messages
 * @param {Error|string} error - The error object or message
 * @param {string} context - The context of the error (e.g., 'creating wishlist', 'logging in')
 * @returns {string} - User-friendly error message
 */
export function getUserFriendlyError(error, context = 'performing this action') {
	// Check if developer mode is enabled (for admins only)
	const isDeveloperMode = localStorage.getItem('devMode') === 'true';
	
	const errorMessage = typeof error === 'string' ? error : (error?.message || '');
	const errorCode = error?.code || '';
	
	// If developer mode is on, return technical error
	if (isDeveloperMode) {
		const technicalError = errorMessage || 'Unknown error';
		const codeInfo = errorCode ? ` (Code: ${errorCode})` : '';
		return `[DEV MODE] ${technicalError}${codeInfo}`;
	}

	// Database constraint errors
	if (errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint')) {
		if (context.includes('wishlist')) {
			return 'A wishlist with this name already exists. Please choose a different title.';
		}
		if (context.includes('username') || context.includes('email')) {
			return 'This username or email is already taken. Please use a different one.';
		}
		return 'This item already exists. Please use a different name.';
	}

	if (errorMessage.includes('violates check constraint') || errorMessage.includes('check constraint')) {
		if (errorMessage.includes('occasion')) {
			return 'Please select a valid occasion for your wishlist.';
		}
		if (errorMessage.includes('price') || errorMessage.includes('amount')) {
			return 'Please enter a valid amount.';
		}
		return 'Please check your input and try again.';
	}

	if (errorMessage.includes('foreign key constraint') || errorMessage.includes('violates foreign key')) {
		return 'The item you\'re trying to reference doesn\'t exist. Please refresh and try again.';
	}

	if (errorMessage.includes('not-null constraint') || errorMessage.includes('null value')) {
		return 'Please fill in all required fields.';
	}

	// Network errors
	if (errorMessage.includes('network') || errorMessage.includes('fetch failed') || errorMessage.includes('Failed to fetch')) {
		return 'Unable to connect. Please check your internet connection and try again.';
	}

	if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
		return 'The request took too long. Please try again.';
	}

	// Authentication errors
	if (errorMessage.includes('Invalid login credentials') || errorMessage.includes('invalid_credentials')) {
		return 'Incorrect email or password. Please try again.';
	}

	if (errorMessage.includes('Email not confirmed') || errorMessage.includes('email_not_confirmed')) {
		return 'Please verify your email address before logging in. Check your inbox for the confirmation link.';
	}

	if (errorMessage.includes('User already registered') || errorMessage.includes('already_registered')) {
		return 'This email is already registered. Please log in instead.';
	}

	if (errorMessage.includes('session_not_found') || errorMessage.includes('session not found')) {
		return 'Your session has expired. Please log in again.';
	}

	if (errorMessage.includes('Password should be at least') || errorMessage.includes('weak_password')) {
		return 'Password must be at least 6 characters long.';
	}

	if (errorMessage.includes('Invalid email') || errorMessage.includes('invalid_email')) {
		return 'Please enter a valid email address.';
	}

	if (errorMessage.includes('refresh_token_not_found') || errorMessage.includes('refresh token')) {
		return 'Your session has expired. Please log in again.';
	}

	// Permission errors
	if (errorMessage.includes('permission denied') || errorMessage.includes('insufficient_privilege') || errorCode === '42501') {
		return 'You don\'t have permission to perform this action.';
	}

	if (errorMessage.includes('unauthorized') || errorMessage.includes('not authorized')) {
		return 'Please log in to continue.';
	}

	// Payment errors
	if (errorMessage.includes('payment') || errorMessage.includes('paystack')) {
		if (errorMessage.includes('declined') || errorMessage.includes('failed')) {
			return 'Payment was declined. Please try a different payment method.';
		}
		if (errorMessage.includes('insufficient')) {
			return 'Insufficient funds. Please try a different payment method.';
		}
		return 'Payment processing failed. Please try again.';
	}

	// File upload errors
	if (errorMessage.includes('file') || errorMessage.includes('upload')) {
		if (errorMessage.includes('size') || errorMessage.includes('too large')) {
			return 'File is too large. Please upload a smaller file.';
		}
		if (errorMessage.includes('type') || errorMessage.includes('format')) {
			return 'Invalid file type. Please upload a supported image format.';
		}
		return 'File upload failed. Please try again.';
	}

	// Rate limiting
	if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
		return 'You\'re going too fast! Please wait a moment and try again.';
	}

	// Server errors
	if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
		return 'Something went wrong on our end. Please try again in a moment.';
	}

	if (errorMessage.includes('503') || errorMessage.includes('Service Unavailable')) {
		return 'Service is temporarily unavailable. Please try again in a moment.';
	}

	// Validation errors
	if (errorMessage.includes('required') || errorMessage.includes('missing')) {
		return 'Please fill in all required fields.';
	}

	if (errorMessage.includes('invalid') && errorMessage.includes('format')) {
		return 'Please check the format of your input.';
	}

	// Default friendly messages based on context
	if (context) {
		return `We couldn't complete ${context}. Please try again or contact support if the problem persists.`;
	}

	// Absolute fallback
	return 'Something went wrong. Please try again or contact support if the problem persists.';
}