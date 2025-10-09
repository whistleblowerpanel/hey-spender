# Persistence Verification Guide

## How to Verify Status Persists After Page Refresh

This guide will help you verify that the fulfilled status and disabled buttons persist correctly after page refresh.

---

## 🔍 What to Check

### 1. Database-Driven State
The buttons are disabled based on **database state**, not local component state:

```jsx
disabled={claim?.status === 'fulfilled'}
```

This means:
- ✅ Status comes from database via `claimsService.fetchUserClaims()`
- ✅ On page load, fresh data is fetched from database
- ✅ Page refresh will reload the fulfilled status from database
- ✅ Buttons will remain disabled as long as database has `status = 'fulfilled'`

---

## 🧪 Testing Steps

### Test 1: Full Payment → Refresh
1. Navigate to Spender List page
2. Click "Send Cash" on a claim
3. Send the full estimated amount (e.g., ₦10,000)
4. Complete payment
5. **Observe:**
   - ✅ Toast: "Payment successful! ₦10,000 sent! Item marked as fulfilled."
   - ✅ Green "Fulfilled" badge appears
   - ✅ All buttons show "Completed" and are disabled
   - ✅ Price shows "₦10,000 (Paid)" in green

6. **Hard refresh the page** (Cmd+Shift+R or Ctrl+Shift+R)
7. **Verify:**
   - ✅ "Fulfilled" badge still visible
   - ✅ All buttons still show "Completed" and are disabled
   - ✅ Price still shows "(Paid)" in green

### Test 2: Partial Payment → Refresh
1. Navigate to Spender List page
2. Click "Send Cash" on a claim (est. ₦10,000)
3. Send partial amount (e.g., ₦3,000)
4. Complete payment
5. **Observe:**
   - ✅ Toast: "Payment successful! ₦3,000 sent! ₦7,000 remaining."
   - ✅ Price shows "₦7,000" with "₦3,000 already paid"
   - ✅ All buttons remain active

6. **Hard refresh the page**
7. **Verify:**
   - ✅ Price still shows "₦7,000" remaining
   - ✅ "₦3,000 already paid" message still visible
   - ✅ All buttons still active

8. Send another payment (e.g., ₦7,000 to complete)
9. **Observe:**
   - ✅ Automatically marks as fulfilled
   - ✅ Buttons become disabled

10. **Hard refresh the page**
11. **Verify:**
    - ✅ Status remains fulfilled
    - ✅ Buttons remain disabled

### Test 3: Close Tab → Reopen → Navigate Back
1. Mark a claim as fulfilled (send full payment)
2. Verify buttons are disabled
3. **Close the entire browser tab**
4. **Open a new tab** and navigate to the app
5. **Log in** (if needed)
6. **Navigate to Spender List page**
7. **Verify:**
   - ✅ Previously fulfilled claim still shows fulfilled badge
   - ✅ Buttons are still disabled

---

## 🔬 Browser Console Verification

Open your browser console (F12) and look for these log messages to verify the flow:

### On Page Load/Refresh:
```
🔍 [claimsService] Fetching claims for user: <user_id>
✅ [claimsService] Fetched X claims from database
📊 [claimsService] Fulfilled claims: Y
```
This confirms data is being fetched from the database.

### On Payment Success:
```
🎉 Payment successful, processing...
✅ Wallet credited successfully
💰 Payment amounts: { currentAmountPaid: 0, newPayment: 10000, newAmountPaid: 10000, estimatedPrice: 10000 }
🔧 Updating claim in database... { claimId: "...", amount_paid: 10000, status: "fulfilled", shouldBeFulfilled: true }
🔧 [claimsService] Updating claim: { claimId: "...", updates: { amount_paid: 10000, status: "fulfilled" } }
✅ [claimsService] Claim updated successfully in database: { claimId: "...", status: "fulfilled", amount_paid: 10000, updated_at: "..." }
✅ Claim updated in database - status persisted
```
This confirms the claim is being saved to the database with fulfilled status.

### After Database Update (Auto-refresh):
```
🔍 [claimsService] Fetching claims for user: <user_id>
✅ [claimsService] Fetched X claims from database
📊 [claimsService] Fulfilled claims: Y (should increase by 1)
```
This confirms the UI is refreshing with the updated data from the database.

---

## 🗄️ Database Verification

### Check Supabase Dashboard
1. Go to your Supabase project
2. Navigate to **Table Editor**
3. Select the **claims** table
4. Find your test claim
5. **Verify columns:**
   - ✅ `status` = `fulfilled`
   - ✅ `amount_paid` = the total amount you sent
   - ✅ `updated_at` = recent timestamp

### SQL Query to Verify
Run this in your Supabase SQL Editor:

```sql
SELECT 
  id,
  status,
  amount_paid,
  updated_at,
  wishlist_item_id
FROM claims
WHERE status = 'fulfilled'
ORDER BY updated_at DESC
LIMIT 10;
```

This will show your recently fulfilled claims with their `amount_paid` values.

---

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Sends Payment                                       │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. handlePaymentSuccess()                                   │
│    - Calculate newAmountPaid                                │
│    - Determine shouldBeFulfilled                            │
│    - Call onUpdateClaim(claimId, {                         │
│        amount_paid: newAmountPaid,                         │
│        status: 'fulfilled'                                  │
│      })                                                     │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. handleClaimUpdate() in MyWishlistV2Page                  │
│    - Calls claimsService.updateClaim()                     │
│    - Waits for database update                              │
│    - Calls fetchClaimsData() to refresh                    │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. claimsService.updateClaim()                              │
│    - Updates Supabase database                              │
│    - Returns updated claim data                             │
│    - Database now has: status='fulfilled',                  │
│      amount_paid=X                                          │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. fetchClaimsData()                                        │
│    - Fetches fresh data from database                       │
│    - Updates React state with new data                      │
│    - Component re-renders                                   │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. SpenderListCard Re-renders                               │
│    - claim.status === 'fulfilled' (from database)           │
│    - Buttons disabled={true}                                │
│    - Shows "Fulfilled" badge                                │
└─────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│ ON PAGE REFRESH (Hard Reload)                               │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. useEffect() Runs in MyWishlistV2Page                     │
│    - Triggers fetchClaimsData()                             │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. claimsService.fetchUserClaims()                          │
│    - Queries Supabase database                              │
│    - Gets claims with status='fulfilled'                    │
│    - Gets claims with amount_paid values                    │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. React State Updated                                      │
│    - setClaims(data from database)                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. SpenderListCard Renders                                  │
│    - claim.status === 'fulfilled' (persisted from DB)       │
│    - Buttons disabled={true}                                │
│    - Shows "Fulfilled" badge                                │
│    - State maintained after refresh! ✅                     │
└─────────────────────────────────────────────────────────────┘
```

---

## ❌ Troubleshooting

### Issue: Buttons become active again after refresh

**Check 1: Database Migration Applied?**
```sql
-- Run this in Supabase SQL Editor
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'claims' 
AND column_name = 'amount_paid';
```
If this returns no rows, the migration hasn't been applied yet.

**Check 2: Database Values**
```sql
-- Check if status is actually 'fulfilled' in database
SELECT id, status, amount_paid 
FROM claims 
WHERE id = 'YOUR_CLAIM_ID';
```

**Check 3: Console Logs**
Look for these in browser console:
- `✅ [claimsService] Claim updated successfully in database`
- `✅ [claimsService] Fetched X claims from database`

If you don't see these, the updates might not be reaching the database.

### Issue: Partial payments not showing remaining amount

**Check 1: amount_paid field**
```sql
SELECT id, amount_paid, wishlist_item_id
FROM claims
WHERE id = 'YOUR_CLAIM_ID';
```
Verify `amount_paid` has the correct cumulative value.

**Check 2: Item estimated price**
```sql
SELECT id, unit_price_estimate
FROM wishlist_items
WHERE id = 'YOUR_ITEM_ID';
```
Verify the item has an `unit_price_estimate` set.

---

## ✅ Success Criteria

Your implementation is working correctly if:

1. ✅ After sending full payment, buttons are disabled
2. ✅ After hard page refresh, buttons remain disabled
3. ✅ "Fulfilled" badge persists after refresh
4. ✅ Browser console shows database updates
5. ✅ Supabase database shows correct `status` and `amount_paid` values
6. ✅ Partial payments show cumulative total and remaining amount
7. ✅ Multiple partial payments eventually mark as fulfilled automatically
8. ✅ Fulfilled status persists across browser sessions

---

## 📝 Summary

**Why it persists:**
- Button state is determined by `claim.status` from the **database**
- Not from local component state or localStorage
- Every page load fetches fresh data from Supabase
- The fulfillment status is a database row update, not a frontend-only change

**The flow:**
Payment → Database Update → Fetch Fresh Data → Render with Database State

This ensures the status will **always** persist, even after:
- Hard refresh
- Closing and reopening browser
- Different devices
- Clearing browser cache
