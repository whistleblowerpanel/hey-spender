import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2, Gift, Plus, User, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const ProfilePage = () => {
  const { username } = useParams();
  const { user: authUser, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [wishlists, setWishlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchProfileData = useCallback(async () => {
    setLoading(true);
    
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('id, full_name, username, created_at, role')
      .eq('username', username)
      .single();

    if (profileError || !profileData) {
      toast({ variant: 'destructive', title: 'Profile not found' });
      navigate('/');
      return;
    }
    setProfile(profileData);

    const { data: wishlistData, error: wishlistError } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', profileData.id)
      .order('created_at', { ascending: false });

    if (wishlistError) {
      toast({ variant: 'destructive', title: 'Error fetching wishlists', description: wishlistError.message });
    } else {
      setWishlists(wishlistData);
    }

    setLoading(false);
  }, [username, navigate, toast]);

  useEffect(() => {
    const mainRoutes = ["register", "login", "verify", "admin", "dashboard", "wishlists", "auth"];
    if (username && !mainRoutes.includes(username)) {
      fetchProfileData();
    } else {
        setLoading(false);
    }
  }, [username, fetchProfileData]);

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-brand-purple-dark" />
      </div>
    );
  }

  if (!profile) {
      return null;
  }

  const isOwner = authUser && authUser.id === profile.id;

  return (
    <>
      <Helmet>
        <title>{profile.full_name}'s Profile - HeySpender</title>
        <meta name="description" content={`View ${profile.full_name}'s wishlists on HeySpender.`} />
      </Helmet>
      <div>
        <header className="relative h-[500px] bg-brand-purple-dark flex items-end justify-center text-center p-4 pt-28">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
            <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}} />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 flex flex-col items-center text-center space-y-4 mb-8 text-white"
            >
                <div className="w-28 h-28 flex items-center justify-center border-4 border-black bg-brand-green">
                    <User className="w-16 h-16 text-black" strokeWidth={2.5} />
                </div>
                <h1 className="text-4xl font-bold drop-shadow-lg">{profile.full_name}</h1>
                <p className="text-white/80 drop-shadow-md">@{profile.username}</p>
            </motion.div>
        </header>
        
        <main className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-brand-purple-dark">Wishlists</h2>
              {isOwner && (
                <Button onClick={() => navigate('/dashboard')} variant="custom" className="bg-brand-orange text-black">
                  <Plus className="w-4 h-4 mr-2" />
                  Manage Wishlists
                </Button>
              )}
            </div>

            {wishlists.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16 px-8 border-2 border-dashed border-gray-300"
              >
                <Gift className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  {isOwner ? "You have no wishlists yet" : `${profile.full_name} has no public wishlists`}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {isOwner ? "Go to your dashboard to create one!" : "Check back later!"}
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlists.map(wishlist => (
                  <Link to={`/${profile.username}/${wishlist.slug}`} key={wishlist.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
                      className="border-2 border-black p-4 flex flex-col space-y-4 h-full"
                    >
                      <div className="relative aspect-square bg-gray-100 mb-2">
                        {wishlist.cover_image_url ?
                          <img alt={wishlist.title} src={wishlist.cover_image_url} className="w-full h-full object-cover" /> :
                          <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon className="w-12 h-12" /></div>
                        }
                      </div>
                      <div className="flex-grow">
                        <h3 className="text-xl font-bold truncate">{wishlist.title}</h3>
                        <p className="text-sm text-gray-500 capitalize">{wishlist.occasion}</p>
                        {wishlist.wishlist_date && <p className="text-sm text-gray-500">{format(new Date(wishlist.wishlist_date), 'PPP')}</p>}
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            )}
        </main>
      </div>
    </>
  );
};

export default ProfilePage;