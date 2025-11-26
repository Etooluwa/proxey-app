import React, { useState } from 'react';
import { Icons } from '../../components/Icons';

const ProviderPromotions = () => {
    const [promotions, setPromotions] = useState([
        {
            id: 1,
            title: 'Summer Special Discount',
            description: '20% off all cleaning services during summer season',
            discountType: 'percentage',
            discountValue: 20,
            applicableServices: ['Deep Home Cleaning', 'Window Cleaning'],
            startDate: '2024-06-01',
            endDate: '2024-08-31',
            isActive: true,
            usageCount: 12
        },
        {
            id: 2,
            title: 'First Time Client Offer',
            description: 'Free consultation + $50 off first booking',
            discountType: 'fixed',
            discountValue: 50,
            applicableServices: ['All Services'],
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            isActive: true,
            usageCount: 28
        }
    ]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPromoId, setEditingPromoId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        discountType: 'percentage',
        discountValue: 0,
        applicableServices: [],
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        isActive: true
    });

    const handleAddNew = () => {
        setEditingPromoId(null);
        setFormData({
            title: '',
            description: '',
            discountType: 'percentage',
            discountValue: 0,
            applicableServices: [],
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            isActive: true
        });
        setIsModalOpen(true);
    };

    const handleEdit = (promo) => {
        setEditingPromoId(promo.id);
        setFormData({
            title: promo.title,
            description: promo.description,
            discountType: promo.discountType,
            discountValue: promo.discountValue,
            applicableServices: promo.applicableServices,
            startDate: promo.startDate,
            endDate: promo.endDate,
            isActive: promo.isActive
        });
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!formData.title || !formData.discountValue) return;

        if (editingPromoId) {
            setPromotions(promotions.map(p =>
                p.id === editingPromoId
                    ? { ...p, ...formData }
                    : p
            ));
        } else {
            const newPromo = {
                id: Math.random().toString(36).substr(2, 9),
                usageCount: 0,
                ...formData
            };
            setPromotions([...promotions, newPromo]);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id) => {
        setPromotions(promotions.filter(p => p.id !== id));
    };

    const toggleActive = (id) => {
        setPromotions(promotions.map(p =>
            p.id === id ? { ...p, isActive: !p.isActive } : p
        ));
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Promotions</h1>
                    <p className="text-gray-500 mt-2">Create and manage special offers to attract more clients</p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200 flex items-center gap-2"
                >
                    <Icons.Plus size={20} />
                    Create Promotion
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Active Promotions</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{promotions.filter(p => p.isActive).length}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                            <Icons.Tag size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Total Uses</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{promotions.reduce((sum, p) => sum + p.usageCount, 0)}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                            <Icons.TrendingUp size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Avg Discount</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {promotions.length > 0
                                    ? (promotions.reduce((sum, p) => sum + p.discountValue, 0) / promotions.length).toFixed(1)
                                    : 0}
                                {promotions[0]?.discountType === 'percentage' ? '%' : '$'}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                            <Icons.Percent size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Promotions List */}
            {promotions.length > 0 ? (
                <div className="space-y-4">
                    {promotions.map((promo) => (
                        <div
                            key={promo.id}
                            className={`bg-white p-6 rounded-2xl border transition-all ${
                                promo.isActive
                                    ? 'border-gray-100 shadow-sm hover:shadow-md'
                                    : 'border-gray-200 bg-gray-50 opacity-75'
                            }`}
                        >
                            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                                {/* Left: Promo Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-3">
                                        <h3 className="text-lg font-bold text-gray-900">{promo.title}</h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            promo.isActive
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {promo.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 text-sm mb-4">{promo.description}</p>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Discount</p>
                                            <p className="text-xl font-bold text-brand-600">
                                                {promo.discountType === 'percentage'
                                                    ? `${promo.discountValue}%`
                                                    : `$${promo.discountValue}`}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Valid Until</p>
                                            <p className="text-sm font-bold text-gray-900">
                                                {new Date(promo.endDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Used</p>
                                            <p className="text-sm font-bold text-gray-900">{promo.usageCount} times</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Services</p>
                                            <p className="text-sm font-bold text-gray-900">
                                                {promo.applicableServices.length > 0
                                                    ? promo.applicableServices.length === 1
                                                        ? promo.applicableServices[0]
                                                        : `${promo.applicableServices.length} services`
                                                    : 'All'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Actions */}
                                <div className="flex gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => toggleActive(promo.id)}
                                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                                            promo.isActive
                                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                                        }`}
                                    >
                                        {promo.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <button
                                        onClick={() => handleEdit(promo)}
                                        className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                                    >
                                        <Icons.Edit size={16} />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(promo.id)}
                                        className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                                    >
                                        <Icons.Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                        <Icons.Tag size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No Promotions Yet</h3>
                    <p className="text-gray-600 mb-6">Create your first promotion to attract more clients and boost bookings</p>
                    <button
                        onClick={handleAddNew}
                        className="bg-brand-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-brand-700 transition-colors"
                    >
                        Create Promotion
                    </button>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setIsModalOpen(false)}>
                    <div
                        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {editingPromoId ? 'Edit Promotion' : 'Create New Promotion'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Icons.X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">Promotion Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Summer Special Discount"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe your promotion and what clients will get"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 resize-none h-24"
                                />
                            </div>

                            {/* Discount Type and Value */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-2">Discount Type</label>
                                    <select
                                        value={formData.discountType}
                                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed ($)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-2">Discount Value</label>
                                    <input
                                        type="number"
                                        value={formData.discountValue}
                                        onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) })}
                                        placeholder="e.g. 20"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
                                    />
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-2">Start Date</label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-2">End Date</label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
                                    />
                                </div>
                            </div>

                            {/* Status */}
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-5 h-5 rounded border border-gray-300 text-brand-600 focus:ring-2 focus:ring-brand-100"
                                />
                                <label htmlFor="isActive" className="text-sm font-bold text-gray-900">
                                    Make this promotion active immediately
                                </label>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2.5 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200"
                            >
                                {editingPromoId ? 'Update Promotion' : 'Create Promotion'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProviderPromotions;
