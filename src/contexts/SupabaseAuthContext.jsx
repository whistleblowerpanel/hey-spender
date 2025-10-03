import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

const SupabaseAuthContext = createContext();

export const useAuth = () => {
  return useContext(SupabaseAuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
      }
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signUpWithEmailPassword = (payload) => {
    return supabase.auth.signUp(payload);
  };

  const signInWithEmailPassword = (credentials) => {
    return supabase.auth.signInWithPassword(credentials);
  };
  
  const signOut = () => {
    return supabase.auth.signOut();
  };

  const value = {
    user,
    loading,
    signUpWithEmailPassword,
    signInWithEmailPassword,
    signOut,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};