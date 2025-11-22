
import React from 'react';
import { Icons } from './Icons';
import { UserRole } from '../types';

interface SidebarProps {
  role: UserRole;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ role, activeTab, setActiveTab }) => {
  const clientLinks = [
    { id: 'home', label: 'Home', icon: Icons.Dashboard },
    { id: 'bookings', label: 'My Bookings', icon: Icons.Calendar },
    { id: 'messages', label: 'Messages', icon: Icons.Message },
    { id: 'profile', label: 'Profile', icon: Icons.User },
  ];

  const providerLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.Dashboard },
    { id: 'schedule', label: 'Schedule', icon: Icons.Calendar },
    { id: 'earnings', label: 'Earnings', icon: Icons.Wallet },
    { id: 'messages', label: 'Messages', icon: Icons.Message },
    { id: 'services', label: 'My Services', icon: Icons.Wrench },
    { id: 'profile', label: 'Profile', icon: Icons.User },
  ];

  const links = role === UserRole.CLIENT ? clientLinks : providerLinks;

  return (
    <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 h-full sticky top-0">
      <div className="p-8 flex items-center gap-2">
        {/* Logo Mockup */}
        <div className="w-8 h-8 bg-brand-400 rounded-lg transform rotate-45 flex items-center justify-center">
          <div className="w-4 h-4 bg-white rounded-sm transform -rotate-45"></div>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Kliques</h1>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-4">
          Menu
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = activeTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => setActiveTab(link.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-brand-50 text-brand-600 font-semibold shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-brand-500' : 'text-gray-400'} />
              <span>{link.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors">
          <Icons.LogOut size={20} />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};