import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../../components/Icons';
import { PROVIDER_SERVICES } from '../../constants';

const ProviderPromotions = () => {
    const navigate = useNavigate();
    const [view, setView] = useState('list'); // 'list' or 'create'
    const [promotions, setPromotions] = useState([
        {
            id: 1,
            title: 'Summer Special Discount',
            promoCode: 'SUMMER20',
            discountType: 'percentage',
            discountValue: 20,
            applicableServices: ['Deep Home Cleaning'],
            expiresOn: '2024-08-31',
            isActive: true,
            usageCount: 12
        },
        {
            id: 2,
            title: 'First Time Client Offer',
            promoCode: 'WELCOME50',
            discountType: 'fixed',
            discountValue: 50,
            applicableServices: ['All Services'],
            expiresOn: '2024-12-31',
            isActive: true,
            usageCount: 28
        }
    ]);

    const [formData, setFormData] = useState({
        title: '',
        promoCode: '',
        discountType: 'percentage',
        discountValue: 0,
        applicableServices: [],
        expiresOn: '',
        description: ''
    });

    const [editingPromoId, setEditingPromoId] = useState(null);

    // Get selected service details for preview
    const selectedService = formData.applicableServices.length > 0
        ? PROVIDER_SERVICES.find(s => s.title === formData.applicableServices[0])
        : PROVIDER_SERVICES[0];

    // Calculate discount preview price
    const originalPrice = selectedService?.price || 60;
    const discountAmount = formData.discountType === 'percentage'
        ? (originalPrice * formData.discountValue) / 100
        : formData.discountValue;
    const discountedPrice = Math.max(0, originalPrice - discountAmount);

    const handleAddNew = () => {
        setEditingPromoId(null);
        setFormData({
            title: '',
            promoCode: '',
            discountType: 'percentage',
            discountValue: 0,
            applicableServices: [],
            expiresOn: '',
            description: ''
        });
        setView('create');
    };

    const handlePublish = () => {
        if (!formData.title || !formData.promoCode || !formData.expiresOn || formData.applicableServices.length === 0) {
            alert('Please fill in all required fields');
            return;
        }

        if (editingPromoId) {
            setPromotions(promotions.map(p =>
                p.id === editingPromoId
                    ? { ...p, ...formData, id: p.id }
                    : p
            ));
        } else {
            const newPromo = {
                id: Math.max(...promotions.map(p => p.id), 0) + 1,
                usageCount: 0,
                ...formData
            };
            setPromotions([...promotions, newPromo]);
        }
        setView('list');
    };

    const handleDelete = (id) => {
        setPromotions(promotions.filter(p => p.id !== id));
    };

    const toggleActive = (id) => {
        setPromotions(promotions.map(p =>
            p.id === id ? { ...p, isActive: !p.isActive } : p
        ));
    };

    const handleEdit = (promo) => {
        setEditingPromoId(promo.id);
        setFormData({
            title: promo.title,
            promoCode: promo.promoCode,
            discountType: promo.discountType,
            discountValue: promo.discountValue,
            applicableServices: promo.applicableServices,
            expiresOn: promo.expiresOn,
            description: promo.description || ''
        });
        setView('create');
    };

    // LIST VIEW
    if (view === 'list') {
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

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Promo Code</p>
                                                <p className="text-sm font-bold text-gray-900">{promo.promoCode}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Discount</p>
                                                <p className="text-lg font-bold text-brand-600">
                                                    {promo.discountType === 'percentage'
                                                        ? `${promo.discountValue}%`
                                                        : `$${promo.discountValue}`}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Expires</p>
                                                <p className="text-sm font-bold text-gray-900">
                                                    {new Date(promo.expiresOn).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Used</p>
                                                <p className="text-sm font-bold text-gray-900">{promo.usageCount} times</p>
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
            </div>
        );
    }

    // CREATE/EDIT VIEW
    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => setView('list')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <Icons.ChevronLeft size={24} className="text-gray-600" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{editingPromoId ? 'Edit' : 'Create'} Promotion</h1>
                    <p className="text-gray-500 mt-1">Attract more clients with a special offer.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Form */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm h-fit">
                    <div className="space-y-6">
                        {/* Promotion Name */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">Promotion Name *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g. Flash Sale"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
                            />
                        </div>

                        {/* Promo Code */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">Promo Code *</label>
                                <input
                                    type="text"
                                    value={formData.promoCode}
                                    onChange={(e) => setFormData({ ...formData, promoCode: e.target.value.toUpperCase() })}
                                    placeholder="SAVE20"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">Expires On *</label>
                                <input
                                    type="date"
                                    value={formData.expiresOn}
                                    onChange={(e) => setFormData({ ...formData, expiresOn: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
                                />
                            </div>
                        </div>

                        {/* Discount Settings */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-3">Discount Settings *</label>
                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={() => setFormData({ ...formData, discountType: 'percentage' })}
                                    className={`flex-1 py-2 px-3 text-sm font-bold rounded-lg transition-colors ${
                                        formData.discountType === 'percentage'
                                            ? 'bg-brand-500 text-white'
                                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    Percentage Off
                                </button>
                                <button
                                    onClick={() => setFormData({ ...formData, discountType: 'fixed' })}
                                    className={`flex-1 py-2 px-3 text-sm font-bold rounded-lg transition-colors ${
                                        formData.discountType === 'fixed'
                                            ? 'bg-brand-500 text-white'
                                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    Fixed Amount
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-gray-600">
                                    {formData.discountType === 'percentage' ? '%' : '$'}
                                </span>
                                <input
                                    type="number"
                                    value={formData.discountValue}
                                    onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) })}
                                    placeholder="20"
                                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
                                />
                            </div>
                        </div>

                        {/* Apply to Service */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">Apply to Service *</label>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {PROVIDER_SERVICES.map((service) => (
                                    <label key={service.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.applicableServices.includes(service.title)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setFormData({
                                                        ...formData,
                                                        applicableServices: [...formData.applicableServices, service.title]
                                                    });
                                                } else {
                                                    setFormData({
                                                        ...formData,
                                                        applicableServices: formData.applicableServices.filter(s => s !== service.title)
                                                    });
                                                }
                                            }}
                                            className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-gray-900">{service.title}</p>
                                            <p className="text-xs text-gray-500">${service.price}/hr</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Tell clients why they should take this offer..."
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 resize-none h-24"
                            />
                        </div>
                    </div>
                </div>

                {/* Right: Client Preview */}
                <div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Preview Client View</div>
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm sticky top-8">
                        {formData.applicableServices.length > 0 && selectedService ? (
                            <>
                                {/* Discount Badge */}
                                <div className="mb-6">
                                    <div className="inline-block bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-lg">
                                        {formData.discountType === 'percentage' ? `${formData.discountValue}% OFF` : `$${formData.discountValue} OFF`}
                                    </div>
                                </div>

                                {/* Service Name */}
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedService.title}</h3>
                                <p className="text-gray-600 text-sm mb-6">{selectedService.description}</p>

                                {/* Promo Code */}
                                {formData.promoCode && (
                                    <div className="bg-gray-50 p-3 rounded-lg mb-6 border border-gray-200">
                                        <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Promo Code</p>
                                        <p className="text-sm font-bold text-gray-900">{formData.promoCode}</p>
                                    </div>
                                )}

                                {/* Pricing */}
                                <div className="space-y-3 mb-8">
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Original Price</p>
                                        <p className="text-sm text-gray-500 line-through">${originalPrice.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Deal Price</p>
                                        <p className="text-2xl font-bold text-brand-600">${discountedPrice.toFixed(2)}</p>
                                    </div>
                                </div>

                                {/* Book Now Button */}
                                <button className="w-full bg-gray-400 text-white py-3 rounded-lg font-bold mb-4 disabled opacity-50">
                                    Book Now
                                </button>

                                {/* Promoted By */}
                                <p className="text-xs text-gray-500 text-center">Promoted by Your Business Name</p>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <Icons.Eye size={32} className="text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">Select a service to see preview</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end mt-8">
                <button
                    onClick={() => setView('list')}
                    className="px-8 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handlePublish}
                    className="px-8 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200 flex items-center gap-2"
                >
                    <Icons.Zap size={18} />
                    Publish Promotion
                </button>
            </div>
        </div>
    );
};

export default ProviderPromotions;
