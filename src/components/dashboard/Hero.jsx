import React from 'react';
import { Button } from '@/components/ui/button';

const Hero = ({ userName, onGetStarted, onCreateWishlist }) => {
  return (
    <div className="text-center py-12 px-4">
      <h1 className="text-3xl md:text-4xl font-bold text-brand-purple-dark mb-4">
        🎁 Welcome, {userName || 'there'}!
      </h1>
      <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
        Let's create your next wishlist.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Button 
          onClick={onGetStarted}
          variant="custom" 
          className="bg-brand-orange text-black w-full sm:w-auto"
        >
          Get Started
        </Button>
        <Button 
          onClick={onCreateWishlist}
          variant="outline" 
          className="w-full sm:w-auto"
        >
          Create a Wishlist
        </Button>
      </div>
    </div>
  );
};

export default Hero;
