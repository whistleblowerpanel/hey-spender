import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';

const Hero = ({ userName, onGetStarted, onCreateWishlist, hasOccasions = false }) => {
  return (
    <section
      className="relative md:min-h-[30vh] flex items-center pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden -mt-4"
      style={{
        backgroundColor: '#723DC4'
      }}
    >
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center space-y-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-snug md:leading-normal">
            <span className="text-white">Welcome{userName ? `, ${userName}` : ''}</span>
            <br />
            <span className="text-white">Let's Build Your Wishlist</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto">
            Organize occasions, add wishlist items or cash goals, and share with your Spenders.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
