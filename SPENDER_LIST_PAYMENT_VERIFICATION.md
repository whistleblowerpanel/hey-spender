# Spender List Payment Tracking - Production Verification Checklist

## Critical Issue Fixed
**Problem**: The component was using singular `wishlist.user` instead of plural `wishlists.users` to match the database query structure.

**Solution**: All references updated from:
- `item.wishlist` → `item.wishlists`
- `item.wishlist.user` → `item.wishlists.users`

---

## Pre-Deployment Checklist

### 1. Database Migration ✓
Ensure the `amount_paid` column exists in the `claims` table:

```sql
-- Run this in your Supabase SQL editor
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'claims' 
AND column_name = 'amount_paid';
```

**Expected Result**: Should show `amount_paid` as DECIMAL(10,2) with default 0

**If missing**, run the migration:
```sql
-- From database/add_amount_paid_to_claims.sql
ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2) DEFAULT 0;

COMMENT ON COLUMN claims.amount_paid IS 'Total amount paid by the spender towards this claim';

UPDATE claims SET amount_paid = 0 WHERE amount_paid IS NULL;
```

### 2. Verify Data Structure
Check that claims are fetched with the correct nested structure:

```sql
-- Test query structure
SELECT 
  c.id,
  c.amount_paid,
  c.status,
  wi.name,
  wi.unit_price_estimate,
  w.slug,
  u.username
FROM claims c
LEFT JOIN wishlist_items wi ON c.wishlist_item_id = wi.id
LEFT JOIN wishlists w ON wi.wishlist_id = w.id
LEFT JOIN users u ON w.user_id = u.id
WHERE c.supporter_user_id = 'YOUR_USER_ID'
LIMIT 5;
```

### 3. Component Props Verification
Ensure `SpenderListPage.jsx` passes the correct props:

```javascript
<SpenderListCard
  key={claim.id}
  claim={claim}              // ✓ Pass entire claim object
  onUpdateClaim={handleClaimUpdate}  // ✓ Function to update claim
  onDelete={handleClaimDelete}       // ✓ Function to delete claim
/>
```

---

## Testing in Production

### Test Case 1: No Payment (New Claim)
**Expected**:
- ✅ All buttons are **enabled** and colored
- ✅ No payment progress box shown
- ✅ Cash amount defaults to full item price

### Test Case 2: Partial Payment
**Scenario**: Item costs ₦10,000, user sends ₦5,000

**Expected**:
- ✅ All buttons remain **enabled** and colored
- ✅ Payment progress box shows:
  - "Paid: ₦5,000" (green)
  - "Balance: ₦5,000" (orange)
- ✅ Cash amount defaults to remaining balance (₦5,000)
- ✅ Toast shows: "₦5,000 sent! Balance: ₦5,000"

### Test Case 3: Full Payment
**Scenario**: Item costs ₦10,000, total paid reaches ₦10,000+

**Expected**:
- ✅ All buttons are **disabled** and turn grey
- ✅ Button text changes to "Fully Paid"
- ✅ Payment progress box shows:
  - "Paid: ₦10,000" (green)
  - "✓ Fully Paid" (green, centered)
- ✅ Toast shows: "₦10,000 sent! Item fully paid."
- ✅ Claim status automatically updates to "fulfilled"

---

## Debugging in Production

### 1. Check Browser Console
Look for these logs when viewing Spender List:

```
💳 SpenderListCard - Payment tracking: {
  claimId: "...",
  itemName: "...",
  amountPaid: 0,      // Should show the cumulative amount
  itemPrice: 10000,   // Item price
  remainingBalance: 10000,  // itemPrice - amountPaid
  isFullyPaid: false  // true when amountPaid >= itemPrice
}
```

### 2. Verify Database After Payment
After making a payment, check if the database was updated:

```sql
SELECT 
  id,
  amount_paid,
  status,
  updated_at
FROM claims 
WHERE id = 'YOUR_CLAIM_ID';
```

**Should show**:
- `amount_paid` = cumulative total paid
- `status` = "fulfilled" if fully paid, or original status if partial
- `updated_at` = recent timestamp

### 3. Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Buttons don't disable | `amount_paid` not updating | Check `onUpdateClaim` function in SpenderListPage |
| "Unknown" user shows | Wrong data structure | Verify using `wishlists.users` (plural) not `wishlist.user` |
| Balance doesn't update | Data not refreshing | Check that SpenderListPage refetches claims after update |
| Amount resets on refresh | Database not updating | Verify claimsService.updateClaim() is called |

---

## Code Changes Summary

### Files Modified:
1. `/src/components/SpenderListCard.jsx`
   - Changed all `item.wishlist` → `item.wishlists`
   - Changed all `item.wishlist.user` → `item.wishlists.users`
   - Added payment tracking logic
   - Updated button states based on `isFullyPaid`
   - Added payment progress display

2. `/src/pages/dashboard/SpenderListPage.jsx`
   - Already correctly passing `claim` object
   - Already has `onUpdateClaim` handler

3. `/src/lib/claimsService.js`
   - Already has `amount_paid` support
   - Already has `updateClaim()` function

---

## Quick Verification Command

Run this in browser console when on Spender List page:

```javascript
// Check if data structure is correct
console.log('First claim:', claims[0]);
console.log('Nested structure:', {
  item: claims[0]?.wishlist_items,
  wishlist: claims[0]?.wishlist_items?.wishlists,
  user: claims[0]?.wishlist_items?.wishlists?.users,
  amountPaid: claims[0]?.amount_paid
});
```

---

## Deployment Steps

1. ✓ Ensure database migration is run
2. ✓ Deploy updated code to production
3. ✓ Clear browser cache (Cmd+Shift+R or Ctrl+Shift+F5)
4. ✓ Test with a small amount first (e.g., ₦100)
5. ✓ Verify database updates after payment
6. ✓ Test button disable on full payment

---

## Contact Points

If issues persist in production:
1. Check browser console for the `💳 SpenderListCard - Payment tracking` logs
2. Verify database has `amount_paid` column
3. Confirm the nested data structure matches (plural: `wishlists.users`)
4. Test the `onUpdateClaim` callback function

