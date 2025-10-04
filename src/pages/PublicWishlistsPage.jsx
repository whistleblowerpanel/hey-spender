import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Gift, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

const PublicWishlistsPage = () => {
  const [wishlists, setWishlists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicWishlists = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('wishlists')
        .select('*, user:users!inner(username, full_name)')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });

      if (data) {
        setWishlists(data);
      }
      setLoading(false);
    };

    fetchPublicWishlists();
  }, []);

  return (
    <>
      <Helmet>
        <title>Explore Public Wishlists - HeySpender</title>
        <meta name="description" content="Feeling generous? Browse public wishlists and make someone's day!" />
      </Helmet>
      
      <header className="relative h-[500px] bg-brand-green flex items-center justify-center text-center p-4 pt-28">
        <div className="absolute top-0 left-0 w-full h-full opacity-20" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}} />
        <div className="relative z-10 space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold text-black drop-shadow-lg">HeySpender! Are you feeling generous today?</h1>
          <p className="text-lg text-black/80 drop-shadow-md">Fulfill someone's wishlist!</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12 md:px-0">
        {loading ? (
          <div className="flex justify-center items-center min-h-[40vh]">
            <Loader2 className="h-16 w-16 animate-spin text-brand-purple-dark" />
          </div>
        ) : wishlists.length === 0 ? (
          <div className="text-center py-16 px-8 border-2 border-dashed border-gray-300">
            <Gift className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-xl font-semibold">No public wishlists yet</h3>
            <p className="mt-2 text-sm text-gray-500">Check back later or be the first to make your wishlist public!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlists.map(wishlist => (
              <Link to={`/${wishlist.user.username}/${wishlist.slug}`} key={wishlist.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-2 border-black p-4 flex flex-col space-y-4 h-full bg-white"
                >
                  <div className="relative aspect-square bg-gray-100 mb-2 h-[250px]">
                    {wishlist.cover_image_url ?
                      <img alt={wishlist.title} src={wishlist.cover_image_url} className="w-full h-full object-cover" /> :
                      <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon className="w-12 h-12" /></div>
                    }
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold truncate">{wishlist.title}</h3>
                    <p className="text-sm text-gray-500">by {wishlist.user.full_name}</p>
                    {wishlist.wishlist_date && <p className="text-sm text-gray-500">{format(new Date(wishlist.wishlist_date), 'PPP')}</p>}
                  </div>
                   <Button variant="custom" className="w-full mt-4 bg-brand-green text-black">View Wishlist</Button>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
};

export default PublicWishlistsPage;