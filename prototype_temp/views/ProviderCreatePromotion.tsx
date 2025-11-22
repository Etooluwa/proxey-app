
import React, { useState } from 'react';
import { Icons } from '../components/Icons';
import { PROVIDER_SERVICES } from '../constants';

interface ProviderCreatePromotionProps {
  onBack: () => void;
}

export const ProviderCreatePromotion: React.FC<ProviderCreatePromotionProps> = ({ onBack }) => {
  // Mock services for the logged-in provider (Cleaning)
  const myServices = PROVIDER_SERVICES.filter(s => s.category === 'Cleaning');

  const [selectedServiceId, setSelectedServiceId] = useState(myServices[0]?.id || '');
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [discountValue, setDiscountValue] = useState('20');
  const [title, setTitle] = useState('Flash Sale');
  const [code, setCode] = useState('SAVE20');
  const [expiryDate, setExpiryDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Derived state for preview
  const selectedService = myServices.find(s => s.id === selectedServiceId) || myServices[0];
  
  const calculatePrice = (price: number) => {
    const val = parseFloat(discountValue) || 0;
    if (discountType === 'PERCENT') {
      return Math.max(0, price * (1 - val / 100));
    }
    return Math.max(0, price - val);
  };

  const originalPrice = selectedService?.price || 0;
  const discountedPrice = calculatePrice(originalPrice);

  const handleSubmit = () => {
    if (!discountValue || !title) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto text-center pt-16 animate-in zoom-in-95 duration-300">
        <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <Icons.Check size={48} strokeWidth={3} />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Promotion Live!</h2>
        <p className="text-gray-500 mb-8 text-lg leading-relaxed">
          Your promotion <span className="font-bold text-gray-900">"{title}"</span> has been successfully created.<br/>
          Clients will now see the discounted price.
        </p>
        
        <div className="flex gap-3 justify-center">
            <button onClick={onBack} className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-brand-600 transition-colors shadow-lg">
            Back to Dashboard
            </button>
            <button className="px-8 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors">
            Share Link
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
         <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 transition-colors bg-white border border-gray-200 shadow-sm">
           <Icons.ArrowLeft size={20} className="text-gray-700" />
         </button>
         <div>
           <h1 className="text-2xl font-bold text-gray-900">Create Promotion</h1>
           <p className="text-gray-500 text-sm">Attract more clients with a special offer.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left: Configuration Form */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Promotion Name</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Spring Cleaning Sale"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all font-medium text-gray-900"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Promo Code</label>
                    <div className="relative">
                        <Icons.Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                        type="text" 
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="SALE2023"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all font-bold uppercase tracking-wide text-gray-900"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Expires On</label>
                    <input 
                        type="date" 
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all text-gray-700 font-medium"
                    />
                </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
                <label className="block text-sm font-bold text-gray-700 mb-3">Discount Settings</label>
                
                <div className="flex gap-4 mb-4">
                    <button 
                        onClick={() => setDiscountType('PERCENT')}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all flex items-center justify-center gap-2 ${discountType === 'PERCENT' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                    >
                        <Icons.Trending size={16} /> Percentage Off
                    </button>
                    <button 
                        onClick={() => setDiscountType('FIXED')}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all flex items-center justify-center gap-2 ${discountType === 'FIXED' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                    >
                        <Icons.Wallet size={16} /> Fixed Amount
                    </button>
                </div>

                <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 font-bold text-gray-400 text-lg">
                        {discountType === 'PERCENT' ? '%' : '$'}
                    </span>
                    <input 
                        type="number" 
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        className="w-full pl-10 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all font-bold text-2xl text-gray-900"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Apply to Service</label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {myServices.map(s => (
                        <div 
                            key={s.id}
                            onClick={() => setSelectedServiceId(s.id)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${selectedServiceId === s.id ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-gray-200 hover:border-brand-200 hover:bg-gray-50'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedServiceId === s.id ? 'bg-brand-200 text-brand-700' : 'bg-gray-100 text-gray-500'}`}>
                                    <Icons.Sparkles size={16} />
                                </div>
                                <div>
                                    <p className={`text-sm font-bold ${selectedServiceId === s.id ? 'text-brand-900' : 'text-gray-700'}`}>{s.title}</p>
                                    <p className="text-xs text-gray-500">${s.price}{s.priceUnit === 'hour' ? '/hr' : ''}</p>
                                </div>
                            </div>
                            {selectedServiceId === s.id && <Icons.Check size={16} className="text-brand-600" />}
                        </div>
                    ))}
                </div>
            </div>

        </div>

        {/* Right: Preview */}
        <div className="sticky top-24">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Preview Client View</h3>
            
            {/* Preview Card */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl relative overflow-hidden group">
                {/* Promo Badge */}
                <div className="absolute top-0 right-0 bg-red-500 text-white px-4 py-1.5 rounded-bl-2xl font-bold text-xs uppercase tracking-wider shadow-sm z-10">
                    {discountType === 'PERCENT' ? `${discountValue}% OFF` : `$${discountValue} OFF`}
                </div>

                <div className="flex items-start gap-5 mb-6">
                   <div className="w-20 h-20 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 flex-shrink-0">
                        <Icons.Sparkles size={32} />
                   </div>
                   <div className="flex-1">
                       <h4 className="text-xl font-bold text-gray-900 leading-tight mb-1">{selectedService.title}</h4>
                       <p className="text-sm text-gray-500 line-clamp-2 mb-2">{selectedService.description}</p>
                       <div className="flex items-center gap-2">
                           <span className="px-2 py-0.5 bg-gray-100 rounded-md text-xs font-bold text-gray-600 uppercase">{code}</span>
                           {expiryDate && <span className="text-xs text-gray-400">Expires {new Date(expiryDate).toLocaleDateString()}</span>}
                       </div>
                   </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center mb-6">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Original Price</p>
                        <p className="text-sm font-medium text-gray-500 line-through">${originalPrice.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-red-500 uppercase">Deal Price</p>
                        <p className="text-2xl font-bold text-gray-900">${discountedPrice.toFixed(2)}</p>
                    </div>
                </div>

                <button className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl shadow-lg opacity-50 cursor-default flex items-center justify-center gap-2">
                    Book Now
                </button>

                <div className="mt-4 text-center">
                    <p className="text-xs text-gray-400 font-medium">
                        Promoted by <span className="text-gray-600 font-bold">Jane Doe</span>
                    </p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col gap-3">
                <button 
                  onClick={handleSubmit}
                  disabled={isSubmitting || !title || !discountValue}
                  className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-2
                    ${isSubmitting || !title || !discountValue ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-200'}
                  `}
                >
                    {isSubmitting ? 'Publishing...' : 'Publish Promotion'}
                    {!isSubmitting && <Icons.Zap size={20} className="fill-current" />}
                </button>
                <button onClick={onBack} className="w-full py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors">
                    Cancel
                </button>
            </div>
            
        </div>

      </div>
    </div>
  );
};
