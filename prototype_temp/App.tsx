
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ClientDashboard } from './views/ClientDashboard';
import { ClientBookings } from './views/ClientBookings';
import { ClientMessages } from './views/ClientMessages';
import { ClientProfile } from './views/ClientProfile';
import { ProviderPublicProfile } from './views/ProviderPublicProfile';
import { ProviderDashboard } from './views/ProviderDashboard';
import { ProviderSchedule } from './views/ProviderSchedule';
import { ProviderEarnings } from './views/ProviderEarnings';
import { ProviderMessages } from './views/ProviderMessages';
import { ProviderServices } from './views/ProviderServices';
import { ProviderAvailability } from './views/ProviderAvailability';
import { ProviderProfile } from './views/ProviderProfile';
import { ProviderCreatePromotion } from './views/ProviderCreatePromotion';
import { NotificationPanel } from './components/NotificationPanel';
import { UserRole, Booking, BookingStatus, UserProfile, ScheduleDay, DateOverride } from './types';
import { Icons } from './components/Icons';
import { CLIENT_BOOKINGS, PROVIDER_REQUESTS } from './constants';

// Initial Mock Data for Client Bookings (Moved from ClientBookings.tsx to here for shared state)
const INITIAL_CLIENT_BOOKINGS: Booking[] = [
  {
    id: '1',
    providerId: 'p1',
    serviceName: 'Deep Home Cleaning',
    providerName: 'Sarah Jenkins',
    providerAvatar: 'https://picsum.photos/seed/sarah/100/100',
    date: 'Oct 24, 2023',
    time: '10:00 AM',
    status: BookingStatus.CONFIRMED,
    price: 120,
    location: '123 Main St, San Francisco',
  },
  {
    id: '2',
    providerId: 'p2',
    serviceName: 'Plumbing Repair',
    providerName: 'Mike Ross',
    providerAvatar: 'https://picsum.photos/seed/mike/100/100',
    date: 'Oct 28, 2023',
    time: '2:00 PM',
    status: BookingStatus.PENDING,
    price: 85,
    location: '123 Main St, San Francisco',
  },
  {
    id: '3',
    providerId: 'p5',
    serviceName: 'Furniture Assembly',
    providerName: 'David Kim',
    providerAvatar: 'https://picsum.photos/seed/david/100/100',
    date: 'Sep 15, 2023',
    time: '11:00 AM',
    status: BookingStatus.COMPLETED,
    price: 150,
    location: '123 Main St, San Francisco',
  },
  {
    id: '4',
    providerId: 'p5',
    serviceName: 'Lawn Mowing',
    providerName: 'Green Thumb Services',
    providerAvatar: 'https://picsum.photos/seed/green/100/100',
    date: 'Aug 30, 2023',
    time: '09:00 AM',
    status: BookingStatus.CANCELLED,
    price: 60,
    location: '123 Main St, San Francisco',
  }
];

const INITIAL_SCHEDULE: ScheduleDay[] = [
  { id: 'mon', label: 'Monday', active: true, start: '09:00 AM', end: '05:00 PM' },
  { id: 'tue', label: 'Tuesday', active: true, start: '09:00 AM', end: '05:00 PM' },
  { id: 'wed', label: 'Wednesday', active: true, start: '09:00 AM', end: '05:00 PM' },
  { id: 'thu', label: 'Thursday', active: true, start: '09:00 AM', end: '05:00 PM' },
  { id: 'fri', label: 'Friday', active: true, start: '09:00 AM', end: '05:00 PM' },
  { id: 'sat', label: 'Saturday', active: false, start: '10:00 AM', end: '02:00 PM' },
  { id: 'sun', label: 'Sunday', active: false, start: '10:00 AM', end: '02:00 PM' },
];

function App() {
  const [role, setRole] = useState<UserRole>(UserRole.CLIENT);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  // Shared State
  const [clientBookings, setClientBookings] = useState<Booking[]>(INITIAL_CLIENT_BOOKINGS);
  const [providerRequests, setProviderRequests] = useState<Booking[]>(PROVIDER_REQUESTS);

  // Client Profile State
  const [clientProfile, setClientProfile] = useState<UserProfile>({
    firstName: 'Alex',
    lastName: 'Johnson',
    email: 'alex.j@example.com',
    phone: '+1 (555) 123-4567',
    bio: 'Just a regular guy looking for good services in the Bay Area.'
  });

  // Provider Schedule State
  const [providerSchedule, setProviderSchedule] = useState<ScheduleDay[]>(INITIAL_SCHEDULE);
  const [providerExceptions, setProviderExceptions] = useState<DateOverride[]>([
    { id: 1, date: '2023-12-25', reason: 'Christmas Holiday' }
  ]);
  
  // Presentation Mode state
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPresentationMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleRole = (newRole: UserRole) => {
    setRole(newRole);
    setActiveTab(newRole === UserRole.CLIENT ? 'home' : 'dashboard');
    setNotificationsOpen(false);
  };

  const handleProviderClick = (providerId: string) => {
    setSelectedProviderId(providerId);
    setActiveTab('provider-public-profile');
  };

  // Handle new booking creation from Client side
  const handleNewBooking = (bookingData: Partial<Booking>) => {
    const newBooking: Booking = {
      id: Math.random().toString(36).substr(2, 9),
      providerId: bookingData.providerId,
      serviceName: bookingData.serviceName || 'Service',
      providerName: bookingData.providerName || 'Provider',
      providerAvatar: bookingData.providerAvatar || 'https://picsum.photos/200',
      clientName: 'Alex Johnson', // Current User
      clientAvatar: 'https://picsum.photos/seed/alex/100/100',
      date: bookingData.date || 'Oct 30, 2023',
      time: bookingData.time || '10:00 AM',
      status: BookingStatus.PENDING,
      price: bookingData.price || 0,
      location: '123 Main St, San Francisco'
    };

    // Add to Client's list
    setClientBookings(prev => [newBooking, ...prev]);

    // Add to Provider's list (Mocking that every booking goes to the current logged in provider for demo purposes)
    setProviderRequests(prev => [newBooking, ...prev]);
  };

  const handleUpdateBooking = (updatedBooking: Booking) => {
    setClientBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
    // Also update provider view if needed
    setProviderRequests(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
  };

  const handleContentClick = () => {
    if (notificationsOpen) setNotificationsOpen(false);
  };

  // Routing helper for Client Views
  const renderClientContent = () => {
    switch (activeTab) {
      case 'home':
        return <ClientDashboard bookings={clientBookings} onProviderClick={handleProviderClick} onNavigate={setActiveTab} />;
      case 'bookings':
        return <ClientBookings bookings={clientBookings} onUpdateBooking={handleUpdateBooking} onProviderClick={handleProviderClick} />;
      case 'messages':
        return <ClientMessages />;
      case 'profile':
        return <ClientProfile profileData={clientProfile} onUpdateProfile={setClientProfile} />;
      case 'provider-public-profile':
        return (
          <ProviderPublicProfile 
            providerId={selectedProviderId} 
            onBack={() => setActiveTab('bookings')} 
            onBook={handleNewBooking}
          />
        );
      default:
        return <ClientDashboard bookings={clientBookings} onProviderClick={handleProviderClick} onNavigate={setActiveTab} />;
    }
  };

  // Routing helper for Provider Views
  const renderProviderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ProviderDashboard requests={providerRequests} onNavigate={setActiveTab} />;
      case 'schedule':
        return <ProviderSchedule />;
      case 'earnings':
        return <ProviderEarnings />;
      case 'messages':
        return <ProviderMessages />;
      case 'services':
        return <ProviderServices />;
      case 'availability':
        return (
          <ProviderAvailability 
            schedule={providerSchedule}
            exceptions={providerExceptions}
            onUpdateSchedule={setProviderSchedule}
            onUpdateExceptions={setProviderExceptions}
          />
        );
      case 'profile':
        return <ProviderProfile />;
      case 'create-promotion':
        return <ProviderCreatePromotion onBack={() => setActiveTab('dashboard')} />;
      default:
        return <ProviderDashboard requests={providerRequests} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800 relative">
      
      {/* Sidebar is now always visible (hidden on mobile via CSS), even in Presentation Mode */}
      <Sidebar role={role} activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col overflow-hidden" onClick={handleContentClick}>
        
        {!isPresentationMode && (
          <header className="h-16 md:h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-10 sticky top-0 z-30 relative">
            <div className="flex items-center gap-4">
              <div className="md:hidden flex items-center gap-2">
                <div className="w-6 h-6 bg-brand-400 rounded-md transform rotate-45 flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-sm transform -rotate-45"></div>
                </div>
                <h1 className="text-xl font-bold text-gray-800 tracking-tight">Kliques</h1>
              </div>
              
              <div className="hidden md:flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 w-64 lg:w-96 transition-all focus-within:ring-2 focus-within:ring-brand-100 focus-within:border-brand-300">
                 <Icons.Search size={18} className="text-gray-400 mr-3" />
                 <input type="text" placeholder="Search..." className="bg-transparent outline-none text-sm w-full placeholder-gray-400 text-gray-700" />
              </div>
            </div>

            <div className="flex items-center gap-3 md:gap-6 relative">
              <div className="hidden md:flex items-center gap-2 text-gray-400 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                <Icons.MapPin size={16} className="text-brand-500" />
                <span className="text-sm text-gray-600 font-medium">San Francisco, CA</span>
              </div>
              
              <div className="relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setNotificationsOpen(!notificationsOpen);
                  }}
                  className={`relative p-2 rounded-full transition-colors ${notificationsOpen ? 'bg-brand-50 text-brand-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                >
                  <Icons.Bell size={20} />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>
              </div>

              <div className="flex items-center gap-3 pl-2 md:pl-4 border-l border-gray-100">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-bold text-gray-900">
                    {role === UserRole.CLIENT ? `${clientProfile.firstName} ${clientProfile.lastName}` : 'Jane Doe'}
                  </p>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{role === UserRole.CLIENT ? 'Member' : 'Provider'}</p>
                </div>
                <img 
                  src={role === UserRole.CLIENT 
                    ? "https://picsum.photos/seed/alex/100/100" 
                    : "https://picsum.photos/seed/jane/100/100"
                  } 
                  alt="Profile" 
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white shadow-sm object-cover"
                />
              </div>
            </div>

            {notificationsOpen && (
              <div onClick={(e) => e.stopPropagation()}>
                 <NotificationPanel role={role} onClose={() => setNotificationsOpen(false)} />
              </div>
            )}

          </header>
        )}

        <main className={`flex-1 overflow-y-auto p-4 md:p-10 scroll-smooth pb-24 md:pb-10 ${isPresentationMode ? 'bg-gray-50' : ''}`}>
          {role === UserRole.CLIENT 
            ? renderClientContent() 
            : renderProviderContent()
          }
        </main>

        <MobileBottomNav role={role} activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {!isPresentationMode && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900/90 backdrop-blur-md text-white p-2 rounded-2xl shadow-2xl z-50 flex items-center gap-2 border border-white/10 ring-1 ring-black/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="px-3 py-1 border-r border-white/20 hidden md:block">
            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Mockup Controls</p>
          </div>

          <button 
            onClick={() => toggleRole(UserRole.CLIENT)}
            className={`px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-2 ${role === UserRole.CLIENT ? 'bg-white text-gray-900' : 'hover:bg-white/10 text-gray-300'}`}
          >
            <Icons.User size={14} />
            Client
          </button>

          <button 
            onClick={() => toggleRole(UserRole.PROVIDER)}
            className={`px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-2 ${role === UserRole.PROVIDER ? 'bg-white text-gray-900' : 'hover:bg-white/10 text-gray-300'}`}
          >
            <Icons.Dashboard size={14} />
            Provider
          </button>

          <div className="w-px h-6 bg-white/20 mx-1"></div>

          <button 
            onClick={() => setIsPresentationMode(true)}
            className="p-2 md:px-4 md:py-2 rounded-xl text-sm font-semibold bg-brand-500 hover:bg-brand-400 text-white transition-all flex items-center gap-2 shadow-lg shadow-brand-500/20"
            title="Hide UI for Screenshot"
          >
            <Icons.Camera size={16} /> <span className="hidden md:inline">Hide UI</span>
          </button>

        </div>
      )}

      {isPresentationMode && (
        <div className="fixed bottom-4 right-4 bg-black/30 text-white px-3 py-1 rounded-full text-xs pointer-events-none backdrop-blur-sm z-50">
          Press ESC to show controls
        </div>
      )}

    </div>
  );
}

export default App;
