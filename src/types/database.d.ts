export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Occasion = 'birthday' | 'wedding' | 'graduation' | 'burial' | 'other';
export type Visibility = 'public' | 'unlisted' | 'private';
export type ClaimStatus = 'pending' | 'confirmed' | 'expired' | 'cancelled' | 'fulfilled';
export type ReminderChannel = 'email' | 'sms' | 'whatsapp';
export type ContributionStatus = 'pending' | 'success' | 'failed' | 'refunded';
export type WalletTransactionType = 'credit' | 'debit';
export type PayoutStatus = 'requested' | 'processing' | 'paid' | 'failed';
export type ReminderStatus = 'queued' | 'sent' | 'failed';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          email_verified_at: string | null;
          phone_verified_at: string | null;
          is_active: boolean | null;
          is_admin: boolean | null;
          created_at: string | null;
          updated_at: string | null;
          role: string | null;
        };
        Insert: {
          id?: string;
          username: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          email_verified_at?: string | null;
          phone_verified_at?: string | null;
          is_active?: boolean | null;
          is_admin?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          role?: string | null;
        };
        Update: {
          id?: string;
          username?: string;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          email_verified_at?: string | null;
          phone_verified_at?: string | null;
          is_active?: boolean | null;
          is_admin?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          role?: string | null;
        };
      };
      wishlists: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          occasion: Occasion | null;
          wishlist_date: string | null;
          slug: string;
          story: string | null;
          cover_image_url: string | null;
          visibility: Visibility | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          occasion?: Occasion | null;
          wishlist_date?: string | null;
          slug: string;
          story?: string | null;
          cover_image_url?: string | null;
          visibility?: Visibility | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          occasion?: Occasion | null;
          wishlist_date?: string | null;
          slug?: string;
          story?: string | null;
          cover_image_url?: string | null;
          visibility?: Visibility | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      wishlist_items: {
        Row: {
          id: string;
          wishlist_id: string;
          name: string;
          description: string | null;
          unit_price_estimate: number | null;
          qty_total: number | null;
          qty_claimed: number | null;
          product_url: string | null;
          image_url: string | null;
          allow_group_gift: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          wishlist_id: string;
          name: string;
          description?: string | null;
          unit_price_estimate?: number | null;
          qty_total?: number | null;
          qty_claimed?: number | null;
          product_url?: string | null;
          image_url?: string | null;
          allow_group_gift?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          wishlist_id?: string;
          name?: string;
          description?: string | null;
          unit_price_estimate?: number | null;
          qty_total?: number | null;
          qty_claimed?: number | null;
          product_url?: string | null;
          image_url?: string | null;
          allow_group_gift?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      claims: {
        Row: {
          id: string;
          wishlist_item_id: string;
          supporter_user_id: string | null;
          supporter_contact: string;
          note: string | null;
          status: ClaimStatus | null;
          expire_at: string;
          scheduled_purchase_date: string | null;
          reminder_channel: ReminderChannel | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          wishlist_item_id: string;
          supporter_user_id?: string | null;
          supporter_contact: string;
          note?: string | null;
          status?: ClaimStatus | null;
          expire_at: string;
          scheduled_purchase_date?: string | null;
          reminder_channel?: ReminderChannel | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          wishlist_item_id?: string;
          supporter_user_id?: string | null;
          supporter_contact?: string;
          note?: string | null;
          status?: ClaimStatus | null;
          expire_at?: string;
          scheduled_purchase_date?: string | null;
          reminder_channel?: ReminderChannel | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      goals: {
        Row: {
          id: string;
          wishlist_id: string;
          title: string;
          target_amount: number;
          amount_raised: number | null;
          deadline: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          wishlist_id: string;
          title: string;
          target_amount: number;
          amount_raised?: number | null;
          deadline?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          wishlist_id?: string;
          title?: string;
          target_amount?: number;
          amount_raised?: number | null;
          deadline?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      contributions: {
        Row: {
          id: string;
          goal_id: string;
          display_name: string | null;
          is_anonymous: boolean | null;
          amount: number;
          currency: string | null;
          payment_provider: string | null;
          payment_ref: string | null;
          status: ContributionStatus | null;
          supporter_user_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          goal_id: string;
          display_name?: string | null;
          is_anonymous?: boolean | null;
          amount: number;
          currency?: string | null;
          payment_provider?: string | null;
          payment_ref?: string | null;
          status?: ContributionStatus | null;
          supporter_user_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          goal_id?: string;
          display_name?: string | null;
          is_anonymous?: boolean | null;
          amount?: number;
          currency?: string | null;
          payment_provider?: string | null;
          payment_ref?: string | null;
          status?: ContributionStatus | null;
          supporter_user_id?: string | null;
          created_at?: string | null;
        };
      };
      wallets: {
        Row: {
          id: string;
          user_id: string;
          balance: number | null;
          currency_default: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          balance?: number | null;
          currency_default?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          balance?: number | null;
          currency_default?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      wallet_transactions: {
        Row: {
          id: string;
          wallet_id: string;
          type: WalletTransactionType;
          source: string | null;
          amount: number;
          description: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          wallet_id: string;
          type: WalletTransactionType;
          source?: string | null;
          amount: number;
          description?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          wallet_id?: string;
          type?: WalletTransactionType;
          source?: string | null;
          amount?: number;
          description?: string | null;
          created_at?: string | null;
        };
      };
      payouts: {
        Row: {
          id: string;
          wallet_id: string;
          amount: number;
          destination_bank_code: string | null;
          destination_account: string | null;
          status: PayoutStatus | null;
          provider: string | null;
          provider_ref: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          wallet_id: string;
          amount: number;
          destination_bank_code?: string | null;
          destination_account?: string | null;
          status?: PayoutStatus | null;
          provider?: string | null;
          provider_ref?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          wallet_id?: string;
          amount?: number;
          destination_bank_code?: string | null;
          destination_account?: string | null;
          status?: PayoutStatus | null;
          provider?: string | null;
          provider_ref?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      reminders: {
        Row: {
          id: string;
          claim_id: string;
          contact: string;
          schedule_at: string;
          channel: ReminderChannel | null;
          status: ReminderStatus | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          claim_id: string;
          contact: string;
          schedule_at: string;
          channel?: ReminderChannel | null;
          status?: ReminderStatus | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          claim_id?: string;
          contact?: string;
          schedule_at?: string;
          channel?: ReminderChannel | null;
          status?: ReminderStatus | null;
          created_at?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string | null;
          type: string | null;
          template_key: string | null;
          payload: Json | null;
          status: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          type?: string | null;
          template_key?: string | null;
          payload?: Json | null;
          status?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          type?: string | null;
          template_key?: string | null;
          payload?: Json | null;
          status?: string | null;
          created_at?: string | null;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          actor_user_id: string | null;
          action: string;
          target_table: string | null;
          target_id: string | null;
          diff: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          actor_user_id?: string | null;
          action: string;
          target_table?: string | null;
          target_id?: string | null;
          diff?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          actor_user_id?: string | null;
          action?: string;
          target_table?: string | null;
          target_id?: string | null;
          diff?: Json | null;
          created_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      occasion: 'birthday' | 'wedding' | 'graduation' | 'burial' | 'other';
      visibility: 'public' | 'unlisted' | 'private';
      claim_status: 'pending' | 'confirmed' | 'expired' | 'cancelled' | 'fulfilled';
      reminder_channel: 'email' | 'sms' | 'whatsapp';
      contribution_status: 'pending' | 'success' | 'failed' | 'refunded';
      wallet_transaction_type: 'credit' | 'debit';
      payout_status: 'requested' | 'processing' | 'paid' | 'failed';
      reminder_status: 'queued' | 'sent' | 'failed';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}