import React, { useEffect, useState } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { fetchAdminUsers, toggleUserActive } from '../../data/admin';

const INK = '#3D231E';
const MUTED = '#8C6A64';
const FADED = '#B0948F';
const ACCENT = '#C25E4A';
const LINE = 'rgba(140,106,100,0.2)';
const AVATAR_BG = '#F2EBE5';

const Pill = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className="px-4 py-1.5 rounded-full text-xs font-medium transition-colors"
    style={{
      background: active ? INK : AVATAR_BG,
      color: active ? '#fff' : MUTED,
    }}
  >
    {children}
  </button>
);

const roleBadge = (role) => ({
  background: role === 'provider' ? '#EBF0FA' : '#EBF2EC',
  color: role === 'provider' ? '#4A6CA8' : '#5A8A5E',
});

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
    } catch (err) {
      console.error('Failed to load users', err);
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

  const handleToggle = async (userId) => {
    try {
      await toggleUserActive(userId);
      loadUsers();
    } catch (err) {
      console.error('Failed to toggle user status', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold" style={{ color: INK, letterSpacing: '-0.03em' }}>
          Users
        </h1>
        <p className="text-sm mt-1" style={{ color: MUTED }}>Manage all platform users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex gap-2">
          {['all', 'provider', 'client'].map((f) => (
            <Pill key={f} active={filter === f} onClick={() => { setFilter(f); setPage(1); }}>
              {f === 'all' ? 'All' : f === 'provider' ? 'Providers' : 'Clients'}
            </Pill>
          ))}
        </div>
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-sm">
          <div
            className="flex items-center flex-1 px-3 py-2 rounded-xl gap-2"
            style={{ border: `1px solid ${LINE}`, background: '#FBF7F2' }}
          >
            <MagnifyingGlass size={16} style={{ color: FADED }} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-sm flex-1"
              style={{ color: INK }}
            />
          </div>
          <button
            type="submit"
            className="text-xs font-medium px-3 py-2 rounded-xl"
            style={{ background: INK, color: '#fff' }}
          >
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: LINE, borderTopColor: ACCENT }} />
          </div>
        ) : users.length > 0 ? (
          <div>
            {/* Table header */}
            <div
              className="grid gap-4 px-4 py-3 text-[11px] uppercase tracking-widest font-medium"
              style={{
                gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr',
                borderBottom: `1px solid ${LINE}`,
                color: FADED,
              }}
            >
              <span>User</span>
              <span>Email</span>
              <span>Role</span>
              <span>Status</span>
              <span>Joined</span>
              <span>Actions</span>
            </div>
            {users.map((user) => (
              <div
                key={user.id}
                className="grid gap-4 px-4 py-4 items-center"
                style={{
                  gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr',
                  borderBottom: `1px solid ${LINE}`,
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold text-white"
                    style={{ background: ACCENT }}
                  >
                    {(user.name || user.email || 'U')[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium truncate" style={{ color: INK }}>
                    {user.name || 'Unnamed'}
                  </span>
                </div>
                <span className="text-sm truncate" style={{ color: MUTED }}>{user.email}</span>
                <span>
                  <span
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                    style={roleBadge(user.role)}
                  >
                    {user.role === 'provider' ? 'Provider' : 'Client'}
                  </span>
                </span>
                <span>
                  <span
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background: user.is_active !== false ? '#EBF2EC' : '#FDEDEA',
                      color: user.is_active !== false ? '#5A8A5E' : '#A04030',
                    }}
                  >
                    {user.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </span>
                <span className="text-xs" style={{ color: MUTED }}>
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                </span>
                <span>
                  {user.role === 'provider' && (
                    <button
                      onClick={() => handleToggle(user.id)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                      style={{
                        background: user.is_active !== false ? '#FDEDEA' : '#EBF2EC',
                        color: user.is_active !== false ? '#A04030' : '#5A8A5E',
                      }}
                    >
                      {user.is_active !== false ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center py-16 rounded-xl"
            style={{ border: `1px dashed ${LINE}` }}
          >
            <p className="text-sm" style={{ color: MUTED }}>No users found</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-xs font-medium px-4 py-2 rounded-xl disabled:opacity-40"
              style={{ background: AVATAR_BG, color: INK }}
            >
              Previous
            </button>
            <span className="text-xs" style={{ color: MUTED }}>Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-xs font-medium px-4 py-2 rounded-xl disabled:opacity-40"
              style={{ background: AVATAR_BG, color: INK }}
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
