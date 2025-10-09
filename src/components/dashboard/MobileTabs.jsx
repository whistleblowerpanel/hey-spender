import React from 'react';
import { Button } from '@/components/ui/button';
import { Gift, ShoppingBag, Wallet as WalletIcon, Settings } from 'lucide-react';

const MobileTabs = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'wishlists', label: 'Wishlists', icon: Gift },
    { id: 'claims', label: 'Claims', icon: ShoppingBag },
    { id: 'wallet', label: 'Wallet', icon: WalletIcon },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <Button
              key={tab.id}
              variant="ghost"
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center py-2 px-1 h-auto ${
                isActive 
                  ? 'text-brand-purple-dark bg-brand-purple-light/10' 
                  : 'text-gray-600 hover:text-brand-purple-dark'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{tab.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileTabs;
