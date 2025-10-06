// Backfill supporter_user_id on contributions using service role
// Usage: BACKFILL_CONFIRM=yes SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node tools/backfill-contributions.js

import { createClient } from '@supabase/supabase-js';

function die(message, code = 1) {
  console.error(message);
  process.exit(code);
}

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BACKFILL_CONFIRM } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  die('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

if (BACKFILL_CONFIRM !== 'yes') {
  die('Set BACKFILL_CONFIRM=yes to run this script.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchAllUsers() {
  let users = [];
  const limit = 1000;
  let from = 0;
  while (true) {
    const to = from + limit - 1;
    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name')
      .range(from, to);
    if (error) die(`Error fetching users: ${error.message}`);
    if (!data || data.length === 0) break;
    users = users.concat(data);
    if (data.length < limit) break;
    from += limit;
    await sleep(50);
  }
  return users;
}

function buildUserIndex(users) {
  const nameToId = new Map();
  for (const u of users) {
    if (u.full_name) nameToId.set(String(u.full_name).trim().toLowerCase(), u.id);
    if (u.username) {
      const uname = String(u.username).trim();
      nameToId.set(uname.toLowerCase(), u.id);
      nameToId.set(`@${uname}`.toLowerCase(), u.id);
    }
  }
  return nameToId;
}

async function fetchContributionsBatch(offset, limit) {
  const to = offset + limit - 1;
  const { data, error } = await supabase
    .from('contributions')
    .select('id, display_name')
    .is('supporter_user_id', null)
    .eq('is_anonymous', false)
    .eq('status', 'success')
    .order('created_at', { ascending: true })
    .range(offset, to);
  if (error) die(`Error fetching contributions: ${error.message}`);
  return data || [];
}

async function updateSupporterUserId(contributionId, userId) {
  const { error } = await supabase
    .from('contributions')
    .update({ supporter_user_id: userId })
    .eq('id', contributionId);
  if (error) throw new Error(error.message);
}

async function main() {
  console.log('Starting contributions backfill...');
  const users = await fetchAllUsers();
  console.log(`Fetched ${users.length} users`);
  const index = buildUserIndex(users);

  const limit = 1000;
  let offset = 0;
  let totalExamined = 0;
  let totalMatched = 0;
  let batchNum = 0;

  while (true) {
    batchNum += 1;
    const rows = await fetchContributionsBatch(offset, limit);
    if (rows.length === 0) break;
    console.log(`Batch ${batchNum}: examining ${rows.length} contributions (offset=${offset})`);
    offset += rows.length;

    const updates = [];
    for (const row of rows) {
      totalExamined += 1;
      const name = (row.display_name || '').toString().trim().toLowerCase();
      if (!name) continue;
      const userId = index.get(name);
      if (userId) {
        updates.push({ id: row.id, userId });
      }
    }

    // Apply with limited concurrency
    const concurrency = 10;
    let i = 0;
    async function worker() {
      while (i < updates.length) {
        const current = updates[i++];
        try {
          await updateSupporterUserId(current.id, current.userId);
          totalMatched += 1;
        } catch (e) {
          console.warn(`Update failed for contribution ${current.id}: ${e.message}`);
        }
      }
    }
    await Promise.all(Array.from({ length: concurrency }, () => worker()));

    console.log(`Batch ${batchNum}: updated ${updates.length} rows (cumulative matched=${totalMatched})`);
    await sleep(100);
  }

  console.log('Backfill complete.');
  console.log(`Total examined: ${totalExamined}`);
  console.log(`Total matched/updated: ${totalMatched}`);
}

main().catch((e) => die(e.stack || e.message));


