# Spender List Card - UI Examples

This document shows visual examples of how the Spender List card appears in different states.

## State 1: No Payment Yet (Default)

```
┌─────────────────────────────────────┐
│         [Item Image]                │
│                                     │
├─────────────────────────────────────┤
│ Item Name                           │
│                                     │
│ Est. Price — ₦10,000                │
│                                     │
│ ┌──────────────┐ ┌──────────────┐  │
│ │ Send Cash    │ │ Purchase     │  │
│ └──────────────┘ └──────────────┘  │
│                                     │
│ ┌──────────────┐ ┌──────────────┐  │
│ │ Reminder     │ │ Calendar     │  │
│ └──────────────┘ └──────────────┘  │
│                                     │
│ For: @username                      │
└─────────────────────────────────────┘
```

**Behavior:**
- All buttons are active and clickable
- Shows full estimated price
- No payment history displayed

---

## State 2: Partial Payment Made

```
┌─────────────────────────────────────┐
│         [Item Image]                │
│                                     │
├─────────────────────────────────────┤
│ Item Name                           │
│                                     │
│ Est. Price — ₦7,000                 │
│ ₦3,000 already paid ✓               │
│                                     │
│ ┌──────────────┐ ┌──────────────┐  │
│ │ Send Cash    │ │ Purchase     │  │
│ └──────────────┘ └──────────────┘  │
│                                     │
│ ┌──────────────┐ ┌──────────────┐  │
│ │ Reminder     │ │ Calendar     │  │
│ └──────────────┘ └──────────────┘  │
│                                     │
│ For: @username                      │
└─────────────────────────────────────┘
```

**Behavior:**
- Shows remaining amount (₦7,000) instead of full price
- Displays amount already paid (₦3,000) in green
- All buttons remain active for additional payments
- Can send multiple partial payments until full amount is reached

**Example Payment Flow:**
1. Original price: ₦10,000
2. First payment: ₦3,000 → Shows "₦7,000 remaining, ₦3,000 already paid"
3. Second payment: ₦4,000 → Shows "₦3,000 remaining, ₦7,000 already paid"
4. Final payment: ₦3,000 → Automatically marks as fulfilled

---

## State 3: Fully Paid / Fulfilled

```
┌─────────────────────────────────────┐
│         [Item Image]                │
│                                     │
├─────────────────────────────────────┤
│ Item Name                           │
│                                     │
│ ┌─────────────────┐                 │
│ │ ✓ Fulfilled     │ (green badge)  │
│ └─────────────────┘                 │
│                                     │
│ Est. Price — ₦10,000 (Paid)         │
│                                     │
│ ┌──────────────┐ ┌──────────────┐  │
│ │ Completed    │ │ Completed    │  │ (disabled)
│ └──────────────┘ └──────────────┘  │
│                                     │
│ ┌──────────────┐ ┌──────────────┐  │
│ │ Completed    │ │ Completed    │  │ (disabled)
│ └──────────────┘ └──────────────┘  │
│                                     │
│ For: @username                      │
└─────────────────────────────────────┘
```

**Behavior:**
- Green "✓ Fulfilled" badge displayed prominently
- Shows "(Paid)" indicator next to price in green
- All buttons are disabled and show "Completed"
- User cannot take any further actions on this claim

---

## Payment Toast Messages

### Full Payment
```
✓ Payment successful!
₦10,000 sent! Item marked as fulfilled.
```

### Partial Payment
```
✓ Payment successful!
₦3,000 sent! ₦7,000 remaining.
```

### Overpayment (sends more than estimated)
```
✓ Payment successful!
₦12,000 sent! Item marked as fulfilled.
```
*Note: The full ₦12,000 is credited to the recipient's wallet*

---

## Color Coding

### Status Colors:
- **Green**: Fulfilled status, "already paid" amounts, success indicators
- **Purple/Brand Color**: Est. Price (when not fulfilled), primary actions
- **Gray**: Disabled buttons, metadata text
- **Orange**: Secondary actions (Purchase button)

### Button States:
- **Active** (default colors): User can interact
- **Disabled** (grayed out): Shows "Completed" text, not clickable

---

## Behind the Scenes

When a spender clicks "Send Cash" and completes payment:

1. **Payment Dialog Opens**
   ```
   ┌─────────────────────────────────┐
   │ Send Cash                       │
   │                                 │
   │ Send money to @username for     │
   │ "Item Name"                     │
   │                                 │
   │ Amount (₦)                      │
   │ ┌─────────────────────────────┐ │
   │ │ 5000                        │ │
   │ └─────────────────────────────┘ │
   │                                 │
   │ [Cancel]  [Send Cash]           │
   └─────────────────────────────────┘
   ```

2. **Paystack Payment Processing**
   - Spender completes payment via Paystack
   - System credits recipient's wallet
   - System updates `amount_paid` in database

3. **Automatic Status Update**
   - If `amount_paid >= estimated_price`: Mark as "fulfilled"
   - If `amount_paid < estimated_price`: Keep as current status
   - Update UI immediately to reflect new state

4. **UI Refresh**
   - Card updates to show new state
   - Toast notification confirms payment
   - If fulfilled, buttons become disabled

---

## Technical Implementation

### Database Field:
- Table: `claims`
- Field: `amount_paid` (DECIMAL(10, 2))
- Default: 0

### Logic:
```javascript
// Calculate remaining amount
const estimatedPrice = item.unit_price_estimate;
const amountPaid = claim.amount_paid || 0;
const remainingAmount = estimatedPrice - amountPaid;

// Determine status
if (remainingAmount <= 0) {
  // Show as fully paid/fulfilled
  status = 'fulfilled';
  disableButtons = true;
} else if (amountPaid > 0) {
  // Show partial payment progress
  showRemainingAmount = true;
  showAlreadyPaid = true;
} else {
  // Show default state
  showFullPrice = true;
}
```

### Auto-Fulfillment:
- Triggered when: `newAmountPaid >= estimatedPrice`
- Updates: Both `amount_paid` field AND `status` field
- Immediate: Happens in the same transaction as payment success

---

## Mobile Responsive

All states are fully responsive and work on:
- ✅ Desktop (full layout)
- ✅ Tablet (2-column grid)
- ✅ Mobile (single column, stacked buttons)

The "Fulfilled" badge and payment status are clearly visible on all screen sizes.
