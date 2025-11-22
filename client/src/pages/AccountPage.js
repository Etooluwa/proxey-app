import React, { useState, useEffect } from 'react';
import { Icons } from '../components/Icons';

const TRANSACTIONS = [
    { id: 't1', date: 'Oct 24, 2023', service: 'Deep Home Cleaning', provider: 'Sarah Jenkins', amount: 120.00, status: 'PAID', method: 'Visa ••4242' },
    { id: 't2', date: 'Sep 15, 2023', service: 'Furniture Assembly', provider: 'David Kim', amount: 150.00, status: 'PAID', method: 'Visa ••4242' },
    { id: 't3', date: 'Aug 30, 2023', service: 'Lawn Mowing', provider: 'Green Thumb Services', amount: 60.00, status: 'REFUNDED', method: 'Visa ••4242' },
    { id: 't4', date: 'Aug 12, 2023', service: 'Plumbing Repair', provider: 'Mike Ross', amount: 85.00, status: 'PAID', method: 'Mastercard ••8899' },
    { id: 't5', date: 'Jul 22, 2023', service: 'House Painting', provider: 'Jessica Pearson', amount: 300.00, status: 'PAID', method: 'Visa ••4242' },
    { id: 't6', date: 'Jun 10, 2023', service: 'Electrical Inspection', provider: 'Mike Ross', amount: 95.00, status: 'PAID', method: 'Visa ••4242' },
    { id: 't7', date: 'May 05, 2023', service: 'Garden Maintenance', provider: 'David Green', amount: 120.00, status: 'PAID', method: 'Paypal' },
    { id: 't8', date: 'Apr 18, 2023', service: 'Moving Service', provider: 'Elite Movers Inc.', amount: 450.00, status: 'PAID', method: 'Visa ••4242' },
    { id: 't9', date: 'Mar 02, 2023', service: 'Carpet Cleaning', provider: 'Clean Pro', amount: 80.00, status: 'PAID', method: 'Visa ••4242' },
];

const MOCK_PROFILE = {
    firstName: 'Alex',
    lastName: 'Johnson',
    email: 'alex.johnson@example.com',
    phone: '(555) 123-4567',
    bio: 'Just a regular person looking for great services.',
};

const AccountPage = () => {
    const [profileData, setProfileData] = useState(MOCK_PROFILE);
    const [viewMode, setViewMode] = useState('MAIN');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Profile Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [tempProfileData, setTempProfileData] = useState(profileData);

    useEffect(() => {
        if (!isEditing) {
            setTempProfileData(profileData);
        }
    }, [profileData, isEditing]);

    const handleEditClick = () => {
        setTempProfileData(profileData);
        setIsEditing(true);
    };

    const handleSaveClick = () => {
        setProfileData(tempProfileData);
        setIsEditing(false);
    };

    const handleCancelClick = () => {
        setIsEditing(false);
        setTempProfileData(profileData);
    };

    // --- VIEW: ALL TRANSACTIONS ---
    if (viewMode === 'TRANSACTIONS') {
        const filteredTransactions = TRANSACTIONS.filter(t => {
            const matchesSearch =
                t.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.provider.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = statusFilter === 'ALL' ? true : t.status === statusFilter;

            return matchesSearch && matchesStatus;
        });

        return (
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-8 duration-300 pb-12">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setViewMode('MAIN')}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors bg-white border border-gray-200 shadow-sm"
                    >
                        <Icons.ArrowLeft size={20} className="text-gray-700" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
                        <p className="text-gray-500 text-sm">View payments, refunds, and receipts.</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 bg-white p-2 rounded-xl border border-gray-200 flex items-center shadow-sm focus-within:ring-2 focus-within:ring-brand-100 transition-all">
                        <Icons.Search className="text-gray-400 ml-2" size={20} />
                        <input
                            type="text"
                            placeholder="Search by service or provider..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent border-none outline-none px-3 text-sm text-gray-700 placeholder-gray-400 h-full py-2"
                        />
                    </div>

                    <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                        {['ALL', 'PAID', 'REFUNDED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${statusFilter === status
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {status.charAt(0) + status.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Transaction List */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    {filteredTransactions.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                                        <th className="p-6 font-bold">Date</th>
                                        <th className="p-6 font-bold">Description</th>
                                        <th className="p-6 font-bold hidden md:table-cell">Method</th>
                                        <th className="p-6 font-bold">Status</th>
                                        <th className="p-6 font-bold text-right">Amount</th>
                                        <th className="p-6 font-bold text-center">Receipt</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredTransactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="p-6 text-sm font-bold text-gray-500 whitespace-nowrap">{tx.date}</td>
                                            <td className="p-6">
                                                <p className="font-bold text-gray-900 text-sm">{tx.service}</p>
                                                <p className="text-xs text-gray-500">{tx.provider}</p>
                                            </td>
                                            <td className="p-6 hidden md:table-cell">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Icons.Wallet size={16} className="text-gray-400" />
                                                    {tx.method}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${tx.status === 'PAID' ? 'bg-green-50 text-green-600 border-green-100' :
                                                        'bg-red-50 text-red-500 border-red-100'
                                                    }`}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                            <td className="p-6 text-right">
                                                <span className={`font-bold text-sm ${tx.status === 'REFUNDED' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                                    ${tx.amount.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="p-6 text-center">
                                                <button className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                                                    <Icons.Download size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Icons.Search className="text-gray-300" size={32} />
                            </div>
                            <h3 className="text-gray-900 font-bold text-lg">No transactions found</h3>
                            <p className="text-gray-500">Try adjusting your filters.</p>
                        </div>
                    )}
                </div>

                {/* Footer Note */}
                <div className="text-center text-xs text-gray-400">
                    <p>Need help with a transaction? <button className="text-brand-600 font-bold hover:underline">Contact Support</button></p>
                </div>
            </div>
        );
    }

    // --- VIEW: MAIN PROFILE DASHBOARD ---
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Left Col: Profile Card */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
                        <div className="relative inline-block mb-4">
                            <img
                                src="https://picsum.photos/seed/alex/150/150"
                                alt="Profile"
                                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                            />
                            <button
                                onClick={handleEditClick}
                                className="absolute bottom-0 right-0 p-2 bg-gray-900 text-white rounded-full hover:bg-brand-500 transition-colors border-2 border-white"
                            >
                                <Icons.Settings size={14} />
                            </button>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">{profileData.firstName} {profileData.lastName}</h2>
                        <p className="text-gray-500 text-sm mb-4">Member since 2023</p>

                        <div className="space-y-2 text-left mt-6">
                            <div className="flex items-center gap-3 text-sm text-gray-600 p-3 bg-gray-50 rounded-xl">
                                <Icons.Message size={16} className="text-gray-400" />
                                <span className="truncate">{profileData.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600 p-3 bg-gray-50 rounded-xl">
                                <Icons.User size={16} className="text-gray-400" />
                                <span>{profileData.phone}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Icons.Bell size={18} className="text-brand-500" /> Notifications
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Email Notifications</span>
                                <div className="w-10 h-5 bg-brand-500 rounded-full relative cursor-pointer">
                                    <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm"></div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">SMS Reminders</span>
                                <div className="w-10 h-5 bg-brand-500 rounded-full relative cursor-pointer">
                                    <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm"></div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Promotional Offers</span>
                                <div className="w-10 h-5 bg-gray-200 rounded-full relative cursor-pointer">
                                    <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Col: Details */}
                <div className="md:col-span-2 space-y-6">

                    {/* Personal Info */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-900 text-lg">Personal Information</h3>
                            {isEditing ? (
                                <div className="flex gap-2">
                                    <button onClick={handleCancelClick} className="px-3 py-1 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors">Cancel</button>
                                    <button onClick={handleSaveClick} className="px-4 py-1 rounded-lg text-sm font-bold bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow-sm">Save</button>
                                </div>
                            ) : (
                                <button onClick={handleEditClick} className="text-sm text-brand-600 font-bold hover:underline">Edit</button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">First Name</label>
                                <input
                                    type="text"
                                    value={isEditing ? tempProfileData.firstName : profileData.firstName}
                                    onChange={(e) => setTempProfileData({ ...tempProfileData, firstName: e.target.value })}
                                    readOnly={!isEditing}
                                    className={`w-full p-3 rounded-xl text-gray-700 outline-none transition-all ${isEditing ? 'bg-white border border-brand-200 ring-2 ring-brand-50' : 'bg-gray-50 border border-transparent'
                                        }`}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Last Name</label>
                                <input
                                    type="text"
                                    value={isEditing ? tempProfileData.lastName : profileData.lastName}
                                    onChange={(e) => setTempProfileData({ ...tempProfileData, lastName: e.target.value })}
                                    readOnly={!isEditing}
                                    className={`w-full p-3 rounded-xl text-gray-700 outline-none transition-all ${isEditing ? 'bg-white border border-brand-200 ring-2 ring-brand-50' : 'bg-gray-50 border border-transparent'
                                        }`}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email</label>
                                <input
                                    type="email"
                                    value={isEditing ? tempProfileData.email : profileData.email}
                                    onChange={(e) => setTempProfileData({ ...tempProfileData, email: e.target.value })}
                                    readOnly={!isEditing}
                                    className={`w-full p-3 rounded-xl text-gray-700 outline-none transition-all ${isEditing ? 'bg-white border border-brand-200 ring-2 ring-brand-50' : 'bg-gray-50 border border-transparent'
                                        }`}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Phone Number</label>
                                <input
                                    type="tel"
                                    value={isEditing ? tempProfileData.phone : profileData.phone}
                                    onChange={(e) => setTempProfileData({ ...tempProfileData, phone: e.target.value })}
                                    readOnly={!isEditing}
                                    className={`w-full p-3 rounded-xl text-gray-700 outline-none transition-all ${isEditing ? 'bg-white border border-brand-200 ring-2 ring-brand-50' : 'bg-gray-50 border border-transparent'
                                        }`}
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Bio</label>
                                <textarea
                                    value={isEditing ? tempProfileData.bio : profileData.bio}
                                    onChange={(e) => setTempProfileData({ ...tempProfileData, bio: e.target.value })}
                                    readOnly={!isEditing}
                                    className={`w-full p-3 rounded-xl text-gray-700 outline-none resize-none h-24 transition-all ${isEditing ? 'bg-white border border-brand-200 ring-2 ring-brand-50' : 'bg-gray-50 border border-transparent'
                                        }`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-900 text-lg">Payment Methods</h3>
                            <button className="text-sm bg-brand-50 text-brand-600 px-3 py-1 rounded-lg font-bold hover:bg-brand-100 transition-colors">
                                + Add New
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-8 bg-gray-900 rounded text-white flex items-center justify-center text-[10px] font-bold tracking-widest">
                                    VISA
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">•••• •••• •••• 4242</p>
                                    <p className="text-xs text-gray-500">Expires 12/25</p>
                                </div>
                            </div>
                            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full">DEFAULT</span>
                        </div>
                    </div>

                    {/* Transaction History Preview */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-900 text-lg">Transaction History</h3>
                            <button
                                onClick={() => setViewMode('TRANSACTIONS')}
                                className="text-sm text-gray-400 font-medium hover:text-gray-600 transition-colors"
                            >
                                View All
                            </button>
                        </div>
                        <div className="space-y-4">
                            {TRANSACTIONS.slice(0, 3).map(transaction => (
                                <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-50 rounded-xl bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-full ${transaction.status === 'REFUNDED' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                                            {transaction.status === 'REFUNDED' ? <Icons.LogOut size={18} className="transform rotate-180" /> : <Icons.Check size={18} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{transaction.service}</p>
                                            <p className="text-xs text-gray-500">{transaction.date} • {transaction.provider}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900 text-sm">
                                            {transaction.status === 'REFUNDED' ? '+' : '-'}${transaction.amount.toFixed(2)}
                                        </p>
                                        <button className="text-[10px] font-semibold text-brand-600 hover:underline mt-1">
                                            Download Receipt
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Account Actions / Logout - Moved to bottom */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4">Account Actions</h3>
                        <button className="w-full flex items-center justify-center gap-2 text-red-600 font-bold bg-red-50 py-3 rounded-xl hover:bg-red-100 transition-colors">
                            <Icons.LogOut size={18} />
                            Log Out
                        </button>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default AccountPage;
