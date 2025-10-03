import React from 'react';
import { Heart } from 'lucide-react';
const Footer = () => {
  const currentYear = new Date().getFullYear();
  return <footer className="mt-auto border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
            <span>by ExpressCreo</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            <a href="#" className="hover:text-brand-purple-dark transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-brand-purple-dark transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-brand-purple-dark transition-colors">
              Contact
            </a>
          </div>

          <p className="text-sm text-gray-600">
            © {currentYear} HeySpender. All rights reserved.
          </p>
        </div>
      </div>
    </footer>;
};
export default Footer;