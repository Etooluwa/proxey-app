import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icons } from '../../components/Icons';
import { ALL_PROVIDER_APPOINTMENTS } from '../../constants';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DATES = Array.from({ length: 35 }, (_, i) => i + 1); // Mock 35 days

const InvoiceGeneratorModal = ({ appointment, onClose }) => {
    const [items, setItems] = useState([
        { id: 1, description: appointment.service, quantity: 1, price: appointment.price }
    ]);
    const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
    const [note, setNote] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08; // Mock 8% tax
    const total = subtotal + tax;

    const handleAddItem = () => {
        setItems([...items, { id: Date.now(), description: '', quantity: 1, price: 0 }]);
    };

    const handleUpdateItem = (id, field, value) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleRemoveItem = (id) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleSend = () => {
        setIsSending(true);
        setTimeout(() => {
            setIsSending(false);
            setIsSent(true);
        }, 1500);
    };

    if (isSent) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 text-center animate-in zoom-in-95 duration-200">
                    <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Icons.Check size={40} strokeWidth={3} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Invoice Sent!</h2>
                    <p className="text-gray-500 mb-8">
                        Invoice <span className="font-bold">#INV-{appointment.id}294</span> has been sent to {appointment.clientName}.
                    </p>
                    <button onClick={onClose} className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-brand-600 transition-colors shadow-lg">
                        Back to Details
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">New Invoice</h2>
                        <p className="text-sm text-gray-500">Creating invoice for {appointment.clientName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                        <Icons.X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">

                    {/* Meta Info */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Invoice No.</label>
                            <div className="font-mono font-bold text-gray-900 bg-gray-100 px-3 py-2 rounded-lg inline-block">#INV-{appointment.id}294</div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Due Date</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="font-medium text-gray-900 bg-white border border-gray-200 px-3 py-2 rounded-lg outline-none focus:border-brand-500 w-full"
                            />
                        </div>
                    </div>

                    {/* Bill To */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center gap-4">
                        <img src={appointment.avatar} alt={appointment.clientName} className="w-12 h-12 rounded-full" />
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Bill To</p>
                            <p className="font-bold text-gray-900">{appointment.clientName}</p>
                            <p className="text-xs text-gray-500">{appointment.address}</p>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-sm font-bold text-gray-900">Line Items</label>
                            <button onClick={handleAddItem} className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1">
                                <Icons.ChevronRight size={12} className="-rotate-90" /> Add Item
                            </button>
                        </div>
                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div key={item.id} className="flex gap-2 items-start">
                                    <input
                                        type="text"
                                        placeholder="Description"
                                        value={item.description}
                                        onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                                        className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-500"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Qty"
                                        value={item.quantity}
                                        onChange={(e) => handleUpdateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                        className="w-16 p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-500"
                                    />
                                    <div className="relative w-24">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                        <input
                                            type="number"
                                            placeholder="Price"
                                            value={item.price}
                                            onChange={(e) => handleUpdateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                                            className="w-full pl-5 p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-500"
                                        />
                                    </div>
                                    {items.length > 1 && (
                                        <button onClick={() => handleRemoveItem(item.id)} className="p-2 text-gray-400 hover:text-red-500">
                                            <Icons.X size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-1/2 space-y-2">
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Tax (8%)</span>
                                <span>${tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-100">
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Note */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Note to Client</label>
                        <textarea
                            placeholder="Thank you for your business..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-500 h-20 resize-none"
                        />
                    </div>

                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-3 font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={isSending}
                        className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-brand-600 transition-colors shadow-lg flex items-center gap-2"
                    >
                        {isSending ? 'Sending...' : 'Send Invoice'} <Icons.ArrowLeft className="rotate-180" size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}


// --- SUB-COMPONENT: APPOINTMENT DETAIL VIEW ---
const AppointmentDetailView = ({ appointment, onBack }) => {
    const [localStatus, setLocalStatus] = useState(appointment.status);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleCompleteClick = () => {
        setShowConfirmation(true);
    };

    const confirmCompletion = () => {
        setIsProcessing(true);
        // Simulate API Call
        setTimeout(() => {
            setIsProcessing(false);
            setShowConfirmation(false);
            setShowSuccess(true);
            setLocalStatus('COMPLETED');
        }, 2000);
    };

    if (showSuccess) {
        return (
            <div className="max-w-2xl mx-auto animate-in zoom-in-95 duration-300 py-12">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden text-center p-10">
                    <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Icons.Check size={48} strokeWidth={3} />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Job Completed!</h2>
                    <p className="text-gray-500 mb-8 text-lg">
                        Great work, {appointment.clientName.split(' ')[0]} has been notified.
                    </p>

                    <div className="bg-emerald-50 rounded-2xl p-6 mb-8 border border-emerald-100 max-w-md mx-auto">
                        <p className="text-emerald-800 font-bold text-sm uppercase tracking-wide mb-1">Payment Released</p>
                        <h3 className="text-4xl font-bold text-emerald-600">${appointment.price.toFixed(2)}</h3>
                        <p className="text-emerald-600 text-sm mt-2">Has been added to your earnings wallet.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => { setShowSuccess(false); setShowInvoiceModal(true); }}
                            className="w-full py-4 bg-white border border-gray-200 text-gray-900 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Send Invoice
                        </button>
                        <button
                            onClick={onBack}
                            className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-brand-600 transition-colors shadow-lg"
                        >
                            Back to Schedule
                        </button>
                    </div>
                </div>

                {/* Render invoice modal on top if needed */}
                {showInvoiceModal && (
                    <InvoiceGeneratorModal
                        appointment={appointment}
                        onClose={() => { setShowInvoiceModal(false); onBack(); }}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-right-8 duration-300 pb-12 relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 transition-colors bg-white border border-gray-200 shadow-sm">
                        <Icons.ArrowLeft size={20} className="text-gray-700" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Appointment Details</h1>
                        <p className="text-gray-500 text-sm">Booking ID: #{appointment.id}294X</p>
                    </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide border ${localStatus === 'CONFIRMED' ? 'bg-green-50 text-green-700 border-green-100' :
                    localStatus === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                        localStatus === 'COMPLETED' ? 'bg-gray-800 text-white border-gray-800' :
                            'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                    {localStatus}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Client Info */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-24 bg-brand-50/50 z-0"></div>
                        <div className="relative z-10">
                            <img src={appointment.avatar} alt={appointment.clientName} className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-white shadow-md mb-4" />
                            <h2 className="text-xl font-bold text-gray-900">{appointment.clientName}</h2>
                            <p className="text-gray-500 text-sm mb-6">Client since 2022</p>

                            <div className="grid grid-cols-2 gap-3">
                                <button className="py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-brand-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-gray-200">
                                    <Icons.Message size={16} /> Message
                                </button>
                                <button className="py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                                    <Icons.User size={16} /> Profile
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4">Contact Info</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <div className="p-2 bg-white rounded-lg text-gray-400 shadow-sm">
                                    <Icons.User size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-400 uppercase">Phone</p>
                                    <p className="text-sm font-bold text-gray-900 truncate">{appointment.phone}</p>
                                </div>
                                <button className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                                    <Icons.Message size={18} />
                                </button>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <div className="p-2 bg-white rounded-lg text-gray-400 shadow-sm">
                                    <Icons.MapPin size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-400 uppercase">Address</p>
                                    <p className="text-sm font-bold text-gray-900 truncate">{appointment.address}</p>
                                </div>
                                <button className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                                    <Icons.Map size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Job Details */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Main Job Card */}
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-100">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">{appointment.service}</h3>
                                <p className="text-gray-500 text-sm">Standard Package • 2 Hours</p>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-gray-900">${appointment.price.toFixed(2)}</span>
                                <p className="text-xs text-gray-400 font-bold uppercase">Total</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Date & Time</label>
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <Icons.Calendar className="text-brand-500" size={20} />
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">{appointment.date}</p>
                                        <p className="text-xs text-gray-500">{appointment.time}</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Payment Status</label>
                                <div className={`flex items-center gap-3 p-4 rounded-2xl border ${localStatus === 'COMPLETED' ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'
                                    }`}>
                                    <Icons.Wallet className={localStatus === 'COMPLETED' ? "text-emerald-500" : "text-gray-400"} size={20} />
                                    <div>
                                        <p className={`font-bold text-sm ${localStatus === 'COMPLETED' ? 'text-emerald-700' : 'text-gray-900'}`}>
                                            {localStatus === 'COMPLETED' ? 'Funds Released' : 'Held in Escrow'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {localStatus === 'COMPLETED' ? 'Available in Wallet' : 'Payout upon completion'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Client Notes</label>
                            <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-2xl text-sm text-yellow-800 leading-relaxed">
                                "{appointment.notes}"
                            </div>
                        </div>
                    </div>

                    {/* Map Placeholder */}
                    <div className="bg-gray-100 h-48 rounded-3xl border border-gray-200 relative overflow-hidden flex items-center justify-center group cursor-pointer">
                        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                        <div className="bg-white px-4 py-2 rounded-xl shadow-md flex items-center gap-2 z-10">
                            <Icons.MapPin className="text-red-500" size={18} />
                            <span className="text-sm font-bold text-gray-700">{appointment.address}</span>
                        </div>
                        <button className="absolute bottom-4 right-4 bg-white p-2 rounded-lg shadow-sm text-gray-600 hover:text-brand-600 transition-colors">
                            <Icons.Map size={20} />
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {localStatus === 'CONFIRMED' ? (
                            <>
                                <button
                                    onClick={handleCompleteClick}
                                    className="md:col-span-1 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-green-600 transition-colors shadow-xl shadow-gray-200 hover:shadow-green-200 flex items-center justify-center gap-2"
                                >
                                    <Icons.Check size={20} /> Complete Job
                                </button>
                                <button
                                    onClick={() => setShowInvoiceModal(true)}
                                    className="py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Icons.FileText size={18} /> Issue Invoice
                                </button>
                                <button className="py-4 bg-white border border-gray-200 text-red-500 rounded-2xl font-bold hover:bg-red-50 hover:border-red-100 transition-colors">
                                    Cancel
                                </button>
                            </>
                        ) : localStatus === 'COMPLETED' ? (
                            <>
                                <div className="md:col-span-2 bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center justify-center gap-2 text-gray-500 font-bold">
                                    <Icons.Check size={20} className="text-green-500" />
                                    This job has been completed and paid.
                                </div>
                                <button
                                    onClick={() => setShowInvoiceModal(true)}
                                    className="py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-colors"
                                >
                                    Resend Invoice
                                </button>
                            </>
                        ) : (
                            <div className="md:col-span-3 flex gap-4">
                                <button className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-brand-600 transition-colors">
                                    Accept Request
                                </button>
                                <button className="flex-1 py-4 bg-white border border-gray-200 text-red-500 rounded-2xl font-bold hover:bg-red-50 transition-colors">
                                    Decline
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-8 text-center">
                        <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Icons.Wallet size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Job & Release Payout?</h2>
                        <p className="text-gray-500 mb-6">
                            By marking this job as done, you confirm the service has been provided. The payment of <span className="font-bold text-gray-900">${appointment.price.toFixed(2)}</span> will be immediately released to your account.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmation(false)}
                                disabled={isProcessing}
                                className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmCompletion}
                                disabled={isProcessing}
                                className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-green-600 transition-colors shadow-lg flex items-center justify-center gap-2"
                            >
                                {isProcessing ? 'Processing...' : 'Confirm Completion'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invoice Modal */}
            {showInvoiceModal && (
                <InvoiceGeneratorModal
                    appointment={appointment}
                    onClose={() => setShowInvoiceModal(false)}
                />
            )}

        </div>
    );
};



const ProviderSchedule = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [currentDate, setCurrentDate] = useState(() => {
        // Initialize with current date or date from URL parameter
        const dateParam = searchParams.get('date');
        if (dateParam) {
            try {
                const parsedDate = new Date(decodeURIComponent(dateParam));
                if (!isNaN(parsedDate)) {
                    return parsedDate;
                }
            } catch (e) {
                // Invalid date, fall back to today
            }
        }
        return new Date();
    });

    const [selectedDate, setSelectedDate] = useState(() => {
        const dateParam = searchParams.get('date');
        if (dateParam) {
            try {
                const parsedDate = new Date(decodeURIComponent(dateParam));
                if (!isNaN(parsedDate)) {
                    return parsedDate.getDate();
                }
            } catch (e) {
                // Invalid date, fall back to today
            }
        }
        return new Date().getDate();
    });

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [eventType, setEventType] = useState('APPOINTMENT');
    const [blockType, setBlockType] = useState('TIME_SLOT');
    const [viewingAppointment, setViewingAppointment] = useState(null);

    // Parse the date from URL when component mounts
    useEffect(() => {
        const dateParam = searchParams.get('date');
        if (dateParam) {
            try {
                const parsedDate = new Date(decodeURIComponent(dateParam));
                if (!isNaN(parsedDate)) {
                    setCurrentDate(parsedDate);
                    setSelectedDate(parsedDate.getDate());
                }
            } catch (e) {
                console.error('Error parsing date from URL:', e);
            }
        }
    }, [searchParams]);

    const handleOpenAddModal = (e) => {
        if (e) e.stopPropagation();
        setIsAddModalOpen(true);
    };

    // Get the first day of the month and number of days in month
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

    // Handle month navigation
    const handlePreviousMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Get appointments for the selected date
    const appointmentsForSelectedDate = ALL_PROVIDER_APPOINTMENTS.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate.getDate() === selectedDate &&
               aptDate.getMonth() === currentDate.getMonth() &&
               aptDate.getFullYear() === currentDate.getFullYear();
    });

    // Get all dates that have appointments in the current month
    const datesWithAppointments = ALL_PROVIDER_APPOINTMENTS.reduce((acc, apt) => {
        const aptDate = new Date(apt.date);
        if (aptDate.getMonth() === currentDate.getMonth() &&
            aptDate.getFullYear() === currentDate.getFullYear()) {
            acc.add(aptDate.getDate());
        }
        return acc;
    }, new Set());

    // If viewing details, render detail view
    if (viewingAppointment) {
        return <AppointmentDetailView appointment={viewingAppointment} onBack={() => setViewingAppointment(null)} />;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 md:h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-8 relative animate-in fade-in duration-300">

            {/* Left Column: Calendar */}
            <div className="flex-1 bg-white p-4 md:p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col min-h-[400px]">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{monthYear}</h2>
                        <p className="text-gray-500 text-sm">Manage your availability</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePreviousMonth}
                            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors"
                            title="Previous Month"
                        >
                            <Icons.ChevronRight className="transform rotate-180" size={20} />
                        </button>
                        <button
                            onClick={handleNextMonth}
                            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors"
                            title="Next Month"
                        >
                            <Icons.ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Calendar Grid Wrapper for Scroll */}
                <div className="overflow-x-auto pb-4 md:pb-0">
                    <div className="min-w-[300px] md:min-w-full">
                        <div className="grid grid-cols-7 mb-4 text-center">
                            {DAYS.map(day => (
                                <div key={day} className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider py-2">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1 md:gap-2 flex-1 content-start">
                            {/* Empty cells for previous month */}
                            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                                <div key={`empty-${i}`} className="h-16 md:h-24"></div>
                            ))}

                            {/* Days of current month */}
                            {Array.from({ length: daysInMonth }).map((_,i) => {
                                const date = i + 1;
                                const isSelected = date === selectedDate;
                                const hasEvents = datesWithAppointments.has(date);

                                return (
                                    <div
                                        key={date}
                                        onClick={() => setSelectedDate(date)}
                                        className={`h-16 md:h-24 border border-gray-50 rounded-xl p-1 md:p-2 relative cursor-pointer transition-all hover:border-brand-300 flex flex-col justify-between group ${isSelected ? 'bg-brand-50 border-brand-500 shadow-inner' : 'bg-white'
                                            }`}
                                    >
                                        <span className={`text-xs md:text-sm font-bold ${isSelected ? 'text-brand-700' : 'text-gray-700'}`}>
                                            {date}
                                        </span>

                                        {hasEvents && (
                                            <div className="space-y-0.5 md:space-y-1">
                                                <div className="h-1 md:h-1.5 w-full bg-brand-200 rounded-full"></div>
                                                <div className="h-1 md:h-1.5 w-2/3 bg-blue-200 rounded-full"></div>
                                            </div>
                                        )}

                                        {/* Add Button on Hover (Hidden on mobile) */}
                                        <button
                                            onClick={handleOpenAddModal}
                                            className="hidden md:block absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-brand-500 transition-opacity"
                                        >
                                            <div className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">+</div>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Daily Agenda */}
            <div className="w-full lg:w-96 bg-white p-4 md:p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-auto lg:h-auto min-h-[400px]">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-6 pb-6 border-b border-gray-100">
                    <div>
                        <h3 className="text-lg md:text-xl font-bold text-gray-900">
                            {new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </h3>
                        <p className="text-sm text-gray-500">{appointmentsForSelectedDate.length} {appointmentsForSelectedDate.length === 1 ? 'Appointment' : 'Appointments'}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate('/provider/appointments')}
                            className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors whitespace-nowrap"
                            title="View All Appointments"
                        >
                            View All
                        </button>
                        <button
                            onClick={() => handleOpenAddModal()}
                            className="bg-brand-600 text-white px-4 py-2 rounded-xl text-xs md:text-sm font-bold shadow-lg shadow-brand-200 hover:bg-brand-700 transition-colors whitespace-nowrap"
                        >
                            + Add
                        </button>
                    </div>
                </div>

                <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {appointmentsForSelectedDate.length > 0 ? (
                        appointmentsForSelectedDate.map(apt => (
                            <div key={apt.id} className="group relative pl-4 border-l-2 border-gray-200 hover:border-brand-500 transition-colors pb-4">
                                {/* Time Indicator */}
                                <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-gray-300 rounded-full group-hover:border-brand-500 transition-colors"></div>

                                <div className="bg-gray-50 p-3 md:p-4 rounded-2xl group-hover:bg-brand-50/50 transition-colors">
                                    <div className="flex justify-between items-start mb-2 gap-2">
                                        <span className="text-xs font-bold text-gray-500 flex items-center gap-1 whitespace-nowrap">
                                            <Icons.Clock size={12} /> {apt.time}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase flex-shrink-0 ${apt.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {apt.status}
                                        </span>
                                    </div>

                                    <h4 className="font-bold text-gray-900 mb-1 text-sm">{apt.service}</h4>

                                    <div className="flex items-center gap-2 mb-3 min-w-0">
                                        <img src={apt.avatar} alt={apt.clientName} className="w-5 h-5 rounded-full flex-shrink-0" />
                                        <span className="text-xs md:text-sm text-gray-600 font-medium truncate">{apt.clientName}</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-gray-400 min-w-0">
                                        <Icons.MapPin size={12} className="flex-shrink-0" />
                                        <span className="truncate">{apt.address}</span>
                                    </div>

                                    {/* Hover Actions */}
                                    <div className="mt-3 flex gap-2 opacity-100 md:opacity-50 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setViewingAppointment(apt)}
                                            className="flex-1 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:text-brand-600 hover:border-brand-200 transition-colors"
                                        >
                                            Details
                                        </button>
                                        <button className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors">
                                            <Icons.X size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center py-8 text-gray-400">
                            <Icons.Calendar size={32} className="mb-2 text-gray-300" />
                            <p className="text-sm font-medium">No appointments on this date</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Schedule Item Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-lg font-bold text-gray-900">Add to Schedule</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                                <Icons.X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Event Type Toggle */}
                            <div className="flex p-1.5 bg-gray-100 rounded-xl">
                                <button
                                    onClick={() => setEventType('APPOINTMENT')}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${eventType === 'APPOINTMENT' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <Icons.Calendar size={16} /> Appointment
                                </button>
                                <button
                                    onClick={() => setEventType('BLOCK')}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${eventType === 'BLOCK' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <Icons.Clock size={16} /> Block Time
                                </button>
                            </div>

                            {eventType === 'APPOINTMENT' ? (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Client Name</label>
                                        <div className="relative">
                                            <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                            <input type="text" placeholder="Search client..." className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Service</label>
                                        <select className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 appearance-none">
                                            <option>Deep Home Cleaning</option>
                                            <option>Window Cleaning</option>
                                            <option>Move-out Clean</option>
                                        </select>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Block Type</label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setBlockType('TIME_SLOT')}
                                                className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-colors ${blockType === 'TIME_SLOT' ? 'bg-gray-800 border border-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                                            >
                                                Time Slot
                                            </button>
                                            <button
                                                onClick={() => setBlockType('FULL_DAY')}
                                                className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-colors ${blockType === 'FULL_DAY' ? 'bg-gray-800 border border-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                                            >
                                                Full Day
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reason</label>
                                        <input type="text" placeholder="e.g. Vacation, Personal day, Sick leave" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300" />
                                    </div>
                                </>
                            )}

                            {eventType === 'APPOINTMENT' ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Time</label>
                                        <input type="time" defaultValue="09:00" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">End Time</label>
                                        <input type="time" defaultValue="10:00" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300" />
                                    </div>
                                </div>
                            ) : blockType === 'TIME_SLOT' ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Time</label>
                                        <input type="time" defaultValue="09:00" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">End Time</label>
                                        <input type="time" defaultValue="10:00" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300" />
                                    </div>
                                </div>
                            ) : null}

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notes</label>
                                <textarea placeholder="Add any details..." className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 h-24 resize-none"></textarea>
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                            <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-2.5 font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors text-sm">
                                Cancel
                            </button>
                            <button onClick={() => setIsAddModalOpen(false)} className="px-8 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-brand-600 transition-colors shadow-lg shadow-brand-200 text-sm">
                                Save to Schedule
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ProviderSchedule;
