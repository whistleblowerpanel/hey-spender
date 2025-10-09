import React, { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const BottomNavbar = ({ tabs }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab from current URL
  const activeTab = tabs.find(tab => location.pathname === tab.path)?.value || tabs[0].value;

  // Float above safe-area
  const bottomOffsetStyle = { bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' };

  // Navigate to tab path
  const handleTabClick = useCallback((tab) => {
    if (location.pathname !== tab.path) {
      navigate(tab.path);
    }
  }, [location.pathname, navigate]);

  return (
    <div className="fixed left-0 right-0 z-50 px-4" style={bottomOffsetStyle}>
      <nav className="max-w-7xl mx-auto bg-brand-purple-dark/95 border-2 border-black backdrop-blur-sm">
        <div className="flex items-stretch">
          {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;

              return (
                <motion.div
                  key={tab.value}
                  layout
                  transition={{ 
                    type: 'spring', 
                    stiffness: 400, 
                    damping: 30,
                    mass: 0.8
                  }}
                  style={{ flex: isActive ? 1.6 : 1 }}
                  className="relative"
                  initial={false}
                >
                  {isActive && (
                    <motion.div
                      layoutId="segmentedPill"
                      className="absolute inset-0 bg-brand-green ring-1 ring-black/10"
                      transition={{ 
                        type: 'spring', 
                        stiffness: 400, 
                        damping: 30,
                        mass: 0.8
                      }}
                    />
                  )}

                  <button
                    onClick={() => handleTabClick(tab)}
                    className="relative w-full h-full flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-3.5 focus:outline-none select-none transition-colors duration-200"
                    disabled={isActive}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3 leading-none">
                      <motion.div
                        animate={{ 
                          scale: isActive ? 1.1 : 1,
                          rotate: isActive ? 0 : 0
                        }}
                        transition={{ 
                          type: 'spring', 
                          stiffness: 400, 
                          damping: 25 
                        }}
                      >
                        <Icon className={`w-5 h-5 sm:w-[18px] sm:h-[18px] transition-colors duration-200 ${isActive ? 'text-black' : 'text-white/85'}`} />
                      </motion.div>
                      <motion.span
                        initial={false}
                        animate={{ 
                          opacity: isActive ? 1 : 0, 
                          width: isActive ? 'auto' : 0,
                          marginLeft: isActive ? 8 : 0
                        }}
                        transition={{ 
                          duration: 0.25,
                          ease: 'easeInOut'
                        }}
                        className={`${isActive ? 'text-black' : 'text-white/85'} overflow-hidden whitespace-nowrap text-sm sm:text-[15px] font-semibold transition-colors duration-200`}
                      >
                        {tab.label}
                      </motion.span>
                    </span>
                  </button>
                </motion.div>
              );
          })}
        </div>
      </nav>
    </div>
  );
};

export default BottomNavbar;

