import { supabase } from './customSupabaseClient';

export const claimsService = {
  // Fetch user's claims with item and wishlist details
  async fetchUserClaims(userId) {
    const { data, error } = await supabase
      .from('claims')
      .select(`
        *,
        wishlist_items!inner(
          *,
          wishlists!inner(
            id,
            title,
            slug,
            user_id,
            occasion,
            cover_image_url,
            users!inner(
              id,
              username
            )
          )
        )
      `)
      .eq('supporter_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Update claim status
  async updateClaimStatus(claimId, status) {
    const { data, error } = await supabase
      .from('claims')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', claimId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update claim details
  async updateClaim(claimId, updates) {
    const { data, error } = await supabase
      .from('claims')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', claimId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a claim
  async deleteClaim(claimId) {
    const { error } = await supabase
      .from('claims')
      .delete()
      .eq('id', claimId);

    if (error) throw error;
  },

  // Get claim statistics
  async getUserClaimStats(userId) {
    const { data, error } = await supabase
      .from('claims')
      .select('status, wishlist_items!inner(unit_price_estimate)')
      .eq('supporter_user_id', userId);

    if (error) throw error;

    const stats = {
      total: data.length,
      pending: data.filter(c => c.status === 'pending').length,
      confirmed: data.filter(c => c.status === 'confirmed').length,
      fulfilled: data.filter(c => c.status === 'fulfilled').length,
      cancelled: data.filter(c => c.status === 'cancelled').length,
      totalValue: data.reduce((sum, c) => sum + (c.wishlist_items.unit_price_estimate || 0), 0)
    };

    return stats;
  }
};
