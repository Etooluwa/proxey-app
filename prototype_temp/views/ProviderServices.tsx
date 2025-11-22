
import React, { useState } from 'react';
import { Icons } from '../components/Icons';
import { PROVIDER_SERVICES, CATEGORIES } from '../constants';
import { ServiceOffering } from '../types';

export const ProviderServices: React.FC = () => {
  // Initialize with services that match the logged-in provider's category (Mocking "Cleaning" as the current user)
  const [services, setServices] = useState<ServiceOffering[]>(PROVIDER_SERVICES.filter(s => s.category === 'Cleaning'));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<ServiceOffering>>({
    title: '',
    category: 'Cleaning',
    price: 0,
    priceUnit: 'hour',
    duration: '1 hour',
    description: '',
    active: true,
  });

  const toggleActive = (id: string) => {
    setServices(services.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const handleAddNew = () => {
    setEditingServiceId(null);
    setFormData({
        title: '',
        category: 'Cleaning',
        price: 0,
        priceUnit: 'hour',
        duration: '1 hour',
        description: '',
        active: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (service: ServiceOffering) => {
    setEditingServiceId(service.id);
    setFormData({ ...service });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.title || !formData.price) return; // Basic validation

    if (editingServiceId) {
        // Update existing
        setServices(services.map(s => s.id === editingServiceId ? { ...s, ...formData } as ServiceOffering : s));
    } else {
        // Create new
        const newService: ServiceOffering = {
            id: Math.random().toString(36).substr(2, 9),
            bookingsCount: 0,
            ...formData as ServiceOffering
        };
        setServices([...services, newService]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 relative">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Services</h1>
          <p className="text-gray-500 mt-1">Manage what you offer to clients.</p>
        </div>
        <button 
            onClick={handleAddNew}
            className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-500 transition-colors shadow-lg flex items-center gap-2"
        >
          <Icons.Wrench size={18} />
          Add New Service
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {services.map((service) => (
          <div key={service.id} className={`bg-white p-6 rounded-2xl border transition-all flex flex-col md:flex-row gap-6 items-start ${service.active ? 'border-gray-100 shadow-sm hover:shadow-md' : 'border-gray-100 opacity-75 bg-gray-50'}`}>
            
            {/* Icon Box */}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${service.active ? 'bg-brand-50 text-brand-600' : 'bg-gray-200 text-gray-400'}`}>
               {service.priceUnit === 'fixed' ? <Icons.Tag size={28} /> : <Icons.Clock size={28} />}
            </div>

            {/* Content */}
            <div className="flex-1">
               <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{service.title}</h3>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{service.category}</span>
                  </div>
                  <div className="flex flex-col items-end">
                     <span className="text-xl font-bold text-gray-900">
                        ${service.price} <span className="text-sm text-gray-500 font-normal">{service.priceUnit === 'hour' ? '/ hr' : ' flat fee'}</span>
                     </span>
                     <span className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                       <Icons.Clock size={12} /> {service.duration}
                     </span>
                  </div>
               </div>
               
               <p className="text-gray-600 text-sm leading-relaxed mb-4 max-w-2xl">
                 {service.description}
               </p>

               <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Icons.Calendar size={16} className="text-brand-400" />
                    <span className="font-bold text-gray-700">{service.bookingsCount}</span> Bookings
                  </div>
                  <button 
                    onClick={() => handleEdit(service)}
                    className="text-sm font-bold text-brand-600 hover:underline"
                  >
                    Edit Details
                  </button>
               </div>
            </div>

            {/* Toggle */}
            <div className="flex items-center gap-3 md:flex-col md:items-end md:justify-center h-full">
              <span className={`text-xs font-bold uppercase tracking-wide ${service.active ? 'text-green-600' : 'text-gray-400'}`}>
                {service.active ? 'Active' : 'Inactive'}
              </span>
              <button 
                onClick={() => toggleActive(service.id)}
                className={`w-12 h-6 rounded-full relative transition-colors ${service.active ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${service.active ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>

          </div>
        ))}
      </div>
      
      <div className="text-center pt-8 border-t border-gray-200">
        <p className="text-gray-400 text-sm mb-4">Want to offer more services?</p>
        <button className="text-brand-600 font-bold text-sm hover:underline">
          Browse Service Categories
        </button>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* Modal Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{editingServiceId ? 'Edit Service' : 'Add New Service'}</h2>
                        <p className="text-sm text-gray-500">Define details and pricing.</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                        <Icons.X size={20} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
                    
                    {/* Service Name */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Service Title</label>
                        <input 
                            type="text" 
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            placeholder="e.g. Deep Cleaning, Leaky Faucet Repair" 
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 font-medium transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {/* Category */}
                         <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                            <div className="relative">
                                <select 
                                    value={formData.category}
                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 font-medium appearance-none transition-all"
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                                <Icons.ChevronRight className="absolute right-4 top-1/2 transform -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" size={16} />
                            </div>
                        </div>
                        
                        {/* Duration */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Est. Duration</label>
                            <input 
                                type="text" 
                                value={formData.duration}
                                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                                placeholder="e.g. 2 hours, 3 days" 
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 font-medium transition-all"
                            />
                        </div>
                    </div>

                    {/* Pricing Section */}
                    <div className="bg-brand-50/50 p-6 rounded-2xl border border-brand-100">
                        <label className="block text-sm font-bold text-gray-800 mb-3">Pricing Structure</label>
                        
                        {/* Toggle */}
                        <div className="flex p-1.5 bg-gray-200/60 rounded-xl mb-6 w-full">
                            <button 
                                onClick={() => setFormData({...formData, priceUnit: 'hour'})}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${formData.priceUnit === 'hour' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Icons.Clock size={16} /> Hourly Rate
                            </button>
                            <button 
                                onClick={() => setFormData({...formData, priceUnit: 'fixed'})}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${formData.priceUnit === 'fixed' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Icons.Tag size={16} /> Flat Fee
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                                {formData.priceUnit === 'hour' ? 'Price per Hour' : 'Total Service Price'}
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 font-bold text-gray-400 text-lg">$</span>
                                <input 
                                    type="number" 
                                    value={formData.price}
                                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 font-bold text-xl text-gray-900 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                        <textarea 
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            placeholder="Describe what's included in this service..." 
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 font-medium h-32 resize-none transition-all"
                        />
                    </div>

                </div>

                {/* Modal Footer */}
                <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    <button 
                        onClick={() => setIsModalOpen(false)}
                        className="px-6 py-3 font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={!formData.title || !formData.price}
                        className={`px-8 py-3 font-bold text-white rounded-xl transition-all shadow-lg ${!formData.title || !formData.price ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-brand-600 shadow-brand-200'}`}
                    >
                        {editingServiceId ? 'Save Changes' : 'Create Service'}
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};
