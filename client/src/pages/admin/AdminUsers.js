import React, { useEffect, useState } from 'react';
import { Icons } from '../../components/Icons';
import { fetchAdminUsers, toggleUserActive } from '../../data/admin';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const role = filter === 'all' ? undefined : filter;
            const data = await fetchAdminUsers({ role, search, page, limit: 20 });
            setUsers(data.users || []);
            setTotalPages(data.totalPages || 1);
        } catch (error) {
            console.error("Failed to load users", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter, page]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        loadUsers();
    };

    const handleToggleActive = async (userId) => {
        try {
            await toggleUserActive(userId);
            loadUsers();
        } catch (error) {
            console.error("Failed to toggle user status", error);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Users</h1>
                <p className="text-gray-500 mt-1">Manage all platform users</p>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <form onSubmit={handleSearch} className="flex-1">
                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
                            <Icons.Search size={18} className="text-gray-400 mr-3" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-transparent outline-none text-sm w-full placeholder-gray-400"
                            />
                            <button type="submit" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                                Search
                            </button>
                        </div>
                    </form>

                    {/* Role Filter */}
                    <div className="flex gap-2">
                        {['all', 'provider', 'client'].map((f) => (
                            <button
                                key={f}
                                onClick={() => { setFilter(f); setPage(1); }}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                                    filter === f
                                        ? 'bg-brand-500 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {f === 'all' ? 'All' : f === 'provider' ? 'Providers' : 'Clients'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Icons.Loader className="w-8 h-8 animate-spin text-brand-500" />
                    </div>
                ) : users.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">User</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Email</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Role</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">City</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Joined</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=random`}
                                                    alt=""
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                                <span className="font-medium text-gray-900">{user.name || 'Unnamed'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                user.role === 'provider' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                            }`}>
                                                {user.role === 'provider' ? 'Provider' : 'Client'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{user.city || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                user.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {user.is_active !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.role === 'provider' && (
                                                <button
                                                    onClick={() => handleToggleActive(user.id)}
                                                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                                                        user.is_active !== false
                                                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                                                    }`}
                                                >
                                                    {user.is_active !== false ? 'Deactivate' : 'Activate'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <Icons.Users size={32} className="text-gray-300 mb-2" />
                        <p>No users found</p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUsers;
