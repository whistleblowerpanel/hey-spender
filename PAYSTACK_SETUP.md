# Paystack Setup Guide

## Step 1: Get Your Paystack Test Keys

1. **Sign up/Login to Paystack Dashboard**
   - Go to https://dashboard.paystack.com/
   - Create an account or login

2. **Get Test API Keys**
   - In your Paystack dashboard, go to "Settings" → "API Keys & Webhooks"
   - You'll see two test keys:
     - **Public Key**: Starts with `pk_test_...`
     - **Secret Key**: Starts with `sk_test_...`

## Step 2: Create Environment File

Create a `.env` file in your project root with the following content:

```env
# Supabase Configuration (if not already set)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Paystack Configuration (Test Keys)
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_actual_public_test_key_here
VITE_PAYSTACK_SECRET_KEY=sk_test_your_actual_secret_test_key_here
VITE_PAYSTACK_WEBHOOK_SECRET=your_random_webhook_secret_string

# Example (replace with your actual keys):
# VITE_PAYSTACK_PUBLIC_KEY=pk_test_1234567890abcdef1234567890abcdef12345678
# VITE_PAYSTACK_SECRET_KEY=sk_test_1234567890abcdef1234567890abcdef12345678
# VITE_PAYSTACK_WEBHOOK_SECRET=my_super_secret_webhook_string_12345
```

## Step 3: Generate Webhook Secret

Create a random string for your webhook secret. You can use:
- Online generator: https://www.uuidgenerator.net/
- Or run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Step 4: Test Your Setup

1. **Restart your development server** after creating the `.env` file
2. **Test the Send Cash functionality** on a wishlist item
3. **Use Paystack test cards**:
   - **Success**: 4084084084084085
   - **Declined**: 4084084084084085 (with wrong CVV)
   - **Insufficient Funds**: 4084084084084085 (with wrong expiry)

## Step 5: For Production (Later)

When ready for production, replace test keys with live keys:

```env
# Production Keys (uncomment when ready)
# VITE_PAYSTACK_PUBLIC_KEY=pk_live_your_actual_public_live_key_here
# VITE_PAYSTACK_SECRET_KEY=sk_live_your_actual_secret_live_key_here
```

## Important Notes

- ✅ **Never commit `.env` file to git** (it's in `.gitignore`)
- ✅ **Test keys are safe to use** in development
- ✅ **Live keys should be kept secret** and only used in production
- ✅ **Restart your dev server** after adding environment variables

## Troubleshooting

If you get errors:
1. **Check your keys** are copied correctly (no extra spaces)
2. **Restart your dev server** after adding the `.env` file
3. **Check browser console** for any error messages
4. **Verify Paystack dashboard** shows the test transaction attempts
