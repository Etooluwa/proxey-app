import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { Icons } from '../Icons';
import { useSession } from '../../auth/authContext';

const AdminShell = () => {
    const navigate = useNavigate();
    const { session, profile } = useSession();

    const displayName = profile?.name || session?.user?.email?.split('@')[0] || 'Admin';
    const displayPhoto = profile?.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-gray-800 relative">
            <Sidebar role="admin" />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <header className="h-16 md:h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-10 sticky top-0 z-30 relative">
                    <div className="flex items-center gap-4">
                        <div className="md:hidden flex items-center gap-2">
                            <div className="w-6 h-6 bg-brand-400 rounded-md transform rotate-45 flex items-center justify-center">
                                <div className="w-3 h-3 bg-white rounded-sm transform -rotate-45"></div>
                            </div>
                            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Kliques</h1>
                        </div>

                        <div className="hidden md:flex items-center gap-2">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                                Admin
                            </span>
                        </div>

                        <div className="hidden md:flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 w-64 lg:w-96 transition-all focus-within:ring-2 focus-within:ring-brand-100 focus-within:border-brand-300">
                            <Icons.Search size={18} className="text-gray-400 mr-3" />
                            <input type="text" placeholder="Search..." className="bg-transparent outline-none text-sm w-full placeholder-gray-400 text-gray-700" />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-6 relative">
                        <button
                            onClick={() => navigate('/admin/users')}
                            className="flex items-center gap-3 pl-2 md:pl-4 border-l border-gray-100 hover:bg-gray-50 rounded-xl transition-colors p-1"
                        >
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-gray-900">{displayName}</p>
                            </div>
                            <img
                                src={displayPhoto}
                                alt="Profile"
                                className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white shadow-sm object-cover"
                            />
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-10 scroll-smooth pb-24 md:pb-10">
                    <Outlet />
                </main>

                <MobileBottomNav role="admin" />
            </div>
        </div>
    );
};

export default AdminShell;
