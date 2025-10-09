import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight, User, LogOut, LayoutGrid, Gift, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const {
    user,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const handleSignOut = async () => {
    if (isSigningOut) return; // Prevent multiple sign out attempts
    
    setIsSigningOut(true);
    try {
      const { error } = await signOut();
      // The improved signOut function always returns success for session_not_found
      // So we can always show success and navigate
      toast({
        title: 'Signed out successfully',
        description: 'You have been logged out'
      });
      // Small delay to ensure auth state is updated before navigation
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);
    } catch (error) {
      // This should rarely happen now with the improved error handling
      toast({
        variant: 'destructive',
        title: 'Sign out failed',
        description: 'An unexpected error occurred'
      });
      console.error('Sign out error:', error);
    } finally {
      setIsSigningOut(false);
    }
  };
  return <>
      <header className="fixed top-4 left-0 right-0 z-50 px-4">
        <nav className={`max-w-7xl mx-auto text-white border-2 border-black flex justify-between items-center h-[4.5rem] px-4 transition-all duration-300 ${
          isScrolled 
            ? 'bg-brand-purple-dark/80 backdrop-blur-sm' 
            : 'bg-brand-purple-dark/95'
        }`}>
          <Link to="/" className="flex items-center space-x-2 group">
            <Gift className="w-8 h-8 text-brand-green" />
            <span className="text-2xl font-bold">HeySpender.</span>
          </Link>

          <div className="hidden md:flex items-center space-x-2">
            <Button onClick={() => navigate('/explore')} variant="custom" className="bg-[#E94B29] text-white">
              <Sparkles className="w-4 h-4 mr-2" />
              Explore Wishlists
            </Button>
            {user ? <div className="flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="custom" className="relative h-10 w-10 p-0 bg-brand-green">
                       <User className="w-6 h-6 text-black" strokeWidth={2.5} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.user_metadata?.full_name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email || user.phone}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem onClick={() => navigate(user.user_metadata?.role === 'admin' ? '/admin/dashboard' : '/dashboard')}>
                      <LayoutGrid className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`/${user.user_metadata.username}`)}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut}>
                      {isSigningOut ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span>Signing out...</span>
                        </>
                      ) : (
                        <>
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Log out</span>
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div> : <div className="flex items-center space-x-2">
                <Button onClick={() => navigate('/login')} variant="custom" className="bg-brand-green text-black">
                  <span>Login</span>
                </Button>
                <Button onClick={() => navigate('/register')} variant="custom" className="bg-brand-orange text-black">
                  <span>Create Wishlist</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>}
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 hover:bg-white/10 transition-colors">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && <motion.div initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} exit={{
        opacity: 0,
        y: -20
      }} className={`fixed top-24 left-4 right-4 z-40 md:hidden text-white border-2 border-black p-4 transition-all duration-300 ${
        isScrolled 
          ? 'bg-brand-purple-dark/80 backdrop-blur-sm' 
          : 'bg-brand-purple-dark/95'
      }`}>
             <div className="flex flex-col space-y-2 mb-4">
                <Button onClick={() => { navigate('/explore'); setMobileMenuOpen(false); }} variant="custom" className="bg-[#E94B29] text-white w-full justify-start">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Explore Wishlists
                </Button>
             </div>
             {user ? <div className="flex flex-col space-y-2">
                   <Button onClick={() => {
            navigate(user.user_metadata?.role === 'admin' ? '/admin/dashboard' : '/dashboard');
            setMobileMenuOpen(false);
          }} variant="custom" className="bg-brand-green text-black w-full">Dashboard</Button>
                   <Button onClick={() => {
            navigate(`/${user.user_metadata.username}`);
            setMobileMenuOpen(false);
          }} variant="custom" className="bg-brand-green text-black w-full">Profile</Button>
                   <Button onClick={() => {
            handleSignOut();
            setMobileMenuOpen(false);
          }} variant="custom" className="bg-brand-salmon text-black w-full" disabled={isSigningOut}>
            {isSigningOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Signing out...</span>
              </>
            ) : (
              <span>Log Out</span>
            )}
          </Button>
                </div> : <div className="flex flex-col space-y-2">
                  <Button onClick={() => {
            navigate('/login');
            setMobileMenuOpen(false);
          }} variant="custom" className="bg-brand-green text-black w-full">
                    <span>Login</span>
                  </Button>
                  <Button onClick={() => {
            navigate('/register');
            setMobileMenuOpen(false);
          }} variant="custom" className="bg-brand-orange text-black w-full">
                    <span>Create Wishlist</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>}
          </motion.div>}
      </AnimatePresence>
    </>;
};
export default Navbar;