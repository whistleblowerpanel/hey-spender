import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hgvdslcpndmimatvliyu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhndmRzbGNwbmRtaW1hdHZsaXl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzA2NjksImV4cCI6MjA3NTAwNjY2OX0.1d-UszrAW-_rUemrmBEbHRoa1r8zOrbo-wtKaXMPW9k';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    multiTab: false,
    persistSession: true,
    detectSessionInUrl: false,
    autoRefreshToken: true
  }
});