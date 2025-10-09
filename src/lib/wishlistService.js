import { supabase } from './customSupabaseClient';
import slugify from 'slugify';

// Wishlist CRUD operations
export const wishlistService = {
  // Fetch all wishlists for a user with items count and goals
  async fetchUserWishlists(userId) {
    const { data, error } = await supabase
      .from('wishlists')
      .select(`
        *,
        wishlist_items(count),
        goals(*)
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Transform data to include computed fields
    return data.map(wishlist => ({
      ...wishlist,
      items_count: wishlist.wishlist_items?.[0]?.count || 0,
      items_fulfilled_count: 0, // TODO: Calculate from claims
      amount_raised: wishlist.goals?.reduce((sum, goal) => sum + (goal.amount_raised || 0), 0) || 0,
      status: this.getWishlistStatus(wishlist)
    }));
  },

  // Fetch occasion titles from user's wishlists
  async fetchUserOccasions(userId) {
    const { data, error } = await supabase
      .from('wishlists')
      .select('title')
      .eq('user_id', userId)
      .not('title', 'is', null);

    if (error) throw error;

    return [...new Set(data.map(w => w.title))];
  },

  // Create a new wishlist
  async createWishlist(userId, wishlistData, items = [], goals = []) {
    const { title, occasion, wishlist_date, story, cover_image_url, visibility } = wishlistData;
    
    // Generate unique slug
    const baseSlug = slugify(title, { lower: true, strict: true });
    const slug = await this.generateUniqueSlug(baseSlug);

    const { data: wishlist, error: wishlistError } = await supabase
      .from('wishlists')
      .insert({
        user_id: userId,
        title,
        occasion,
        wishlist_date,
        story,
        cover_image_url,
        visibility: visibility || 'unlisted',
        slug
      })
      .select()
      .single();

    if (wishlistError) throw wishlistError;

    // Create items if provided
    if (items.length > 0) {
      const itemsData = items.map(item => ({
        wishlist_id: wishlist.id,
        name: item.name,
        description: item.description,
        unit_price_estimate: item.price,
        qty_total: item.quantity || 1,
        qty_claimed: 0,
        product_url: item.url,
        image_url: item.image,
        allow_group_gift: item.allowGroupGift || false
      }));

      const { error: itemsError } = await supabase
        .from('wishlist_items')
        .insert(itemsData);

      if (itemsError) throw itemsError;
    }

    // Create goals if provided
    if (goals.length > 0) {
      const goalsData = goals.map(goal => ({
        wishlist_id: wishlist.id,
        title: goal.title,
        target_amount: goal.targetAmount,
        amount_raised: 0,
        deadline: goal.deadline
      }));

      const { error: goalsError } = await supabase
        .from('goals')
        .insert(goalsData);

      if (goalsError) throw goalsError;
    }

    return wishlist;
  },

  // Update wishlist
  async updateWishlist(id, updates) {
    const { data, error } = await supabase
      .from('wishlists')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete wishlist
  async deleteWishlist(id) {
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Generate unique slug
  async generateUniqueSlug(baseSlug) {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const { data, error } = await supabase
        .from('wishlists')
        .select('id')
        .eq('slug', slug)
        .single();

      if (error && error.code === 'PGRST116') {
        // No rows found - slug is unique
        return slug;
      }

      if (error) throw error;

      // Slug exists, try with counter
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  },

  // Get wishlist status based on data
  getWishlistStatus(wishlist) {
    if (!wishlist.wishlist_date) return 'live';
    
    const now = new Date();
    const wishlistDate = new Date(wishlist.wishlist_date);
    
    if (wishlistDate < now) return 'completed';
    return 'live';
  },

  // Add items to wishlist
  async addItemsToWishlist(wishlistId, items) {
    const itemsWithWishlistId = items.map(item => ({
      ...item,
      wishlist_id: wishlistId,
      unit_price_estimate: item.unit_price_estimate ? parseFloat(item.unit_price_estimate) : null,
      qty_total: item.qty_total || 1,
      qty_claimed: 0
    }));

    const { data, error } = await supabase
      .from('wishlist_items')
      .insert(itemsWithWishlistId)
      .select();

    if (error) throw error;
    return data;
  }
};

// Goals CRUD operations
export const goalsService = {
  // Fetch all goals for a user
  async fetchUserGoals(userId) {
    const { data, error } = await supabase
      .from('goals')
      .select(`
        *,
        wishlist:wishlists!inner(
          id,
          user_id,
          title,
          occasion,
          visibility,
          slug
        )
      `)
      .eq('wishlist.user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return data.map(goal => ({
      ...goal,
      wishlist_id: goal.wishlist.id,
      wishlist_title: goal.wishlist.title,
      wishlist_occasion: goal.wishlist.occasion,
      wishlist_slug: goal.wishlist.slug,
      visibility: goal.wishlist.visibility
    }));
  },

  // Create a new goal
  async createGoal(goalData) {
    const { data, error } = await supabase
      .from('goals')
      .insert({
        ...goalData,
        amount_raised: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update goal
  async updateGoal(id, updates) {
    const { data, error } = await supabase
      .from('goals')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete goal
  async deleteGoal(id) {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Items CRUD operations
export const itemsService = {
  // Fetch all wishlist items for a user
  async fetchUserWishlistItems(userId) {
    const { data, error } = await supabase
      .from('wishlist_items')
      .select(`
        *,
        wishlist:wishlists!inner(
          id,
          user_id,
          title,
          occasion,
          visibility,
          slug
        ),
        claims:claims(
          id,
          status,
          created_at,
          supporter_user_id,
          supporter_user:users!supporter_user_id(
            id,
            username,
            email
          )
        )
      `)
      .eq('wishlist.user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(item => ({
      ...item,
      wishlist_id: item.wishlist.id,
      wishlist_title: item.wishlist.title,
      wishlist_occasion: item.wishlist.occasion,
      wishlist_slug: item.wishlist.slug,
      visibility: item.wishlist.visibility,
      claims: item.claims || []
    }));
  },

  // Create wishlist item
  async createItem(itemData) {
    const { data, error } = await supabase
      .from('wishlist_items')
      .insert({
        ...itemData,
        qty_claimed: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update item
  async updateItem(id, updates) {
    const { data, error } = await supabase
      .from('wishlist_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete item
  async deleteItem(id) {
    const { error } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Update wishlist
  async updateWishlist(wishlistId, updates) {
    const { data, error } = await supabase
      .from('wishlists')
      .update(updates)
      .eq('id', wishlistId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete wishlist
  async deleteWishlist(wishlistId) {
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('id', wishlistId);

    if (error) throw error;
  },

  // Add items to wishlist
  async addItemsToWishlist(wishlistId, items) {
    const itemsWithWishlistId = items.map(item => ({
      ...item,
      wishlist_id: wishlistId,
      unit_price_estimate: item.unit_price_estimate ? parseFloat(item.unit_price_estimate) : null,
      qty_total: item.qty_total || 1,
      qty_claimed: 0
    }));

    const { data, error } = await supabase
      .from('wishlist_items')
      .insert(itemsWithWishlistId)
      .select();

    if (error) throw error;
    return data;
  }
};

// Image upload service - ORIGINAL SUPABASE STORAGE
export const imageService = {
  async uploadCoverImage(file, userId) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `wishlist-covers/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('HeySpender Media').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('HeySpender Media').getPublicUrl(filePath);
      return publicUrl;
    } catch (error) {
      throw error;
    }
  },

  async uploadItemImage(file, userId) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `item-images/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('HeySpender Media').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('HeySpender Media').getPublicUrl(filePath);
      return publicUrl;
    } catch (error) {
      throw error;
    }
  }
};
