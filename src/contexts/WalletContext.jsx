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

    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (walletError && walletError.code !== 'PGRST116') { // Ignore 'exact one row' error for new users
      console.error("Error fetching wallet:", walletError);
    } else {
      setWallet(walletData);
      if (walletData) {
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('wallet_id', walletData.id)
          .order('created_at', { ascending: false });

        if (transactionsError) {
          console.error("Error fetching transactions:", transactionsError);
        } else {
          setTransactions(transactionsData);
        }
      }
    }

    setLoading(false);
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

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};