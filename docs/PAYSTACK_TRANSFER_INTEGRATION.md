# Paystack Transfer Integration

This document explains how the Paystack Transfer API integration works in the HeySpender application for processing withdrawals.

## Overview

The integration automatically processes user withdrawals by:
1. Creating transfer recipients in Paystack
2. Initiating transfers to user bank accounts
3. Updating payout status and wallet balances
4. Handling OTP verification when required

## Files Added/Modified

### New Files
- `src/lib/paystackTransferService.js` - Main service for Paystack Transfer API integration

### Modified Files
- `src/pages/AdminDashboardPage.jsx` - Updated payout status update function

## How It Works

### 1. Payout Request Flow
```
User requests withdrawal → Payout created with status 'requested' → Admin approves → Admin marks as paid → Paystack transfer initiated
```

### 2. When Admin Clicks "Mark as Paid"

The system now:
1. **Validates payout data** - Ensures bank account details are present
2. **Verifies account** - Uses Paystack API to verify bank account details
3. **Creates recipient** - Registers the user's bank account with Paystack
4. **Initiates transfer** - Sends the money via Paystack Transfer API
5. **Updates database** - Marks payout as paid and debits user wallet
6. **Handles OTP** - Notifies admin if OTP verification is required

### 3. Paystack Transfer Service

The `paystackTransferService` provides these methods:

#### `processPayout(payoutData)`
Complete payout processing that:
- Verifies bank account details
- Creates transfer recipient
- Initiates transfer
- Updates payout record with provider info

#### `createTransferRecipient(recipientData)`
Creates a transfer recipient in Paystack for a user's bank account.

#### `initiateTransfer(transferData)`
Initiates a transfer to a registered recipient.

#### `verifyAccount(account_number, bank_code)`
Verifies bank account details before creating recipient.

#### `getBanks()`
Fetches list of Nigerian banks for account selection.

## Configuration

### Environment Variables Required

```env
# Paystack Configuration (Test Keys)
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_actual_public_test_key_here
VITE_PAYSTACK_SECRET_KEY=sk_test_your_actual_secret_test_key_here
VITE_PAYSTACK_WEBHOOK_SECRET=your_random_webhook_secret_string
```

### Paystack Dashboard Setup

1. **Enable Transfers**: In your Paystack dashboard, ensure transfers are enabled
2. **Add Bank Account**: You need a verified bank account in your Paystack account to send transfers
3. **Test Mode**: Use test keys for development, live keys for production

## Database Updates

When a transfer is processed, the payout record is updated with:
- `provider: 'paystack'` - Indicates the payment provider
- `provider_ref: transfer_code` - Paystack transfer reference for tracking

## Error Handling

The integration handles various error scenarios:

### Account Verification Failures
- Invalid account numbers
- Invalid bank codes
- Account name mismatches

### Transfer Failures
- Insufficient balance in Paystack account
- Invalid recipient codes
- Network/API errors

### OTP Requirements
- If your Paystack account requires OTP for transfers
- Admin is notified to complete OTP verification in Paystack dashboard

## Testing

### Test Mode
- Use Paystack test keys for development
- Test transfers won't actually send money
- Check Paystack dashboard for test transaction history

### Test Scenarios
1. **Valid withdrawal** - Should process successfully
2. **Invalid bank details** - Should show appropriate error
3. **Insufficient balance** - Should handle gracefully
4. **OTP requirement** - Should notify admin

## Security Considerations

### API Keys
- Secret keys are only used server-side (in Supabase Edge Functions for production)
- Public keys can be used client-side
- Never expose secret keys in client-side code

### Account Verification
- Always verify bank account details before creating recipients
- Store minimal account information
- Use Paystack's built-in account verification

## Monitoring

### Transaction Tracking
- All transfers are logged with Paystack transfer codes
- Failed transfers are tracked with error messages
- OTP requirements are clearly indicated

### Dashboard Integration
- Transfer statuses appear in Paystack dashboard
- Transaction history shows all processed withdrawals
- Failed transfers can be retried from Paystack dashboard

## Troubleshooting

### Common Issues

#### "Paystack secret key not configured"
- Ensure `VITE_PAYSTACK_SECRET_KEY` is set in your environment variables
- Restart your development server after adding environment variables

#### "Account verification failed"
- Check that bank account number and bank code are correct
- Ensure the bank code corresponds to a valid Nigerian bank

#### "Transfer failed"
- Check your Paystack account balance
- Verify your Paystack account is properly configured for transfers
- Check Paystack dashboard for detailed error messages

#### "OTP required"
- Complete OTP verification in your Paystack dashboard
- The transfer will be processed after OTP verification

### Debug Mode
- Check browser console for detailed error messages
- Monitor network requests to Paystack API
- Check Paystack dashboard for transaction status

## Production Deployment

### Live Keys
- Replace test keys with live keys in production
- Ensure webhook endpoints are configured
- Test with small amounts first

### Edge Functions
- Move Paystack API calls to Supabase Edge Functions for security
- Keep secret keys server-side only
- Implement proper error logging and monitoring

## Future Enhancements

### Planned Features
1. **Webhook Integration** - Automatic status updates from Paystack
2. **Retry Logic** - Automatic retry for failed transfers
3. **Bulk Transfers** - Process multiple payouts at once
4. **Transfer Limits** - Configurable daily/monthly limits
5. **Audit Trail** - Enhanced logging and tracking

### API Improvements
1. **Rate Limiting** - Respect Paystack API rate limits
2. **Caching** - Cache bank lists and account verification
3. **Async Processing** - Queue transfers for background processing
