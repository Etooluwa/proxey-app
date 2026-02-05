import React, { useState, useEffect } from 'react';
import { Icons } from '../../components/Icons';
import { StatCard } from '../../components/StatCard';
import { useSession } from '../../auth/authContext';
import { request } from '../../data/apiClient';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Legend
} from 'recharts';

// Default fallback data
const DEFAULT_TRANSACTIONS = [];
const DEFAULT_WEEKLY_DATA = [
    { name: 'Mon', value: 0 },
    { name: 'Tue', value: 0 },
    { name: 'Wed', value: 0 },
    { name: 'Thu', value: 0 },
    { name: 'Fri', value: 0 },
    { name: 'Sat', value: 0 },
    { name: 'Sun', value: 0 },
];
const DEFAULT_MONTHLY_DATA = [
    { name: 'Jan', income: 0, expense: 0, jobs: 0 },
    { name: 'Feb', income: 0, expense: 0, jobs: 0 },
    { name: 'Mar', income: 0, expense: 0, jobs: 0 },
    { name: 'Apr', income: 0, expense: 0, jobs: 0 },
    { name: 'May', income: 0, expense: 0, jobs: 0 },
    { name: 'Jun', income: 0, expense: 0, jobs: 0 },
    { name: 'Jul', income: 0, expense: 0, jobs: 0 },
    { name: 'Aug', income: 0, expense: 0, jobs: 0 },
    { name: 'Sep', income: 0, expense: 0, jobs: 0 },
    { name: 'Oct', income: 0, expense: 0, jobs: 0 },
    { name: 'Nov', income: 0, expense: 0, jobs: 0 },
    { name: 'Dec', income: 0, expense: 0, jobs: 0 },
];

const ProviderEarnings = () => {
    const { profile } = useSession();
    const [viewMode, setViewMode] = useState('OVERVIEW');
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [dateRange, setDateRange] = useState('LAST_30_DAYS');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [fileFormat, setFileFormat] = useState('CSV');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDownloaded, setIsDownloaded] = useState(false);

    // Filter states for View All
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('ALL');

    // Earnings data from API
    const [earningsData, setEarningsData] = useState(null);
    const [loadingEarnings, setLoadingEarnings] = useState(true);
    const [earningsError, setEarningsError] = useState(null);

    // Fetch earnings data on mount
    useEffect(() => {
        loadEarnings();
    }, []);

    const loadEarnings = async () => {
        setLoadingEarnings(true);
        setEarningsError(null);
        try {
            const data = await request('/provider/earnings');
            setEarningsData(data.earnings);
        } catch (error) {
            console.error('[earnings] Failed to load:', error);
            setEarningsError('Failed to load earnings data');
        } finally {
            setLoadingEarnings(false);
        }
    };

    // Extract data from API response or use defaults
    const availableBalance = earningsData?.availableBalance || 0;
    const pendingClearance = earningsData?.pendingClearance || 0;
    const totalEarningsThisMonth = earningsData?.totalEarningsThisMonth || 0;
    const monthlyTrend = earningsData?.monthlyTrend || 0;
    const weeklyData = earningsData?.weeklyData || DEFAULT_WEEKLY_DATA;
    const monthlyData = earningsData?.monthlyData || DEFAULT_MONTHLY_DATA;
    const transactions = earningsData?.transactions || DEFAULT_TRANSACTIONS;
    const payoutMethod = earningsData?.payoutMethod || { type: 'bank', name: 'Not Set Up', last4: '••••', status: 'inactive' };
    const nextPayoutDate = earningsData?.nextPayoutDate || 'Not scheduled';
    const stats = earningsData?.stats || { totalJobs: 0, thisMonthJobs: 0, averageJobValue: 0 };

    // Get current month name
    const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'short' });

    // Get provider signup date (fallback to 1 year ago if not available)
    const signupDate = profile?.createdAt
        ? new Date(profile.createdAt).toISOString().split('T')[0]
        : new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0];

    const today = new Date().toISOString().split('T')[0];

    const handleDownload = () => {
        setIsGenerating(true);
        // Simulate API generation time
        setTimeout(() => {
            setIsGenerating(false);
            setIsDownloaded(true);
            // Reset after a delay or on close
            setTimeout(() => {
                setIsExportModalOpen(false);
                setIsDownloaded(false); // Reset for next time
            }, 1500);
        }, 2000);
    };

    // Filter Logic - use real transactions
    const filteredTransactions = transactions.filter(tx => {
        const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'ALL'
            ? true
            : filterType === 'INCOME'
                ? (tx.type === 'INCOME' || tx.type === 'ADJUSTMENT')
                : (tx.type === 'PAYOUT' || tx.type === 'FEE');

        return matchesSearch && matchesType;
    });

    // Loading state
    if (loadingEarnings) {
        return (
            <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading earnings data...</p>
                </div>
            </div>
        );
    }

    // --- Helper to render export modal to avoid duplication ---
    const renderExportModal = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">

                {/* Success State */}
                {isDownloaded ? (
                    <div className="p-12 text-center">
                        <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Icons.Check size={40} strokeWidth={3} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Ready!</h2>
                        <p className="text-gray-500 text-sm">Your {fileFormat} file has been downloaded successfully.</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-lg font-bold text-gray-900">Export Earnings</h2>
                            <button
                                onClick={() => setIsExportModalOpen(false)}
                                className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
                                disabled={isGenerating}
                            >
                                <Icons.X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6">

                            {/* Date Range Selector */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Date Range</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { value: 'LAST_30_DAYS', label: 'Last 30 Days' },
                                        { value: 'LAST_3_MONTHS', label: 'Last 3 Months' },
                                        { value: 'LAST_YEAR', label: 'Last Year' },
                                        { value: 'CUSTOM', label: 'Custom Range' }
                                    ].map((range) => (
                                        <button
                                            key={range.value}
                                            onClick={() => setDateRange(range.value)}
                                            className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all ${dateRange === range.value
                                                ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-sm'
                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {range.label}
                                        </button>
                                    ))}
                                </div>
                                {dateRange === 'CUSTOM' && (
                                    <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Start Date</label>
                                                <input
                                                    type="date"
                                                    value={customStartDate}
                                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                                    min={signupDate}
                                                    max={customEndDate || today}
                                                    className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">End Date</label>
                                                <input
                                                    type="date"
                                                    value={customEndDate}
                                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                                    min={customStartDate || signupDate}
                                                    max={today}
                                                    className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                            <Icons.Info size={12} />
                                            Reports are available from your signup date onwards
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Format Selector */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Format</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setFileFormat('CSV')}
                                        className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${fileFormat === 'CSV'
                                            ? 'bg-brand-50 border-brand-500 ring-1 ring-brand-500'
                                            : 'bg-white border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs">CSV</div>
                                        <div className="text-left">
                                            <p className={`text-sm font-bold ${fileFormat === 'CSV' ? 'text-brand-900' : 'text-gray-900'}`}>Excel / CSV</p>
                                            <p className="text-[10px] text-gray-500">Best for analysis</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setFileFormat('PDF')}
                                        className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${fileFormat === 'PDF'
                                            ? 'bg-brand-50 border-brand-500 ring-1 ring-brand-500'
                                            : 'bg-white border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">PDF</div>
                                        <div className="text-left">
                                            <p className={`text-sm font-bold ${fileFormat === 'PDF' ? 'text-brand-900' : 'text-gray-900'}`}>PDF Document</p>
                                            <p className="text-[10px] text-gray-500">Best for printing</p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Includes */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Include Details</label>
                                <div className="space-y-2">
                                    {['Transaction IDs', 'Client Information', 'Service Breakdown'].map((item) => (
                                        <label key={item} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                                            <input type="checkbox" defaultChecked className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500" />
                                            <span className="text-sm text-gray-700 font-medium">{item}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                            <button
                                onClick={() => setIsExportModalOpen(false)}
                                disabled={isGenerating}
                                className="flex-1 py-3 font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDownload}
                                disabled={isGenerating}
                                className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-brand-600 transition-colors shadow-lg shadow-brand-200 text-sm flex items-center justify-center gap-2"
                            >
                                {isGenerating ? (
                                    <>Generating...</>
                                ) : (
                                    <>Download Report <Icons.ArrowLeft className="rotate-180" size={16} /></>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    // --- VIEW: MONTHLY INCOME ANALYTICS ---
    if (viewMode === 'MONTHLY_INCOME') {
        const totalRevenue = monthlyData.reduce((acc, curr) => acc + curr.income, 0);
        const totalExpense = monthlyData.reduce((acc, curr) => acc + curr.expense, 0);
        const netIncome = totalRevenue - totalExpense;

        return (
            <div className="max-w-6xl mx-auto space-y-8 relative animate-in fade-in slide-in-from-right-8 duration-300 pb-12">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setViewMode('OVERVIEW')}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors bg-white border border-gray-200 shadow-sm"
                        >
                            <Icons.ArrowLeft size={20} className="text-gray-700" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Monthly Income</h1>
                            <p className="text-gray-500 text-sm">Year to Date Performance ({new Date().getFullYear()})</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
                        <button className="px-3 py-1.5 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"><Icons.ChevronRight className="rotate-180" size={16} /></button>
                        <span className="px-2 text-sm font-bold text-gray-700">{new Date().getFullYear()}</span>
                        <button className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors border border-gray-100"><Icons.ChevronRight size={16} /></button>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        label="Total Revenue (YTD)"
                        value={`$${totalRevenue.toLocaleString()}`}
                        icon={Icons.Trending}
                        colorClass="bg-blue-500 text-blue-500"
                    />
                    <StatCard
                        label="Net Income"
                        value={`$${netIncome.toLocaleString()}`}
                        icon={Icons.Wallet}
                        colorClass="bg-emerald-500 text-emerald-500"
                    />
                    <StatCard
                        label="Total Expenses"
                        value={`$${totalExpense.toLocaleString()}`}
                        icon={Icons.Tag}
                        colorClass="bg-red-500 text-red-500"
                    />
                </div>

                {/* Chart Section */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Income vs Expenses</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode('OVERVIEW')}
                                className="px-3 py-1 text-xs font-bold rounded-lg transition-colors text-gray-500 hover:bg-gray-50"
                            >
                                Weekly
                            </button>
                            <button
                                onClick={() => setViewMode('MONTHLY_INCOME')}
                                className="px-3 py-1 text-xs font-bold rounded-lg transition-colors bg-brand-50 text-brand-600"
                            >
                                Monthly
                            </button>
                        </div>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    tickFormatter={(value) => `$${value / 1000}k`}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    formatter={(value) => [`$${value}`, '']}
                                />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar name="Gross Income" dataKey="income" fill="#F58027" radius={[4, 4, 0, 0]} barSize={12} />
                                <Bar name="Expenses" dataKey="expense" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={12} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Monthly Breakdown List */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900">Monthly Breakdown</h3>
                        <button onClick={() => setIsExportModalOpen(true)} className="text-sm font-bold text-brand-600 hover:underline">Download CSV</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                                    <th className="p-5 font-bold">Month</th>
                                    <th className="p-5 font-bold">Jobs</th>
                                    <th className="p-5 font-bold text-right">Gross Income</th>
                                    <th className="p-5 font-bold text-right">Expenses/Fees</th>
                                    <th className="p-5 font-bold text-right">Net Payout</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {monthlyData.filter(d => d.income > 0).map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-5 font-bold text-gray-900">{item.name} {new Date().getFullYear()}</td>
                                        <td className="p-5 text-gray-600 text-sm">{item.jobs} Completed</td>
                                        <td className="p-5 text-right font-medium text-gray-900">${item.income.toLocaleString()}</td>
                                        <td className="p-5 text-right font-medium text-red-500">-${item.expense.toLocaleString()}</td>
                                        <td className="p-5 text-right font-bold text-emerald-600">${(item.income - item.expense).toLocaleString()}</td>
                                    </tr>
                                ))}
                                {monthlyData.filter(d => d.income === 0).length > 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-4 text-center text-xs text-gray-400 font-medium bg-gray-50/30">
                                            Future months or no data available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Export Modal Trigger */}
                {isExportModalOpen && renderExportModal()}
            </div>
        );
    }

    // --- VIEW: ALL TRANSACTIONS ---
    if (viewMode === 'ALL_TRANSACTIONS') {
        return (
            <div className="max-w-6xl mx-auto space-y-8 relative animate-in fade-in slide-in-from-right-8 duration-300">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setViewMode('OVERVIEW')}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors bg-white border border-gray-200 shadow-sm"
                        >
                            <Icons.ArrowLeft size={20} className="text-gray-700" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
                            <p className="text-gray-500 text-sm">View and manage all your payments and payouts.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsExportModalOpen(true)}
                        className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg shadow-brand-200 transition-all hover:shadow-xl"
                    >
                        <Icons.Download size={18} /> Download Report
                    </button>
                </div>

                {/* Filters & Search */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all text-sm font-medium"
                        />
                    </div>

                    <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200 w-full md:w-auto">
                        <button
                            onClick={() => setFilterType('ALL')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterType === 'ALL' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilterType('INCOME')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterType === 'INCOME' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Income
                        </button>
                        <button
                            onClick={() => setFilterType('PAYOUT')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterType === 'PAYOUT' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Payouts
                        </button>
                    </div>
                </div>

                {/* Transaction List */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                                    <th className="p-6 font-bold">Transaction Details</th>
                                    <th className="p-6 font-bold">Date</th>
                                    <th className="p-6 font-bold">Status</th>
                                    <th className="p-6 font-bold text-right">Amount</th>
                                    <th className="p-6 font-bold text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredTransactions.length > 0 ? (
                                    filteredTransactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${tx.type === 'PAYOUT' ? 'bg-gray-100 text-gray-600' :
                                                        tx.type === 'FEE' ? 'bg-red-50 text-red-500' :
                                                            tx.type === 'REFUNDED' ? 'bg-orange-50 text-orange-500' :
                                                                'bg-emerald-50 text-emerald-600'
                                                        }`}>
                                                        {tx.type === 'PAYOUT' ? <Icons.Check size={18} /> :
                                                            tx.type === 'FEE' ? <Icons.Trending className="transform rotate-180" size={18} /> :
                                                                tx.type === 'REFUNDED' ? <Icons.Alert size={18} /> :
                                                                    <Icons.Trending size={18} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{tx.description}</p>
                                                        <p className="text-xs text-gray-400 font-medium">{tx.type}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 text-sm text-gray-600 font-medium">{tx.date}</td>
                                            <td className="p-6">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${tx.status === 'COMPLETED' ? 'bg-green-50 text-green-600 border-green-100' :
                                                    tx.status === 'PENDING' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                        'bg-gray-100 text-gray-500 border-gray-200'
                                                    }`}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                            <td className="p-6 text-right">
                                                <span className={`font-bold ${tx.amount > 0 ? 'text-emerald-600' : 'text-gray-900'
                                                    }`}>
                                                    {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="p-6 text-center">
                                                <button className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                                    <Icons.ChevronRight size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Icons.Search className="text-gray-300" size={32} />
                                            </div>
                                            <h3 className="text-gray-900 font-bold text-lg">No transactions found</h3>
                                            <p className="text-gray-500">Try adjusting your search or filters.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Export Modal (Reuse existing modal) */}
                {isExportModalOpen && renderExportModal()}

            </div>
        );
    }

    // --- VIEW: OVERVIEW ---
    return (
        <div className="max-w-6xl mx-auto space-y-8 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Financial Overview</h1>
                    <p className="text-gray-500 text-sm mt-1">Track your earnings and download transaction reports</p>
                </div>
                <button
                    onClick={() => setIsExportModalOpen(true)}
                    className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg shadow-brand-200 transition-all hover:shadow-xl"
                >
                    <Icons.Download size={18} /> Download Report
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    label="Available Balance"
                    value={`$${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={Icons.Wallet}
                    colorClass="bg-emerald-500 text-emerald-500"
                />
                <StatCard
                    label="Pending Clearance"
                    value={`$${pendingClearance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={Icons.Clock}
                    colorClass="bg-yellow-500 text-yellow-500"
                />
                <StatCard
                    label={`Total Earnings (${currentMonthName})`}
                    value={`$${totalEarningsThisMonth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    trend={monthlyTrend !== 0 ? `${Math.abs(monthlyTrend)}%` : null}
                    trendUp={monthlyTrend > 0}
                    icon={Icons.Trending}
                    colorClass="bg-brand-500 text-brand-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Income Analytics</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode('OVERVIEW')}
                                className="px-3 py-1 text-xs font-bold rounded-lg transition-colors bg-brand-50 text-brand-600"
                            >
                                Weekly
                            </button>
                            <button
                                onClick={() => setViewMode('MONTHLY_INCOME')}
                                className="px-3 py-1 text-xs font-bold rounded-lg transition-colors text-gray-500 hover:bg-gray-50"
                            >
                                Monthly
                            </button>
                        </div>
                    </div>

                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    formatter={(value) => [`$${value.toFixed(2)}`, 'Earnings']}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                                    {weeklyData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === weeklyData.length - 1 ? '#0d9488' : '#cbd5e1'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Quick Actions / Bank Info */}
                <div className="space-y-6">

                    {/* Payout Method - Bank Account Style */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-brand-200 transition-colors">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-gray-50 rounded-xl text-gray-600 border border-gray-100">
                                <Icons.Landmark size={24} />
                            </div>
                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${payoutMethod.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                {payoutMethod.status === 'active' ? 'Active' : 'Setup Required'}
                            </span>
                        </div>

                        <div className="mb-6">
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Primary Payout Method</p>
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                {payoutMethod.name || 'Bank Account'}
                            </h3>
                            <p className="text-gray-400 font-mono text-sm mt-1">{payoutMethod.last4}</p>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                            <div className="flex items-center gap-2">
                                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 ${payoutMethod.status === 'active'
                                    ? 'bg-[#635BFF]/10 text-[#635BFF]'
                                    : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${payoutMethod.status === 'active' ? 'bg-[#635BFF]' : 'bg-gray-400'
                                        }`}></span>
                                    {payoutMethod.status === 'active' ? 'Stripe Connected' : 'Setup Stripe'}
                                </div>
                            </div>
                            <button className="text-brand-600 text-xs font-bold hover:underline">
                                Update
                            </button>
                        </div>
                    </div>

                    {/* Automatic Payout Info */}
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                        <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <Icons.Clock size={16} className="text-gray-400" /> Payout Schedule
                        </h4>
                        <p className="text-xs text-gray-500 leading-relaxed mb-4">
                            Your available balance is automatically transferred to your bank account every Monday.
                        </p>
                        <div className="flex items-center justify-between text-sm bg-white p-3 rounded-xl border border-gray-100">
                            <span className="text-gray-500 font-medium">Next Payout</span>
                            <span className="font-bold text-gray-900">{nextPayoutDate}</span>
                        </div>
                    </div>

                </div>

            </div>

            {/* Transaction History (Recent) */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
                    <button
                        onClick={() => setViewMode('ALL_TRANSACTIONS')}
                        className="text-sm text-brand-600 font-bold hover:underline"
                    >
                        View All
                    </button>
                </div>
                {transactions.length > 0 ? (
                    <div className="space-y-4">
                        {transactions.slice(0, 5).map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors border border-transparent hover:border-gray-100">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'PAYOUT' ? 'bg-gray-100 text-gray-600' :
                                        tx.type === 'FEE' ? 'bg-red-50 text-red-500' :
                                            tx.status === 'REFUNDED' ? 'bg-orange-50 text-orange-500' :
                                                'bg-green-50 text-green-600'
                                        }`}>
                                        {tx.type === 'PAYOUT' ? <Icons.Check size={18} /> :
                                            tx.type === 'FEE' ? <Icons.Trending className="transform rotate-180" size={18} /> :
                                                tx.status === 'REFUNDED' ? <Icons.Alert size={18} /> :
                                                    <Icons.Trending size={18} />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{tx.description}</p>
                                        <p className="text-xs text-gray-500">{tx.date} • {tx.status}</p>
                                    </div>
                                </div>
                                <span className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-gray-900'
                                    }`}>
                                    {tx.amount > 0 ? '+' : ''}${tx.amount.toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icons.Wallet className="text-gray-300" size={32} />
                        </div>
                        <h3 className="text-gray-900 font-bold text-lg">No transactions yet</h3>
                        <p className="text-gray-500 text-sm mt-1">Complete bookings to see your earnings here.</p>
                    </div>
                )}
            </div>

            {/* EXPORT MODAL (Dashboard) */}
            {isExportModalOpen && renderExportModal()}

        </div>
    );
};

export default ProviderEarnings;
