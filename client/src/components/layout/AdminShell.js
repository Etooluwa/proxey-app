import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useSession } from '../../auth/authContext';
import {
  SquaresFour,
  ChartBar,
  Users,
  CalendarBlank,
  Scales,
  Wrench,
  Star,
  CurrencyDollar,
  Tag,
  SignOut,
  List,
  X,
} from '@phosphor-icons/react';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: SquaresFour, end: true },
  { to: '/admin/analytics', label: 'Analytics', icon: ChartBar },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarBlank },
  { to: '/admin/disputes', label: 'Disputes', icon: Scales },
  { to: '/admin/services', label: 'Services', icon: Wrench },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/revenue', label: 'Revenue', icon: CurrencyDollar },
  { to: '/admin/promotions', label: 'Promotions', icon: Tag },
];

const AdminShell = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { session, signOut } = useSession();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
      isActive
        ? 'bg-[#C25E4A]/10 text-[#C25E4A]'
        : 'text-[#8C6A64] hover:text-[#3D231E] hover:bg-[#F2EBE5]'
    }`;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-[rgba(140,106,100,0.15)]">
        <span
          className="text-xl font-semibold text-[#3D231E]"
          style={{ fontFamily: 'Sora, sans-serif', letterSpacing: '-0.03em' }}
        >
          kliques
        </span>
        <span className="ml-2 text-[10px] uppercase tracking-widest font-semibold text-[#C25E4A] bg-[#C25E4A]/10 px-2 py-0.5 rounded-full align-middle">
          admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={linkClass} onClick={() => setMenuOpen(false)}>
            <Icon size={18} weight="regular" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-[rgba(140,106,100,0.15)]">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-[#8C6A64] hover:text-[#3D231E] hover:bg-[#F2EBE5] transition-colors"
        >
          <SignOut size={18} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen font-sans" style={{ background: '#FBF7F2', fontFamily: 'Sora, sans-serif' }}>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-col flex-shrink-0 border-r border-[rgba(140,106,100,0.15)]" style={{ background: '#FBF7F2' }}>
        <SidebarContent />
      </aside>

      {/* Mobile off-canvas */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/30" onClick={() => setMenuOpen(false)} />
          <aside className="relative w-64 flex flex-col border-r border-[rgba(140,106,100,0.15)]" style={{ background: '#FBF7F2' }}>
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-[#F2EBE5] text-[#8C6A64]"
            >
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-5 border-b border-[rgba(140,106,100,0.15)] bg-[#FBF7F2] sticky top-0 z-30">
          <button
            className="md:hidden p-1.5 rounded-lg hover:bg-[#F2EBE5] text-[#C25E4A]"
            onClick={() => setMenuOpen(true)}
          >
            <List size={22} weight="bold" />
          </button>
          <div className="md:hidden absolute left-1/2 -translate-x-1/2">
            <span className="text-base font-semibold text-[#3D231E]" style={{ letterSpacing: '-0.03em' }}>
              kliques
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className="text-sm text-[#8C6A64]">
              {session?.user?.email}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
              style={{ background: '#C25E4A' }}
            >
              {(session?.user?.email?.[0] || 'A').toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-5 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminShell;
