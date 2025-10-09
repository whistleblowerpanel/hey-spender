# Spender List Payment Tracking System

## Overview
This document describes the implementation of partial payment tracking and automatic fulfillment for the Spender List feature.

## Quick Start

### To Deploy These Changes:

1. **Apply the database migration** (Required before testing):
   - Open your Supabase project dashboard
   - Go to SQL Editor
   - Copy contents of `database/add_amount_paid_to_claims.sql` and run it

2. **Test the functionality**:
   - Navigate to the Spender List page (claims tab)
   - Click "Send Cash" on any claimed item
   - Try sending partial payments and observe the remaining amount updates
   - Send the final payment to see automatic fulfillment

3. **Verify the behavior**:
   - ✅ Partial payments show remaining amount
   - ✅ Full payment automatically marks as "Fulfilled"
   - ✅ All buttons are disabled when fulfilled
   - ✅ Green "Fulfilled" badge appears

## Changes Summary

### 1. Database Changes
**File**: `database/add_amount_paid_to_claims.sql`
- Added `amount_paid` column to the `claims` table (DECIMAL(10, 2))
- Tracks the total amount paid by spenders towards each claim
- Defaults to 0 for existing claims

**To apply this migration:**

**Option 1: Via Supabase Dashboard (Recommended)**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `database/add_amount_paid_to_claims.sql`
5. Click **Run** to execute

**Option 2: Via Command Line**
```bash
# If you have psql installed and Supabase connection string:
psql YOUR_DATABASE_URL -f database/add_amount_paid_to_claims.sql
```

**Option 3: Via Supabase CLI**
```bash
# If you have Supabase CLI installed:
supabase db push
# Or manually execute the migration:
supabase db execute -f database/add_amount_paid_to_claims.sql
```

### 2. Type Definitions
**File**: `src/types/database.d.ts`
- Added `amount_paid: number | null` to the `claims` table Row, Insert, and Update interfaces
- Ensures TypeScript type safety for the new field

### 3. Claims Service
**File**: `src/lib/claimsService.js`
- Updated `fetchUserClaims()` to ensure `amount_paid` defaults to 0 if not present
- Provides backward compatibility with existing data

### 4. SpenderListCard Component
**File**: `src/components/dashboard/SpenderListCard.jsx`

#### Key Changes:

##### a) Payment Success Handler (`handlePaymentSuccess`)
- Calculates new total paid amount: `currentAmountPaid + newPayment`
- Compares with estimated price to determine if claim should be fulfilled
- Updates claim with new `amount_paid` value
- Automatically marks claim as "fulfilled" when `amount_paid >= estimated_price`
- Shows contextual toast messages:
  - Full payment: "₦X sent! Item marked as fulfilled."
  - Partial payment: "₦X sent! ₦Y remaining."

##### b) Price Display
Enhanced the Est. Price section to show three states:
1. **No payment yet**: Shows full estimated price
2. **Partial payment**: Shows remaining amount with "already paid" message
   ```
   Est. Price — ₦5,000 (remaining)
   ₦2,000 already paid
   ```
3. **Fully paid**: Shows total with "(Paid)" indicator
   ```
   Est. Price — ₦7,000 (Paid)
   ```

##### c) Fulfilled Status Badge
- Displays a green "Fulfilled" badge when claim status is "fulfilled"
- Uses `CheckCircle2` icon for visual confirmation

##### d) Button Disabling
All action buttons are automatically disabled when `claim.status === 'fulfilled'`:
- **Send Cash**: Shows "Completed" and is disabled
- **Purchase**: Shows "Completed" and is disabled
- **Reminder**: Shows "Completed" and is disabled
- **Calendar**: Shows "Completed" and is disabled

## User Flow

### Scenario 1: Full Payment
1. Spender clicks "Send Cash"
2. Enters the full estimated price (e.g., ₦10,000)
3. Completes payment
4. System automatically:
   - Credits recipient's wallet with ₦10,000
   - Updates `amount_paid` to ₦10,000
   - Marks claim as "fulfilled"
   - Disables all buttons on the card
   - Shows "Fulfilled" badge

### Scenario 2: Partial Payment
1. Spender clicks "Send Cash"
2. Enters partial amount (e.g., ₦3,000 of ₦10,000)
3. Completes payment
4. System automatically:
   - Credits recipient's wallet with ₦3,000
   - Updates `amount_paid` to ₦3,000
   - Shows "₦7,000 remaining" in Est. Price
   - Keeps buttons active for future payments

### Scenario 3: Multiple Partial Payments
1. Spender makes first payment: ₦3,000
   - System shows: "₦7,000 remaining" + "₦3,000 already paid"
2. Spender makes second payment: ₦4,000
   - System shows: "₦3,000 remaining" + "₦7,000 already paid"
3. Spender makes final payment: ₦3,000
   - System automatically marks as "fulfilled"
   - All buttons disabled

### Scenario 4: Overpayment
1. Spender sends ₦12,000 for an item priced at ₦10,000
2. System automatically:
   - Credits recipient's wallet with ₦12,000
   - Updates `amount_paid` to ₦12,000
   - Marks claim as "fulfilled" (since 12,000 >= 10,000)
   - Shows "₦10,000 (Paid)" in Est. Price

## Technical Notes

### Backward Compatibility
- Existing claims without `amount_paid` are treated as having ₦0 paid
- The `claimsService.fetchUserClaims()` ensures this default value

### Payment Processing
- All payments credit the recipient's wallet immediately
- Transaction records are created in `wallet_transactions` table
- Payment tracking is separate from wallet transactions (provides spender-side view)

### Status Management
- The claim status can be manually changed via dropdown menu
- Auto-fulfillment only happens during payment processing
- Manual status changes don't affect `amount_paid` value

## Testing Checklist

- [ ] Apply database migration successfully
- [ ] Test full payment (amount = estimated price)
  - [ ] Verify wallet credited
  - [ ] Verify claim marked as fulfilled
  - [ ] Verify buttons disabled
  - [ ] Verify badge displayed
- [ ] Test partial payment (amount < estimated price)
  - [ ] Verify remaining amount displayed
  - [ ] Verify "already paid" message shown
  - [ ] Verify buttons remain active
- [ ] Test multiple partial payments
  - [ ] Verify cumulative amount tracked correctly
  - [ ] Verify auto-fulfillment when total >= price
- [ ] Test overpayment (amount > estimated price)
  - [ ] Verify claim marked as fulfilled
  - [ ] Verify full amount credited to wallet
- [ ] Test on production environment (Paystack integration)
- [ ] Test on localhost (test mode)

## Future Enhancements

### Potential Features:
1. **Payment History**: Show a log of all partial payments made
2. **Payment Breakdown**: Display individual payment transactions
3. **Refund Support**: Handle refunds and adjust `amount_paid` accordingly
4. **Payment Reminders**: Notify spenders about unpaid balances
5. **Group Payments**: Allow multiple spenders to contribute towards one item
6. **Payment Analytics**: Track payment patterns and completion rates

## Files Modified
1. `database/add_amount_paid_to_claims.sql` (new)
2. `src/types/database.d.ts`
3. `src/lib/claimsService.js`
4. `src/components/dashboard/SpenderListCard.jsx`

## Related Documentation
- See `PAYSTACK_SETUP.md` for payment integration details
- See `docs/DEPLOYMENT.md` for deployment procedures
- See `NOTIFICATIONS_SYSTEM_GUIDE.md` for reminder functionality
