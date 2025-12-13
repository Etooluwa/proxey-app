import React, { useEffect, useState } from 'react';
import { useToast } from '../../components/ui/ToastProvider';
import { Icons } from '../../components/Icons';
import { fetchProviderInvoices, fetchProviderTimeBlocks, fetchProviderJobs, fetchProviderProfile } from '../../data/provider';
import { request } from '../../data/apiClient';

const ProviderPromotions = () => {
    const toast = useToast();
    const [promotions, setPromotions] = useState([]);
    const [services, setServices] = useState([]);
    const [view, setView] = useState('list');
    const [editing, setEditing] = useState(null);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        promoCode: '',
        discountType: 'percentage',
        discountValue: 0,
        applicableServices: [],
        startAt: '',
        endAt: '',
        isActive: true,
    });

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            try {
                const promosResp = await request("/provider/promotions");
                const servicesResp = await request("/services");
                if (!cancelled) {
                    setPromotions(promosResp.promotions || []);
                    setServices(servicesResp.services || []);
                }
            } catch (error) {
                console.error("Failed to load promotions", error);
                toast.push({ title: "Error loading promotions", description: error.message, variant: "error" });
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [toast]);

    const resetForm = () => {
        setEditing(null);
        setFormData({
            promoCode: '',
            discountType: 'percentage',
            discountValue: 0,
            applicableServices: [],
            startAt: '',
            endAt: '',
            isActive: true,
        });
    };

    const handleAddNew = () => {
        resetForm();
        setView('create');
    };

    const handleEdit = (promo) => {
        setEditing(promo.id);
        setFormData({
            promoCode: promo.promo_code,
            discountType: promo.discount_type,
            discountValue: promo.discount_value,
            applicableServices: promo.applicable_services || [],
            startAt: promo.start_at || '',
            endAt: promo.end_at || '',
            isActive: promo.is_active,
        });
        setView('create');
    };

    const handleDelete = async (id) => {
        // No delete endpoint; mark inactive instead
        try {
            await request(`/provider/promotions/${id}`, {
                method: "PATCH",
                body: JSON.stringify({ isActive: false }),
            });
            setPromotions((prev) => prev.map((p) => p.id === id ? { ...p, is_active: false } : p));
        } catch (error) {
            toast.push({ title: "Error", description: error.message, variant: "error" });
        }
    };

    const handlePublish = async () => {
        if (!formData.promoCode || !formData.discountValue || formData.applicableServices.length === 0) {
            toast.push({ title: "Missing fields", description: "Promo code, discount value, and service are required.", variant: "error" });
            return;
        }
        const payload = {
            promoCode: formData.promoCode,
            discountType: formData.discountType,
            discountValue: Number(formData.discountValue),
            applicableServices: formData.applicableServices,
            startAt: formData.startAt || null,
            endAt: formData.endAt || null,
            isActive: formData.isActive,
        };
        try {
            if (editing) {
                const resp = await request(`/provider/promotions/${editing}`, {
                    method: "PATCH",
                    body: JSON.stringify(payload),
                });
                setPromotions((prev) => prev.map((p) => p.id === editing ? resp.promotion : p));
            } else {
                const resp = await request("/provider/promotions", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });
                setPromotions((prev) => [resp.promotion, ...prev]);
            }
            setView('list');
            resetForm();
        } catch (error) {
            toast.push({ title: "Error saving promotion", description: error.message, variant: "error" });
        }
    };

    if (loading) {
        return <div className="p-6 text-gray-500">Loading promotions...</div>;
    }

    if (view === 'list') {
        return (
            <div className="max-w-6xl mx-auto space-y-8">
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {promotions.map((promo) => (
                        <div key={promo.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{promo.promo_code}</h3>
                                    <p className="text-sm text-gray-500">
                                        {promo.discount_type === 'percentage'
                                            ? `${promo.discount_value}% off`
                                            : `$${promo.discount_value} off`}
                                    </p>
                                </div>
                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${promo.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {promo.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="text-sm text-gray-600">
                                Services: {(promo.applicable_services || []).join(', ') || 'All'}
                            </div>
                            <div className="text-xs text-gray-500">
                                {promo.start_at ? new Date(promo.start_at).toLocaleDateString() : 'No start'} - {promo.end_at ? new Date(promo.end_at).toLocaleDateString() : 'No end'}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(promo)}
                                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(promo.id)}
                                    className="flex-1 px-3 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-bold hover:bg-red-50"
                                >
                                    Deactivate
                                </button>
                            </div>
                        </div>
                    ))}
                    {promotions.length === 0 && (
                        <div className="col-span-full text-center py-10 text-gray-500 bg-white border border-dashed border-gray-200 rounded-2xl">
                            No promotions yet. Create your first one.
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => setView('list')}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <Icons.ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{editing ? "Edit Promotion" : "Create Promotion"}</h1>
                    <p className="text-gray-500 text-sm">Define discounts and select which services they apply to.</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-semibold text-gray-700">Promo Code</label>
                        <input
                            value={formData.promoCode}
                            onChange={(e) => setFormData({ ...formData, promoCode: e.target.value })}
                            className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-100 focus:border-brand-200 text-sm"
                            placeholder="SPRING20"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-700">Discount Type</label>
                        <select
                            value={formData.discountType}
                            onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                            className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-100 focus:border-brand-200 text-sm"
                        >
                            <option value="percentage">Percentage</option>
                            <option value="fixed">Fixed amount</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-700">Discount Value</label>
                        <input
                            type="number"
                            value={formData.discountValue}
                            onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                            className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-100 focus:border-brand-200 text-sm"
                            placeholder="20"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-700">Applies To</label>
                        <select
                            value={formData.applicableServices[0] || ''}
                            onChange={(e) =>
                                setFormData({ ...formData, applicableServices: e.target.value ? [e.target.value] : [] })
                            }
                            className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-100 focus:border-brand-200 text-sm"
                        >
                            <option value="">Select a service</option>
                            {services.map((svc) => (
                                <option key={svc.id} value={svc.name || svc.title}>
                                    {svc.name || svc.title}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-700">Start Date (optional)</label>
                        <input
                            type="date"
                            value={formData.startAt || ''}
                            onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                            className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-100 focus:border-brand-200 text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-700">End Date (optional)</label>
                        <input
                            type="date"
                            value={formData.endAt || ''}
                            onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                            className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-100 focus:border-brand-200 text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            id="isActive"
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        />
                        <label htmlFor="isActive" className="text-sm font-semibold text-gray-700">Active</label>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handlePublish}
                        className="px-5 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors"
                    >
                        Save Promotion
                    </button>
                    <button
                        onClick={() => { setView('list'); resetForm(); }}
                        className="px-5 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProviderPromotions;
