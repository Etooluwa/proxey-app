import React, { useEffect, useState } from 'react';
import { Icons } from '../../components/Icons';
import { fetchAdminPromotions } from '../../data/admin';

const AdminPromotions = () => {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            try {
                const data = await fetchAdminPromotions();
                if (!cancelled) {
                    setPromotions(data.promotions || []);
                }
            } catch (error) {
                console.error("Failed to load promotions", error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, []);

    const formatDiscount = (promo) => {
        if (promo.discount_type === 'percentage') {
            return `${promo.discount_value}%`;
        }
        return `$${(promo.discount_value / 100).toFixed(2)}`;
    };

    const isActive = (promo) => {
        if (!promo.is_active) return false;
        const now = new Date();
        if (promo.start_date && new Date(promo.start_date) > now) return false;
        if (promo.end_date && new Date(promo.end_date) < now) return false;
        if (promo.usage_limit && promo.usage_count >= promo.usage_limit) return false;
        return true;
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
                <p className="text-gray-500 mt-1">View all promotional codes on the platform</p>
            </div>

            {/* Promotions Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Icons.Loader className="w-8 h-8 animate-spin text-brand-500" />
                    </div>
                ) : promotions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Code</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Provider</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Discount</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Usage</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Valid Period</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {promotions.map((promo) => (
                                    <tr key={promo.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                                {promo.code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{promo.provider_name || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-brand-600">
                                                {formatDiscount(promo)} off
                                            </span>
                                            <span className="text-xs text-gray-500 ml-1">
                                                ({promo.discount_type})
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {promo.usage_count || 0}
                                            {promo.usage_limit ? ` / ${promo.usage_limit}` : ' / unlimited'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                isActive(promo) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                {isActive(promo) ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {promo.start_date && promo.end_date ? (
                                                <>
                                                    {new Date(promo.start_date).toLocaleDateString()} - {new Date(promo.end_date).toLocaleDateString()}
                                                </>
                                            ) : promo.start_date ? (
                                                <>From {new Date(promo.start_date).toLocaleDateString()}</>
                                            ) : promo.end_date ? (
                                                <>Until {new Date(promo.end_date).toLocaleDateString()}</>
                                            ) : (
                                                'No limit'
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <Icons.Tag size={32} className="text-gray-300 mb-2" />
                        <p>No promotions found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPromotions;
