import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

const SupabaseAuthContext = createContext();

export const useAuth = () => {
  return useContext(SupabaseAuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isInitialized = useRef(false);
  const lastUserRef = useRef(null);

  const updateUser = useCallback((newUser) => {
    // Only update if the user actually changed
    if (lastUserRef.current?.id !== newUser?.id) {
      lastUserRef.current = newUser;
      setUser(newUser);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting session:", error);
        }
        updateUser(session?.user ?? null);
      } catch (error) {
        console.error("Session error:", error);
        updateUser(null);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Only respond to significant auth events, ignore token refreshes
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          updateUser(session?.user ?? null);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [updateUser]);

  const signUpWithEmailPassword = useCallback((payload) => {
    return supabase.auth.signUp(payload);
  }, []);

  const signInWithEmailPassword = useCallback((credentials) => {
    return supabase.auth.signInWithPassword(credentials);
  }, []);
  
  const signOut = useCallback(() => {
    return supabase.auth.signOut();
  }, []);

  const updatePassword = useCallback(async (newPassword) => {
    return supabase.auth.updateUser({ password: newPassword });
  }, []);

  const updateEmail = useCallback(async (newEmail) => {
    return supabase.auth.updateUser({ email: newEmail });
  }, []);

  const value = {
    user,
    loading,
    signUpWithEmailPassword,
    signInWithEmailPassword,
    signOut,
    updatePassword,
    updateEmail,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};