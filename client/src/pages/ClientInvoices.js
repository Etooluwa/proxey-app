import { useEffect, useState } from 'react';
import { Icons } from '../components/Icons';
import { useSession } from '../auth/authContext';

const ClientInvoices = () => {
    const { session } = useSession();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);

    useEffect(() => {
        loadInvoices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadInvoices = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/client/invoices', {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch invoices');
            }

            const data = await response.json();
            setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
        } catch (error) {
            console.error('Failed to load invoices:', error);
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    };

    // Format date nicely
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Get status badge styling
    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'paid':
            case 'succeeded':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'overdue':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'cancelled':
            case 'refunded':
                return 'bg-gray-100 text-gray-600 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    // Format currency
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '$0.00';
        // Assume amount is in cents
        const dollars = typeof amount === 'number' ? amount / 100 : parseFloat(amount) / 100;
        return `$${dollars.toFixed(2)}`;
    };

    // Download invoice PDF
    const handleDownloadInvoice = async (invoice) => {
        setDownloadingId(invoice.id);
        try {
            const response = await fetch(`/api/bookings/${invoice.booking_id}/invoice`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to generate invoice');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${invoice.invoice_number || invoice.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Failed to download invoice:', error);
            alert('Failed to download invoice. Please try again.');
        } finally {
            setDownloadingId(null);
        }
    };

    // Filter and sort invoices
    const filteredInvoices = invoices
        .filter(inv => {
            // Status filter
            if (statusFilter !== 'all') {
                const invStatus = inv.payment_status?.toLowerCase() || inv.status?.toLowerCase();
                if (statusFilter === 'paid' && !['paid', 'succeeded'].includes(invStatus)) return false;
                if (statusFilter === 'pending' && invStatus !== 'pending') return false;
                if (statusFilter === 'overdue' && invStatus !== 'overdue') return false;
            }

            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesNumber = (inv.invoice_number || '').toLowerCase().includes(query);
                const matchesProvider = (inv.provider_name || '').toLowerCase().includes(query);
                const matchesService = (inv.service_name || '').toLowerCase().includes(query);
                if (!matchesNumber && !matchesProvider && !matchesService) return false;
            }

            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'newest') {
                return new Date(b.created_at || b.issued_at) - new Date(a.created_at || a.issued_at);
            } else if (sortBy === 'oldest') {
                return new Date(a.created_at || a.issued_at) - new Date(b.created_at || b.issued_at);
            } else if (sortBy === 'highest') {
                return (b.price || b.total_amount || 0) - (a.price || a.total_amount || 0);
            } else if (sortBy === 'lowest') {
                return (a.price || a.total_amount || 0) - (b.price || b.total_amount || 0);
            }
            return 0;
        });

    // Calculate totals
    const totalPaid = invoices
        .filter(inv => ['paid', 'succeeded'].includes(inv.payment_status?.toLowerCase() || inv.status?.toLowerCase()))
        .reduce((sum, inv) => sum + (inv.price || inv.total_amount || 0), 0);

    const totalPending = invoices
        .filter(inv => inv.payment_status?.toLowerCase() === 'pending' || inv.status?.toLowerCase() === 'pending')
        .reduce((sum, inv) => sum + (inv.price || inv.total_amount || 0), 0);

    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
            <div className="px-4 md:px-10 py-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Invoices</h1>
                        <p className="text-gray-600">View and download your payment history</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-2xl p-6 border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Icons.FileText size={24} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Invoices</p>
                                <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <Icons.Check size={24} className="text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Paid</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPaid)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                                <Icons.Clock size={24} className="text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Pending</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPending)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl p-4 md:p-6 mb-6 border border-gray-100">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Icons.Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search invoices..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 transition-all"
                            />
                        </div>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 font-medium text-gray-700"
                        >
                            <option value="all">All Status</option>
                            <option value="paid">Paid</option>
                            <option value="pending">Pending</option>
                            <option value="overdue">Overdue</option>
                        </select>

                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 font-medium text-gray-700"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="highest">Highest Amount</option>
                            <option value="lowest">Lowest Amount</option>
                        </select>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
                        <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading invoices...</p>
                    </div>
                )}

                {/* Invoices List */}
                {!loading && filteredInvoices.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr className="text-left text-xs uppercase tracking-wider text-gray-500 font-bold">
                                        <th className="px-6 py-4">Invoice</th>
                                        <th className="px-6 py-4">Provider / Service</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Amount</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredInvoices.map((invoice) => (
                                        <tr key={invoice.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-gray-900">
                                                    {invoice.invoice_number || `INV-${invoice.id?.substring(0, 8).toUpperCase()}`}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900">{invoice.provider_name || 'Provider'}</p>
                                                <p className="text-sm text-gray-500">{invoice.service_name || 'Service'}</p>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {formatDate(invoice.created_at || invoice.issued_at || invoice.scheduled_at)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-gray-900">
                                                    {formatCurrency(invoice.price || invoice.total_amount)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(invoice.payment_status || invoice.status)}`}>
                                                    {(invoice.payment_status || invoice.status || 'Unknown').toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setSelectedInvoice(selectedInvoice?.id === invoice.id ? null : invoice)}
                                                        className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Icons.Eye size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownloadInvoice(invoice)}
                                                        disabled={downloadingId === invoice.id}
                                                        className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Download PDF"
                                                    >
                                                        {downloadingId === invoice.id ? (
                                                            <div className="w-4 h-4 border-2 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
                                                        ) : (
                                                            <Icons.Download size={18} />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {filteredInvoices.map((invoice) => (
                                <div key={invoice.id} className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="font-bold text-gray-900">
                                                {invoice.invoice_number || `INV-${invoice.id?.substring(0, 8).toUpperCase()}`}
                                            </p>
                                            <p className="text-sm text-gray-500">{invoice.provider_name || 'Provider'}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(invoice.payment_status || invoice.status)}`}>
                                            {(invoice.payment_status || invoice.status || 'Unknown').toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-500">{formatDate(invoice.created_at || invoice.issued_at)}</p>
                                            <p className="text-lg font-bold text-gray-900">{formatCurrency(invoice.price || invoice.total_amount)}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDownloadInvoice(invoice)}
                                            disabled={downloadingId === invoice.id}
                                            className="px-4 py-2 bg-orange-50 text-orange-600 rounded-xl font-semibold text-sm flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {downloadingId === invoice.id ? (
                                                <div className="w-4 h-4 border-2 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
                                            ) : (
                                                <>
                                                    <Icons.Download size={16} />
                                                    Download
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && filteredInvoices.length === 0 && (
                    <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Icons.FileText size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {searchQuery || statusFilter !== 'all' ? 'No invoices found' : 'No invoices yet'}
                        </h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                            {searchQuery || statusFilter !== 'all'
                                ? 'Try adjusting your search or filters.'
                                : 'When you complete bookings, your invoices will appear here.'}
                        </p>
                    </div>
                )}

                {/* Invoice Detail Modal */}
                {selectedInvoice && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h2 className="text-lg font-bold text-gray-900">Invoice Details</h2>
                                <button
                                    onClick={() => setSelectedInvoice(null)}
                                    className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
                                >
                                    <Icons.X size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-6">
                                {/* Invoice Number */}
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm text-gray-500">Invoice Number</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {selectedInvoice.invoice_number || `INV-${selectedInvoice.id?.substring(0, 8).toUpperCase()}`}
                                        </p>
                                    </div>
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${getStatusStyle(selectedInvoice.payment_status || selectedInvoice.status)}`}>
                                        {(selectedInvoice.payment_status || selectedInvoice.status || 'Unknown').toUpperCase()}
                                    </span>
                                </div>

                                {/* Service Details */}
                                <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Provider</span>
                                        <span className="font-medium text-gray-900">{selectedInvoice.provider_name || 'Provider'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Service</span>
                                        <span className="font-medium text-gray-900">{selectedInvoice.service_name || 'Service'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Date</span>
                                        <span className="font-medium text-gray-900">
                                            {formatDate(selectedInvoice.scheduled_at || selectedInvoice.created_at)}
                                        </span>
                                    </div>
                                    {selectedInvoice.location && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Location</span>
                                            <span className="font-medium text-gray-900">{selectedInvoice.location}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Amount */}
                                <div className="border-t border-gray-100 pt-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg text-gray-700">Total Amount</span>
                                        <span className="text-2xl font-bold text-gray-900">
                                            {formatCurrency(selectedInvoice.price || selectedInvoice.total_amount)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                                <button
                                    onClick={() => setSelectedInvoice(null)}
                                    className="flex-1 py-3 font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => handleDownloadInvoice(selectedInvoice)}
                                    disabled={downloadingId === selectedInvoice.id}
                                    className="flex-1 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {downloadingId === selectedInvoice.id ? (
                                        <>Downloading...</>
                                    ) : (
                                        <>
                                            <Icons.Download size={18} />
                                            Download PDF
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientInvoices;
