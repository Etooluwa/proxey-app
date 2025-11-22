
import React from 'react';
import { Icons } from './Icons';
import { UserRole } from '../types';

interface MobileBottomNavProps {
  role: UserRole;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ role, activeTab, setActiveTab }) => {
  const clientLinks = [
    { id: 'home', label: 'Home', icon: Icons.Dashboard },
    { id: 'bookings', label: 'Bookings', icon: Icons.Calendar },
    { id: 'messages', label: 'Messages', icon: Icons.Message },
    { id: 'profile', label: 'Profile', icon: Icons.User },
  ];

  const providerLinks = [
    { id: 'dashboard', label: 'Home', icon: Icons.Dashboard },
    { id: 'schedule', label: 'Schedule', icon: Icons.Calendar },
    { id: 'earnings', label: 'Earn', icon: Icons.Wallet },
    { id: 'messages', label: 'Chat', icon: Icons.Message },
    { id: 'services', label: 'Services', icon: Icons.Wrench },
    { id: 'profile', label: 'Profile', icon: Icons.User },
  ];

  const links = role === UserRole.CLIENT ? clientLinks : providerLinks;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe-area safe-area-bottom">
      <div className="flex justify-around items-center h-16 px-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = activeTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => setActiveTab(link.id)}
              className={`flex-1 flex flex-col items-center justify-center h-full py-1 transition-colors active:scale-95 ${
                isActive ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon 
                size={role === UserRole.PROVIDER ? 20 : 24} 
                className={`mb-1 ${isActive ? 'fill-brand-50' : ''}`} 
                strokeWidth={isActive ? 2.5 : 2} 
              />
              <span className={`font-medium leading-tight ${role === UserRole.PROVIDER ? 'text-[9px]' : 'text-[10px]'}`}>
                {link.label}
              </span>
            </button>
          );
        })}
      </div>
      {/* Spacer for iPhone Home Indicator if needed, though usually handled by body padding/safe-area */}
    </div>
  );
};
