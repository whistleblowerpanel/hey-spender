import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from './SupabaseAuthContext';

const WalletContext = createContext();

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWalletData = useCallback(async () => {
    if (!user) {
        setWallet(null);
        setTransactions([]);
        setLoading(false);
        return;
    };
    
    setLoading(true);
    try {
      // Backfill: ensure past contributions made by this user are linked via supporter_user_id
      // Heuristic: non-anonymous rows where display_name matches user's known identifiers
      const backfillDisplayNames = [];
      const userFullName = user?.user_metadata?.full_name;
      const userUsername = user?.user_metadata?.username;
      if (userFullName) backfillDisplayNames.push(String(userFullName).trim());
      if (userUsername) backfillDisplayNames.push(String(userUsername).trim());
      if (userUsername) backfillDisplayNames.push(`@${String(userUsername).trim()}`);
      if (backfillDisplayNames.length > 0) {
        try {
          // Try to update supporter_user_id, but gracefully handle if column doesn't exist
          const updatePromises = backfillDisplayNames.map(async (name) => {
            const { error } = await supabase
              .from('contributions')
              .update({ supporter_user_id: user.id })
              .eq('status', 'success')
              .is('supporter_user_id', null)
              .eq('is_anonymous', false)
              .eq('display_name', name);
            
            // If the error is about missing column, just log and continue
            if (error && /supporter_user_id/.test(error.message || '')) {
              console.log('supporter_user_id column not found, skipping backfill for:', name);
              return;
            }
            
            if (error) {
              console.warn('Backfill update failed for:', name, error.message);
            }
          });
          
          await Promise.all(updatePromises);
        } catch (e) {
          console.warn('Contribution backfill skipped:', e);
        }
      }

      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (walletError && walletError.code !== 'PGRST116') { // Ignore 'exact one row' error for new users
        console.error("Error fetching wallet:", walletError);
        setWallet(null);
      } else {
      setWallet(walletData);
      // Personalize contributions strictly to this user's goals via explicit goal_id filtering
      // Step 1: fetch goal IDs for wishlists owned by current user
      const { data: myGoals, error: goalsError } = await supabase
        .from('goals')
        .select(`id, wishlist:wishlists!inner(user_id)`) 
        .eq('wishlist.user_id', user.id);
      const myGoalIds = (myGoals || []).map(g => g.id);
      // Step 2: fetch contributions for only those goal IDs
      const contributionsPromise = (myGoalIds.length > 0)
        ? supabase
          .from('contributions')
          .select(`
            *,
            goal:goals(
              id,
              title,
              wishlist:wishlists!inner(
                id,
                user_id,
                title
              )
            )
          `)
          .eq('status', 'success')
          .in('goal_id', myGoalIds)
          .order('created_at', { ascending: false })
        : Promise.resolve({ data: [], error: null });

      // Prepare fetch for contributions SENT by this user strictly via supporter_user_id
      const myFullName = user?.user_metadata?.full_name;
      const myUsername = user?.user_metadata?.username;

      const fetchContributionsSent = async () => {
        // Try supporter_user_id path first
        const res = await supabase
          .from('contributions')
          .select(`
            *,
            goal:goals(
              id,
              title,
              wishlist:wishlists!inner(
                id,
                user:users!inner(username)
              )
            )
          `)
          .eq('status', 'success')
          .eq('supporter_user_id', user.id)
          .order('created_at', { ascending: false });
        
        // If the query failed because the column does not exist, fallback to name-based search
        if (res.error && /supporter_user_id/.test(res.error.message || '')) {
          console.log('supporter_user_id column not found, falling back to name-based search');
          // Fallback to name-based search for contributions sent by this user
          const myFullName = user?.user_metadata?.full_name;
          const myUsername = user?.user_metadata?.username;
          const displayNames = [];
          if (myFullName) displayNames.push(myFullName);
          if (myUsername) displayNames.push(myUsername);
          if (myUsername) displayNames.push(`@${myUsername}`);
          
          if (displayNames.length === 0) {
            return { data: [], error: null };
          }
          
          return await supabase
            .from('contributions')
            .select(`
              *,
              goal:goals(
                id,
                title,
                wishlist:wishlists!inner(
                  id,
                  user:users!inner(username)
                )
              )
            `)
            .eq('status', 'success')
            .in('display_name', displayNames)
            .order('created_at', { ascending: false });
        }
        return res;
      };

      const contributionsSentPromise = fetchContributionsSent();

      const walletTxPromise = walletData
        ? supabase
          .from('wallet_transactions')
          .select('*')
          .eq('wallet_id', walletData.id)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [], error: null });

      // Also fetch recent claims against this user's wishlist items to infer sender usernames for cash payments
      const claimsPromise = supabase
        .from('claims')
        .select(`
          id,
          created_at,
          supporter_user_id,
          wishlist_item:wishlist_items(
            name,
            unit_price_estimate,
            wishlist:wishlists(
              user_id
            )
          ),
          supporter:users(
            username
          )
        `)
        .eq('status', 'confirmed')
        .eq('wishlist_item.wishlist.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500);

      // Claims made BY the current user (used to build Sent history for item payments)
      const claimsByMePromise = supabase
        .from('claims')
        .select(`
          id,
          created_at,
          supporter_user_id,
          supporter_contact,
          wishlist_item:wishlist_items(
            name,
            unit_price_estimate,
            wishlist:wishlists(
              id,
              user:users!inner(username)
            )
          )
        `)
        .eq('status', 'confirmed')
        .or(`supporter_user_id.eq.${user.id},supporter_contact.eq.${user.email}`)
        .order('created_at', { ascending: false })
        .limit(500);

      const [walletTxRes, contribRes, claimsRes, contribSentRes, claimsByMeRes] = await Promise.all([walletTxPromise, contributionsPromise, claimsPromise, contributionsSentPromise, claimsByMePromise]);


      if (walletTxRes.error) {
        console.error("Error fetching transactions:", walletTxRes.error);
      }

      if (contribRes.error) {
        console.error("Error fetching contributions:", contribRes.error);
      }

      const walletTransactions = (walletTxRes.data || []).map((t) => {
        const tx = { ...t };
        const rawDesc = typeof tx.description === 'string' ? tx.description : '';

        // Strip any ref: or ref# segments from description for display purposes
        const cleanedDesc = rawDesc
          .replace(/\s*[\-–—]*\s*ref[:#]\s*[^)\]]+/i, '') // strip ref
          .replace(/^\s*cash\s*payment\s*for\s*/i, '') // remove leading 'Cash payment for'
          .trim();
        tx.description = cleanedDesc;

        // Try to infer wishlist purchase details
        const lower = (tx.source || '').toLowerCase() + ' ' + cleanedDesc.toLowerCase();
        const looksLikeWishlist = lower.includes('wishlist') || lower.includes('item') || lower.includes('purchase') || lower.includes('gift') || cleanedDesc.length > 0;

        if (looksLikeWishlist) {
          // Extract title: prefer quoted after "for \"Title\"" or "for 'Title'", else words after 'for'
          let extractedTitle = null;
          let m = cleanedDesc.match(/for\s+["""]([^"""]+)["""]/i) || cleanedDesc.match(/for\s+'([^']+)'/i);
          if (m && m[1]) {
            extractedTitle = m[1];
          } else if (/^(cash\s*payment\s*for\s*)/i.test(rawDesc)) {
            // If original began with Cash payment for, treat the remainder as title
            extractedTitle = rawDesc.replace(/^(cash\s*payment\s*for\s*)/i, '').trim();
          } else if (cleanedDesc) {
            // If we only have a plain string like 'Get Me Paris', use it as title
            extractedTitle = cleanedDesc;
        } else {
            const m2 = cleanedDesc.match(/for\s+([^\-()]+?)(?:\s+from|$)/i);
            if (m2 && m2[1]) extractedTitle = m2[1].trim();
          }

          if (extractedTitle) {
            // Remove any trailing ref fragment just in case
            extractedTitle = extractedTitle.replace(/\s*ref[:#].*$/i, '').trim();
            // Remove leading 'Cash payment for'
            extractedTitle = extractedTitle.replace(/^cash\s*payment\s*for\s*/i, '').trim();
            // Strip wrapping quotes and trailing hyphen for normalization
            extractedTitle = extractedTitle.replace(/^"(.+)"$/, '$1').replace(/^'(.*)'$/, '$1').replace(/\s*-\s*$/, '').trim();
            tx.title = tx.title || extractedTitle;
          }

          // Extract depositor name after 'from'
          let depositor = null;
          // Support patterns: "from username", "from @username", "from First Last (@username)"
          let fromMatch = cleanedDesc.match(/from\s+@?([A-Za-z0-9_.-]+)/i);
          if (!fromMatch) {
            // Try name then handle parentheses username
            const fullMatch = cleanedDesc.match(/from\s+([^\-()]+)(?:\s*\((@?[A-Za-z0-9_.-]+)\))?/i);
            if (fullMatch) {
              fromMatch = [fullMatch[0], (fullMatch[2] || fullMatch[1]).trim()];
            }
          }
          if (fromMatch && fromMatch[1]) {
            depositor = fromMatch[1].trim().replace(/^@/, '');
            depositor = depositor.split('(')[0].split(' - ')[0].trim();
          }
          if (depositor) {
            tx.contributor_name = tx.contributor_name || depositor;
          }

          // Normalize source label if missing
          if (!tx.source) {
            tx.source = 'wishlist_purchase';
          }
        }

        return tx;
      });

      // Prepare username enrichment for contributions: map display_name/full_name -> username
      const contribRows = contribRes.data || [];
      const rawNames = Array.from(new Set(
        contribRows
          .filter(c => !c.is_anonymous && !!c.display_name)
          .map(c => String(c.display_name))
      ));
      // Normalize potential @username format to username only for lookup
      const normalizedNames = rawNames.map(n => n.replace(/^@/, '').trim());
      let fullNameToUsername = new Map();
      if (normalizedNames.length > 0) {
        const { data: usersByFullName } = await supabase
          .from('users')
          .select('full_name, username')
          .in('full_name', normalizedNames);
        const { data: usersByUsername } = await supabase
          .from('users')
          .select('full_name, username')
          .in('username', normalizedNames);
        const all = [...(usersByFullName || []), ...(usersByUsername || [])];
        fullNameToUsername = new Map(all.map(u => [u.full_name, u.username]));
        // Also allow direct username echo: if a name already equals a username
        for (const u of all) {
          fullNameToUsername.set(u.username, u.username);
        }
      }

      // Build a quick lookup from supporter_user_id -> username via a single users fetch (fallback if inline is missing)
      const claimsRows = claimsRes?.data || [];
      const supporterIds = Array.from(new Set(claimsRows.map(r => r.supporter_user_id).filter(Boolean)));
      let idToUsername = new Map();
      if (supporterIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, username')
          .in('id', supporterIds);
        if (!usersError && usersData) {
          idToUsername = new Map(usersData.map(u => [u.id, u.username]));
        }
      }
      // Build lookup from normalized item name -> array of {username, created_at}
      const normalizeTitle = (s) => (s || '')
        .toString()
        .replace(/[""]/g, '"')
        .replace(/['']/g, "'")
        .trim()
        .replace(/^"(.+)"/,'$1')
        .replace(/^'(.*)'$/,'$1')
        .replace(/\s*-\s*$/,'')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
      const itemNameToSenders = new Map();
      for (const row of claimsRows) {
        const itemName = row?.wishlist_item?.name;
        const username = row?.supporter?.username || idToUsername.get(row?.supporter_user_id);
        const key = normalizeTitle(itemName);
        if (key && username) {
          const list = itemNameToSenders.get(key) || [];
          list.push({ username, created_at: row.created_at });
          itemNameToSenders.set(key, list);
        }
      }
      const contributions = (contribRows || []).map((c) => {
        let nameOut = 'Unknown';
        
        if (c.is_anonymous) {
          nameOut = 'Anonymous';
        } else {
          // Try to get username from supporter_user_id first (if field exists)
          if (c.supporter_user_id) {
            const usernameFromId = idToUsername.get(c.supporter_user_id);
            if (usernameFromId) {
              nameOut = usernameFromId;
            }
          }
          
          // If still unknown, try full name lookup
          if (nameOut === 'Unknown' && c.display_name) {
            const preferredUsername = fullNameToUsername.get(c.display_name) || fullNameToUsername.get(String(c.display_name).replace(/^@/, '').trim());
            if (preferredUsername) {
              nameOut = preferredUsername;
            } else {
              // If display_name looks like a username (no spaces, starts with letter), use it directly
              const displayName = String(c.display_name).trim();
              if (displayName && /^[a-zA-Z][a-zA-Z0-9_.-]*$/.test(displayName)) {
                nameOut = displayName;
              } else {
                // Last resort: use display_name but prefix with @ to indicate it's a display name
                nameOut = `@${displayName}`;
              }
            }
          }
        }
        
        return ({
          id: `contrib_${c.id}`,
          wallet_id: walletData?.id || null,
          type: 'credit',
          source: 'contributions',
          amount: c.amount,
          title: c.goal?.title || null,
          contributor_name: nameOut,
          description: c.goal?.title ? `Contributions for "${c.goal.title}"` : 'Contributions received',
          created_at: c.created_at,
        });
      });

      // Map contributions SENT by current user as debits for Sent tab
      const contribSentRows = contribSentRes.data || [];
      const contributionsSent = contribSentRows
        // Exclude contributions to my own wishlists; we only want sent to others
        .filter((c) => c?.goal?.wishlist?.user?.username && c.goal.wishlist.user.username !== (myUsername || ''))
        .map((c) => ({
        id: `contribsent_${c.id}`,
        wallet_id: walletData?.id || null,
        type: 'debit',
        source: 'contribution_sent',
        amount: c.amount,
        title: c.goal?.title || null,
        // depositor shows sender (current user)
        contributor_name: myUsername || 'me',
        // explicit receiver username for UI
        recipient_username: c.goal?.wishlist?.user?.username || null,
        description: c.goal?.title ? `Contribution sent to @${c.goal?.wishlist?.user?.username || 'user'}` : 'Contribution sent',
        created_at: c.created_at,
      }));

      // Map item claims made by current user as Sent entries (use unit_price_estimate when available)
      const claimsByMe = claimsByMeRes.data || [];
      const sentItems = claimsByMe
        .filter(row => row?.wishlist_item?.wishlist?.user?.username && row?.wishlist_item?.name)
        .map((row) => ({
          id: `sentitem_${row.id}`,
          wallet_id: walletData?.id || null,
          type: 'debit',
          source: 'cash_sent',
          amount: Number(row?.wishlist_item?.unit_price_estimate || 0) || 0,
          title: row?.wishlist_item?.name || null,
          contributor_name: myUsername || 'me',
          recipient_username: row?.wishlist_item?.wishlist?.user?.username || null,
          description: row?.wishlist_item?.name ? `Paid for "${row.wishlist_item.name}" to @${row?.wishlist_item?.wishlist?.user?.username || 'user'}` : 'Wishlist item payment',
          created_at: row.created_at,
        }));

      // Merge and enrich wallet txs missing contributor_name for cash payments using item title -> username map
      const enrichedWalletTxs = walletTransactions.map((tx) => {
        const lowerSrc = (tx.source || '').toLowerCase();
        const isCashPayment = tx.type === 'credit' && (lowerSrc.includes('wishlist') || lowerSrc.includes('cash') || !lowerSrc);
        
        
        if (isCashPayment && !tx.contributor_name && itemNameToSenders.size > 0) {
          const primaryKey = tx.title ? normalizeTitle(tx.title) : '';
          const secondaryKey = tx.description ? normalizeTitle(tx.description) : '';
          let candidates = [];
          if (primaryKey) candidates = itemNameToSenders.get(primaryKey) || [];
          if (candidates.length === 0 && secondaryKey) candidates = itemNameToSenders.get(secondaryKey) || [];
          if (candidates.length === 0) {
            const tryKeys = [primaryKey, secondaryKey].filter(Boolean);
            for (const keyTry of tryKeys) {
              if (!keyTry) continue;
              for (const [key, list] of itemNameToSenders.entries()) {
                if (key.includes(keyTry) || keyTry.includes(key)) { candidates = list; break; }
              }
              if (candidates.length) break;
            }
          }
          if (candidates.length > 0) {
            // pick the nearest in time to the transaction
            const txTime = new Date(tx.created_at).getTime();
            let best = candidates[0];
            let bestDiff = Math.abs(new Date(best.created_at).getTime() - txTime);
            for (const c of candidates.slice(1)) {
              const diff = Math.abs(new Date(c.created_at).getTime() - txTime);
              if (diff < bestDiff) { best = c; bestDiff = diff; }
            }
            return { ...tx, contributor_name: best.username };
          }
        }
        return tx;
      });

      // Merge and sort by created_at desc
      const merged = [...enrichedWalletTxs, ...contributions, ...contributionsSent, ...sentItems].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      
      setTransactions(merged);
      }
    } catch (err) {
      console.error('Wallet load failed:', err);
      setWallet(null);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchWalletData();
    }
  }, [user, authLoading, fetchWalletData]);
  
  const value = {
    wallet,
    transactions,
    loading,
    refreshWallet: fetchWalletData,
  };

  // Realtime subscriptions for wallet balance and transactions
  useEffect(() => {
    if (!wallet?.id) return;

    const channel = supabase
      .channel(`wallet-${wallet.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wallets', filter: `id=eq.${wallet.id}` },
        () => {
          fetchWalletData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wallet_transactions', filter: `wallet_id=eq.${wallet.id}` },
        () => {
          fetchWalletData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [wallet?.id, fetchWalletData]);

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};