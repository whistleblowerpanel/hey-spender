/**
 * Backfill script to sync wallet_transactions to claims.amount_paid
 * 
 * This script:
 * 1. Finds all wallet transactions with source='cash_payment'
 * 2. Attempts to match them to claims based on description patterns
 * 3. Updates the amount_paid field in claims table
 * 4. Links transactions to claims via claim_id
 * 
 * Run this after adding the claim_id column to wallet_transactions
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Try both prefixed and non-prefixed env variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  console.error('   Looking for: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  console.error('   Or: SUPABASE_URL and SUPABASE_ANON_KEY');
  console.error('\n📝 Your .env file should contain:');
  console.error('   VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.error('   VITE_SUPABASE_ANON_KEY=your-anon-key-here');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backfillClaimPayments() {
  console.log('🔄 Starting backfill process...\n');

  try {
    // Step 1: Get all cash payment transactions
    console.log('📊 Fetching wallet transactions...');
    const { data: transactions, error: txError } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('type', 'credit')
      .eq('source', 'cash_payment')
      .order('created_at', { ascending: true });

    if (txError) throw txError;

    console.log(`✅ Found ${transactions.length} cash payment transactions\n`);

    // Step 2: Get all claims with their item details
    console.log('📊 Fetching claims...');
    const { data: claims, error: claimsError } = await supabase
      .from('claims')
      .select(`
        id,
        supporter_user_id,
        amount_paid,
        status,
        wishlist_items!inner(
          id,
          name,
          unit_price_estimate,
          wishlists!inner(
            user_id,
            users!inner(id)
          )
        )
      `);

    if (claimsError) throw claimsError;

    console.log(`✅ Found ${claims.length} claims\n`);

    // Step 3: Match transactions to claims and update
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const transaction of transactions) {
      // Extract item name from description: "Cash payment for "ITEM NAME" - Ref: xxx"
      const match = transaction.description?.match(/Cash payment for "(.+?)" - Ref:/);
      const itemName = match?.[1];

      if (!itemName) {
        console.log(`⚠️  Skipping transaction ${transaction.id} - no item name found`);
        skipped++;
        continue;
      }

      // Find matching claim
      // Need to match: item name AND recipient wallet
      // Get wallet owner for this transaction
      const { data: wallet } = await supabase
        .from('wallets')
        .select('user_id')
        .eq('id', transaction.wallet_id)
        .single();

      if (!wallet) {
        console.log(`⚠️  Skipping transaction ${transaction.id} - wallet not found`);
        skipped++;
        continue;
      }

      // Find claim that matches: item name and recipient
      const matchingClaim = claims.find(c => 
        c.wishlist_items?.name === itemName &&
        c.wishlist_items?.wishlists?.user_id === wallet.user_id
      );

      if (!matchingClaim) {
        console.log(`⚠️  No matching claim for "${itemName}" to user ${wallet.user_id}`);
        skipped++;
        continue;
      }

      // Calculate new amount_paid
      const currentAmountPaid = parseFloat(matchingClaim.amount_paid) || 0;
      const transactionAmount = parseFloat(transaction.amount);
      const newAmountPaid = currentAmountPaid + transactionAmount;
      const itemPrice = parseFloat(matchingClaim.wishlist_items.unit_price_estimate) || 0;
      const shouldBeFulfilled = itemPrice > 0 && newAmountPaid >= itemPrice;

      console.log(`💰 Updating claim ${matchingClaim.id}:`);
      console.log(`   Item: "${itemName}"`);
      console.log(`   Current paid: ₦${currentAmountPaid}`);
      console.log(`   Adding: ₦${transactionAmount}`);
      console.log(`   New total: ₦${newAmountPaid}`);
      console.log(`   Item price: ₦${itemPrice}`);
      console.log(`   Payment status: ${shouldBeFulfilled ? 'FULLY PAID' : 'PARTIAL'}`);

      // Update claim - only update amount_paid, NOT status
      // The UI will handle button disabling based on amount_paid >= item_price
      const { error: updateError } = await supabase
        .from('claims')
        .update({
          amount_paid: newAmountPaid,
          updated_at: new Date().toISOString()
        })
        .eq('id', matchingClaim.id);

      if (updateError) {
        console.log(`   ❌ Error: ${updateError.message}\n`);
        errors++;
        continue;
      }

      // Link transaction to claim
      const { error: linkError } = await supabase
        .from('wallet_transactions')
        .update({ claim_id: matchingClaim.id })
        .eq('id', transaction.id);

      if (linkError) {
        console.log(`   ⚠️  Claim updated but couldn't link transaction: ${linkError.message}`);
      }

      console.log(`   ✅ Updated!\n`);
      updated++;
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 BACKFILL SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Updated: ${updated} claims`);
    console.log(`⚠️  Skipped: ${skipped} transactions`);
    console.log(`❌ Errors: ${errors} transactions`);
    console.log('='.repeat(50) + '\n');

    if (updated > 0) {
      console.log('🎉 Backfill completed successfully!');
      console.log('   Refresh your Spender List page to see the changes.\n');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the backfill
backfillClaimPayments();

