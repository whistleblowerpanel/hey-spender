import { supabase } from './customSupabaseClient';

export const claimsService = {
  // Fetch user's claims with item and wishlist details
  async fetchUserClaims(userId) {
    console.log('🔍 [claimsService] Fetching claims for user:', userId);
    
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

    if (error) {
      console.error('🔴 [claimsService] Error fetching claims:', error);
      throw error;
    }
    
    // Ensure amount_paid field exists with default value of 0
    const claims = (data || []).map(claim => ({
      ...claim,
      amount_paid: claim.amount_paid || 0
    }));
    
    console.log(`✅ [claimsService] Fetched ${claims.length} claims from database`);
    console.log('📊 [claimsService] Fulfilled claims:', claims.filter(c => c.status === 'fulfilled').length);
    
    return claims;
  },

  // Update claim status
  async updateClaimStatus(claimId, status) {
    console.log('🔧 Updating claim status:', { claimId, status });
    
    // First, get the current claim to see its current status
    const { data: currentClaim, error: fetchError } = await supabase
      .from('claims')
      .select('id, status, supporter_user_id, wishlist_item_id')
      .eq('id', claimId)
      .single();
    
    if (fetchError) {
      console.error('🔴 Error fetching current claim:', fetchError);
      throw fetchError;
    }
    
    console.log('🔍 Current claim data:', currentClaim);
    
    // Validate the status value
    const validStatuses = ['pending', 'confirmed', 'expired', 'cancelled', 'fulfilled'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Valid statuses are: ${validStatuses.join(', ')}`);
    }
    
    const { data, error } = await supabase
      .from('claims')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', claimId)
      .select()
      .single();

    if (error) {
      console.error('🔴 Database error updating claim status:', error);
      console.error('🔴 Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }
    
    console.log('✅ Claim status updated successfully:', data);
    return data;
  },

  // Update claim details
  async updateClaim(claimId, updates) {
    console.log('🔧 [claimsService] Updating claim:', { claimId, updates });
    
    const { data, error } = await supabase
      .from('claims')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', claimId)
      .select()
      .single();

    if (error) {
      console.error('🔴 [claimsService] Error updating claim:', error);
      throw error;
    }
    
    console.log('✅ [claimsService] Claim updated successfully in database:', {
      claimId: data.id,
      status: data.status,
      amount_paid: data.amount_paid,
      updated_at: data.updated_at
    });
    
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
