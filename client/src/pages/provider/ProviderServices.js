import React, { useEffect, useState } from 'react';
import { Icons } from '../../components/Icons';
import { CATEGORIES } from '../../constants';
import { request } from '../../data/apiClient';
import { useSession } from '../../auth/authContext';

const ProviderServices = () => {
    const [services, setServices] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [activeCategory, setActiveCategory] = useState('All');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const { role, session } = useSession();
    const [form, setForm] = useState({
        id: null,
        name: '',
        description: '',
        category: '',
        basePrice: 0,
        unit: 'visit',
        duration: 60,
    });

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            try {
                const resp = await request("/services");
                const data = resp.services || [];
                if (!cancelled) {
                    setServices(data);
                    setFiltered(data);
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

    useEffect(() => {
        let list = [...services];
        if (activeCategory !== 'All') {
            list = list.filter((svc) =>
                (svc.category || '').toLowerCase() === activeCategory.toLowerCase()
            );
        }
        if (search) {
            const q = search.toLowerCase();
            list = list.filter((svc) =>
                (svc.name || svc.title || '').toLowerCase().includes(q) ||
                (svc.description || '').toLowerCase().includes(q)
            );
        }
        setFiltered(list);
    }, [services, activeCategory, search]);

    const resetForm = () => {
        setForm({
            id: null,
            name: '',
            description: '',
            category: '',
            basePrice: 0,
            unit: 'visit',
            duration: 60,
        });
    };

    const openModal = (svc) => {
        if (svc) {
            setForm({
                id: svc.id,
                name: svc.name || svc.title || '',
                description: svc.description || '',
                category: svc.category || '',
                basePrice: svc.base_price || svc.price || 0,
                unit: svc.unit || 'visit',
                duration: svc.duration || 60,
            });
        } else {
            resetForm();
        }
        setModalOpen(true);
    };

    const saveService = async () => {
        const nextErrors = {};
        if (!form.name) nextErrors.name = "Name is required.";
        if (!form.category) nextErrors.category = "Category is required.";
        if (!form.basePrice || Number(form.basePrice) <= 0) nextErrors.basePrice = "Price must be greater than zero.";
        if (!form.duration || Number(form.duration) <= 0) nextErrors.duration = "Duration must be greater than zero.";
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        setSaving(true);
        const providerId = session?.user?.id || null;
        const payload = {
            id: form.id,
            name: form.name,
            description: form.description,
            category: form.category,
            basePrice: Number(form.basePrice),
            unit: form.unit,
            duration: Number(form.duration) || 60,
            provider_id: providerId,
        };
        try {
            const saved = {
                ...(form.id ? form : { id: payload.id }),
                ...payload,
            };
            setServices((prev) => {
                const exists = prev.find((s) => s.id === saved.id);
                if (exists) {
                    return prev.map((s) => (s.id === saved.id ? saved : s));
                }
                return [saved, ...prev];
            });
            // Fire request but keep optimistic state
            request("/services", { method: "POST", body: JSON.stringify(payload) }).catch((error) => {
                console.error("Failed to persist service", error);
            });
            setModalOpen(false);
        } catch (error) {
            console.error("Failed to save service", error);
            setErrors({ submit: error.message || "Failed to save service." });
        }
        setSaving(false);
    };

    const removeService = async (serviceId) => {
        setServices((prev) => prev.filter((s) => s.id !== serviceId));
        request(`/services/${serviceId}`, { method: "DELETE" }).catch((error) => {
            console.error("Failed to delete service", error);
        });
    };

    const handleCategory = (cat) => {
        setActiveCategory(cat);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Your Services</h1>
                    <p className="text-gray-500 mt-1">Manage and edit the services you offer.</p>
                </div>
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-72">
                        <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search services..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all"
                        />
                    </div>
                    {role === 'provider' && (
                        <button
                            onClick={() => openModal(null)}
                            className="px-6 py-2.5 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200 whitespace-nowrap flex items-center gap-2"
                        >
                            <Icons.Plus size={18} />
                            Add Service
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => handleCategory('All')}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold border ${activeCategory === 'All' ? 'bg-brand-50 text-brand-700 border-brand-200' : 'bg-white text-gray-700 border-gray-200'}`}
                >
                    All
                </button>
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => handleCategory(cat.name)}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold border ${activeCategory === cat.name ? 'bg-brand-50 text-brand-700 border-brand-200' : 'bg-white text-gray-700 border-gray-200'}`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {loading && <div className="text-gray-500">Loading services...</div>}

            {!loading && filtered.length === 0 && (
                <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-2xl">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icons.Wrench size={28} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No services found.</h3>
                    <p className="text-gray-500 text-sm mb-6">Get started by adding your first service</p>
                    {role === 'provider' && (
                        <button
                            onClick={() => openModal(null)}
                            className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200 inline-flex items-center gap-2"
                        >
                            <Icons.Plus size={18} />
                            Add Your First Service
                        </button>
                    )}
                </div>
            )}

            {!loading && filtered.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map((service) => (
                    <div key={service.id} className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm space-y-2">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{service.name || service.title}</h3>
                                <p className="text-sm text-gray-500">{service.description}</p>
                            </div>
                            <div className="text-lg font-bold text-gray-900">
                                ${service.base_price || service.price}<span className="text-sm text-gray-500">/{service.unit || 'visit'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1"><Icons.Tag size={14} /> {service.category || 'General'}</span>
                            <span className="flex items-center gap-1"><Icons.Clock size={14} /> {service.duration || 60} mins</span>
                        </div>
                        {role === 'provider' && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => openModal(service)}
                                    className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => removeService(service.id)}
                                    className="px-3 py-2 bg-white border border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors"
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                    </div>
                ))}
                </div>
            )}

            {modalOpen && role === 'provider' && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
                    <div className="bg-white rounded-3xl shadow-xl max-w-xl w-full p-6 space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{form.id ? "Edit Service" : "Add Service"}</h3>
                                <p className="text-gray-500 text-sm">Set the details for this service.</p>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <Icons.X size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-semibold text-gray-700">Name</label>
                                <input
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-100 focus:border-brand-200 text-sm"
                                />
                                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700">Category</label>
                                <select
                                    value={form.category}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                                    className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-100 focus:border-brand-200 text-sm"
                                >
                                    <option value="">Select</option>
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                                {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700">Price</label>
                                <input
                                    type="number"
                                    value={form.basePrice}
                                    onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                                    className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-100 focus:border-brand-200 text-sm"
                                />
                                {errors.basePrice && <p className="text-xs text-red-600 mt-1">{errors.basePrice}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700">Unit</label>
                                <input
                                    value={form.unit}
                                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                                    className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-100 focus:border-brand-200 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700">Duration (mins)</label>
                                <input
                                    type="number"
                                    value={form.duration}
                                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                                    className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-100 focus:border-brand-200 text-sm"
                                />
                                {errors.duration && <p className="text-xs text-red-600 mt-1">{errors.duration}</p>}
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-sm font-semibold text-gray-700">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-100 focus:border-brand-200 text-sm"
                                    rows={3}
                                />
                            </div>
                        </div>

                        {errors.submit && <p className="text-sm text-red-600">{errors.submit}</p>}

                        <div className="flex gap-3">
                            <button
                                onClick={saveService}
                                disabled={saving}
                                className="px-5 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors disabled:opacity-60"
                            >
                                {saving ? "Saving..." : "Save"}
                            </button>
                            <button
                                onClick={() => { setModalOpen(false); resetForm(); }}
                                className="px-5 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProviderServices;
