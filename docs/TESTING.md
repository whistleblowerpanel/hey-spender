# HeySpender Testing Scenarios

This document outlines the strategy for testing critical paths of the HeySpender application before launch. Since we are in a frontend-only environment, these tests are described as manual procedures or conceptual scripts.

## 1. Claim Race Condition

**Goal:** Ensure that two users attempting to claim the final quantity of an item at the same time results in only one successful claim.

**Underlying Mechanism:** The `claim_item_transaction` PostgreSQL function uses `SELECT ... FOR UPDATE` to lock the `wishlist_items` row during the transaction. This ensures that any concurrent transaction waits for the first one to complete.

**Manual Test Procedure:**

1.  **Setup:**
    *   Create a wishlist item with `qty_total` set to `1` and `qty_claimed` set to `0`.
    *   Open two separate browser windows (or use two different devices/browsers) and navigate to the wishlist page.
2.  **Execution:**
    *   In both windows, open the "Claim Item" modal for the test item.
    *   Fill out the form with two different new user emails.
    *   Attempt to click the "Oya Spender, pick this" button in both windows as simultaneously as possible.
3.  **Expected Outcome:**
    *   One of the claims will proceed to the "Check Your Inbox!" screen.
    *   The second claim attempt will fail with a toast notification showing an error like "Item is already fully claimed" or a similar message from the database transaction.
4.  **Verification:**
    *   Check the `claims` table in Supabase. There should only be one new `pending_verification` claim for the item.
    *   The `wishlist_items` table's `qty_claimed` should **not** be incremented yet (it's only incremented after email verification).

## 2. Webhook Reconciliation & Wallet Updates

**Goal:** Ensure that a successful payment webhook from Paystack credits the recipient's wallet exactly once, even if the webhook is received multiple times.

**Underlying Mechanism:** An `idempotency_keys` table should be used. When a webhook is received, its unique identifier (e.g., `event.id` from Paystack) is checked against this table. If it exists, the event is ignored. If not, the key is inserted, and the logic proceeds.

**Conceptual Webhook Function (`/webhooks/payments`):**

```javascript
// This is a conceptual Supabase Edge Function
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ... (CORS headers, etc.)

const handler = async (req) => {
  const signature = req.headers.get('x-paystack-signature');
  const payload = await req.text();
  const secret = Deno.env.get('VITE_PAYSTACK_WEBHOOK_SECRET');

  // 1. Verify Signature
  const hash = crypto.createHmac('sha512', secret).update(payload).digest('hex');
  if (hash !== signature) {
    return new Response('Invalid signature', { status: 401 });
  }

  const event = JSON.parse(payload);
  const idempotencyKey = event.id; // Paystack event ID

  const supabase = createClient(...);

  // 2. Idempotency Check
  const { data: existingKey, error: keyError } = await supabase
    .from('idempotency_keys')
    .select('key')
    .eq('key', idempotencyKey)
    .single();

  if (existingKey) {
    return new Response('Event already processed', { status: 200 });
  }

  // 3. Process Event (if it's a successful charge)
  if (event.event === 'charge.success') {
    // Insert idempotency key *within the transaction*
    // Begin transaction
    
    // Find contribution record via payment_ref
    // Update contribution status to 'success'
    // Update goal amount_raised
    // Insert into wallet_transactions (credit)
    // Update wallet balance

    // End transaction
  }

  return new Response('Webhook received', { status: 200 });
};
```

**Manual Test Procedure:**

1.  **Setup:** Use a tool like Postman or `curl` to simulate a webhook call to your deployed Supabase Edge Function endpoint.
2.  **Execution:**
    *   Send a valid, signed webhook payload for `charge.success` to your endpoint.
    *   Verify the recipient's wallet is credited and the goal progress is updated.
    *   Immediately send the **exact same webhook payload** again.
3.  **Expected Outcome:**
    *   The first request should return a `200 OK` and update the database.
    *   The second request should return a `200 OK` with a message like "Event already processed" and make **no changes** to the database.

## 3. Payout Lifecycle

**Goal:** Ensure the payout flow (`requested` -> `processing` -> `paid` / `failed`) works correctly and updates the user's wallet balance accurately.

**Manual Test Procedure:**

1.  **Setup:**
    *   A user must have a wallet with a balance (e.g., by simulating a successful contribution).
2.  **Request Payout:**
    *   As the user, navigate to the Wallet tab in the dashboard.
    *   Request a payout for a specific amount.
    *   **Verification:** A new row appears in the `payouts` table with `status: 'requested'`. The user's wallet balance **remains unchanged**. An audit log is created.
3.  **Approve Payout:**
    *   As an admin, navigate to the Admin Dashboard > Payouts tab.
    *   Find the requested payout and click "Approve".
    *   **Verification:** The payout status changes to `processing`. The wallet balance is still unchanged. An audit log is created.
4.  **Mark as Paid:**
    *   As an admin, click "Mark Paid".
    *   **Verification:** The payout status changes to `paid`. A **debit** transaction is created in `wallet_transactions`. The user's wallet `balance` is **decremented** by the payout amount. An audit log is created for the status change and another for the wallet debit.
5.  **Fail Payout (Alternative Path):**
    *   Instead of "Mark Paid", click "Fail".
    *   **Verification:** The payout status changes to `failed`. **No** wallet transaction occurs. The user's balance is unaffected. An audit log is created.

## 4. Reminders & .ICS File

**Goal:** Ensure reminders are based on the `Africa/Lagos` timezone and that generated `.ics` files are valid.

**Cron Job Logic (`send-reminders` Edge Function):**

The key part of the cron job is to fetch the current time *in the correct timezone*.

```javascript
// Inside the Supabase Edge Function
const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
// ... proceed to query for claims with scheduled_purchase_date matching today, today+1, today+7 etc.
```

**Manual Test Procedure:**

1.  **Setup:**
    *   Manually invoke the `send-reminders` function.
    *   Create a `claim` with a `scheduled_purchase_date` set to 7 days from today.
2.  **Execution:**
    *   Run the function. Check the logs to see if it picked up your test claim.
    *   Navigate to the "My Spender List" on the user dashboard.
    *   Click the "Add to Calendar" button for the claimed item.
3.  **Verification:**
    *   An `.ics` file should download.
    *   Open the file with a calendar application (Google Calendar, Outlook, Apple Calendar).
    *   The event should be created on the correct date (the `scheduled_purchase_date`). The event title and description should match the item details.