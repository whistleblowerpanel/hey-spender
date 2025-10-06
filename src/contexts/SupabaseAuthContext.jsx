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
      console.log('Auth user updated:', newUser?.id, newUser?.email);
    }
  }, []);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn("Session error (clearing user):", error.message);
          updateUser(null);
        } else {
          updateUser(session?.user ?? null);
        }
      } catch (error) {
        console.warn("Session error (clearing user):", error);
        updateUser(null);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        // Handle all auth events including token refresh and session expiry
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
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
  
  const signOut = useCallback(async () => {
    try {
      // Always clear local state first, regardless of server response
      setUser(null);
      setLoading(false);
      
      // Try to sign out from server, but don't fail if session doesn't exist
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.warn('Sign out server error (but proceeding with local logout):', error.message);
        // Don't throw error for session_not_found - user is already logged out locally
        if (error.message?.includes('session_not_found')) {
          console.log('Session already expired, local logout completed');
          return { error: null };
        }
        // For other errors, still return success since we cleared local state
        return { error: null };
      }
      
      return { error: null };
    } catch (error) {
      console.warn('Sign out error (but proceeding with local logout):', error);
      // Even if there's an error, we've cleared the local state
      return { error: null };
    }
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