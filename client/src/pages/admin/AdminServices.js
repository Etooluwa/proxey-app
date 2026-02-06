import React, { useEffect, useState } from 'react';
import { Icons } from '../../components/Icons';
import { fetchAdminServices } from '../../data/admin';

const AdminServices = () => {
    const [services, setServices] = useState([]);
    const [categoryCounts, setCategoryCounts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            try {
                const data = await fetchAdminServices();
                if (!cancelled) {
                    setServices(data.services || []);
                    setCategoryCounts(data.categoryCounts || []);
                }
            } catch (error) {
                console.error("Failed to load services", error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, []);

    const formatCurrency = (cents) => {
        if (!cents) return '-';
        return `$${(cents / 100).toFixed(2)}`;
    };

    const categoryIcons = {
        'Home Services': Icons.Paintbrush,
        'Beauty & Wellness': Icons.Sparkles,
        'Auto Services': Icons.Truck,
        'Pet Services': Icons.PawPrint,
        'Professional Services': Icons.Landmark,
        'Health & Fitness': Icons.Zap,
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Services</h1>
                <p className="text-gray-500 mt-1">Browse all services on the platform</p>
            </div>

            {/* Category Breakdown */}
            {categoryCounts.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {categoryCounts.map((cat) => {
                        const Icon = categoryIcons[cat.category] || Icons.Wrench;
                        return (
                            <div key={cat.category} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                                    <Icon size={20} className="text-brand-500" />
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{cat.count}</p>
                                <p className="text-xs text-gray-500 truncate">{cat.category}</p>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Services Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Icons.Loader className="w-8 h-8 animate-spin text-brand-500" />
                    </div>
                ) : services.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Service</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Provider</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Category</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Price</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Duration</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {services.map((service) => (
                                    <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-gray-900">{service.name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{service.provider_name || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                                {service.category || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            {formatCurrency(service.price)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {service.duration ? `${service.duration} min` : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                service.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {service.is_active !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <Icons.Wrench size={32} className="text-gray-300 mb-2" />
                        <p>No services found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminServices;
