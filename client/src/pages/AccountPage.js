import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../components/Icons';
import { useSession } from '../auth/authContext';
import { useToast } from '../components/ui/ToastProvider';
import supabase from '../utils/supabase';
import PaymentMethodModal from '../components/PaymentMethodModal';

const AccountPage = () => {
    const navigate = useNavigate();
    const { session, profile, updateProfile, signOut } = useSession();
    const toast = useToast();

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
    });

    // Mock data for demo (in production, fetch from Supabase)
    const [notifications, setNotifications] = useState({
        emailNotifications: true,
        smsReminders: true,
        promotionalOffers: false,
    });

    const [paymentMethods, setPaymentMethods] = useState([]);

    const [transactions] = useState([
        { id: 1, service: 'Deep Home Cleaning', date: 'Oct 24, 2023', provider: 'Sarah Jenkins', amount: -120.00, status: 'completed' },
        { id: 2, service: 'Furniture Assembly', date: 'Sep 15, 2023', provider: 'David Kim', amount: -150.00, status: 'completed' },
        { id: 3, service: 'Lawn Mowing', date: 'Aug 30, 2023', provider: 'Green Thumb Services', amount: 60.00, status: 'refund' },
    ]);

    useEffect(() => {
        if (profile) {
            const nameParts = (profile.name || '').split(' ');
            setFormData({
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                email: session?.user?.email || '',
                phone: profile.phone || '',
            });

            // Load payment methods when profile loads
            if (profile.stripeCustomerId) {
                loadPaymentMethods(profile.stripeCustomerId);
            }
        }
    }, [profile, session]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleNotificationToggle = (key) => {
        setNotifications(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (!formData.firstName?.trim() || !formData.phone?.trim()) {
                toast.push({
                    title: 'Validation Error',
                    description: 'First name and phone are required',
                    variant: 'error'
                });
                return;
            }

            const userId = session?.user?.id;
            if (!userId) {
                throw new Error('No user session found');
            }

            const fullName = `${formData.firstName} ${formData.lastName}`.trim();

            if (supabase) {
                const { error } = await supabase
                    .from('client_profiles')
                    .upsert({
                        user_id: userId,
                        name: fullName,
                        phone: formData.phone,
                        email: session.user.email,
                        updated_at: new Date().toISOString()
                    });

                if (error) throw error;
            }

            await updateProfile({
                name: fullName,
                phone: formData.phone,
                isProfileComplete: true
            });

            toast.push({
                title: 'Profile Updated',
                description: 'Your changes have been saved',
                variant: 'success'
            });

            setIsEditing(false);
        } catch (error) {
            console.error('Failed to save profile:', error);
            toast.push({
                title: 'Error',
                description: error.message || 'Failed to update profile',
                variant: 'error'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/auth/sign-in');
        } catch (error) {
            console.error('Sign out error:', error);
            toast.push({
                title: 'Error',
                description: 'Failed to sign out',
                variant: 'error'
            });
        }
    };

    const loadPaymentMethods = async (customerId) => {
        setLoadingPaymentMethods(true);
        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_BASE || '/api'}/client/payment-methods`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ customerId })
                }
            );

            if (response.ok) {
                const data = await response.json();
                const methods = (data.paymentMethods || []).map((pm) => ({
                    id: pm.id,
                    type: pm.card.brand.toUpperCase(),
                    last4: pm.card.last4,
                    expiry: `${pm.card.exp_month}/${pm.card.exp_year.toString().slice(-2)}`,
                    isDefault: false
                }));
                setPaymentMethods(methods);
            }
        } catch (error) {
            console.error('Failed to load payment methods:', error);
        } finally {
            setLoadingPaymentMethods(false);
        }
    };

    const handleAddPaymentMethod = async (cardData) => {
        try {
            // Attach payment method to customer
            const response = await fetch(
                `${process.env.REACT_APP_API_BASE || '/api'}/client/attach-payment-method`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        paymentMethodId: cardData.id,
                        customerId: profile.stripeCustomerId
                    })
                }
            );

            if (response.ok) {
                toast.push({
                    title: 'Payment Method Added',
                    description: 'Your card has been added successfully',
                    variant: 'success'
                });

                // Reload payment methods
                loadPaymentMethods(profile.stripeCustomerId);
            } else {
                throw new Error('Failed to attach payment method');
            }
        } catch (error) {
            console.error('Failed to add payment method:', error);
            toast.push({
                title: 'Error',
                description: 'Failed to add payment method',
                variant: 'error'
            });
        }
    };

    const displayName = `${formData.firstName} ${formData.lastName}`.trim() || 'User';
    const displayPhoto = profile?.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;

    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
            <div className="px-4 md:px-10 py-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Profile Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
                            <div className="relative inline-block mb-6">
                                <img
                                    src={displayPhoto}
                                    alt={displayName}
                                    className="w-24 h-24 rounded-full object-cover mx-auto"
                                />
                                <button className="absolute bottom-0 right-0 w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white hover:bg-gray-800 transition-colors">
                                    <Icons.Camera size={16} />
                                </button>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">{displayName}</h2>
                            <p className="text-gray-500 text-sm mb-6">Member since 2023</p>

                            <div className="space-y-3 text-left">
                                <div className="flex items-center gap-3 text-gray-600">
                                    <Icons.Mail size={18} className="text-gray-400" />
                                    <span className="text-sm truncate">{formData.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-600">
                                    <Icons.User size={18} className="text-gray-400" />
                                    <span className="text-sm">{formData.phone || 'No phone'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Notifications Section */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 mt-6">
                            <div className="flex items-center gap-2 mb-6">
                                <Icons.Bell size={20} className="text-orange-500" />
                                <h3 className="font-bold text-gray-900">Notifications</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">Email Notifications</span>
                                    <button
                                        onClick={() => handleNotificationToggle('emailNotifications')}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            notifications.emailNotifications ? 'bg-orange-500' : 'bg-gray-300'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                notifications.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">SMS Reminders</span>
                                    <button
                                        onClick={() => handleNotificationToggle('smsReminders')}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            notifications.smsReminders ? 'bg-orange-500' : 'bg-gray-300'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                notifications.smsReminders ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">Promotional Offers</span>
                                    <button
                                        onClick={() => handleNotificationToggle('promotionalOffers')}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            notifications.promotionalOffers ? 'bg-orange-500' : 'bg-gray-300'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                notifications.promotionalOffers ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Personal Information */}
                        <div className="bg-white rounded-2xl p-8 border border-gray-100">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
                                {!isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="text-orange-600 font-semibold text-sm hover:text-orange-700"
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        First Name
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                                        />
                                    ) : (
                                        <p className="text-gray-900 py-2.5">{formData.firstName || 'Not set'}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        Last Name
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                                        />
                                    ) : (
                                        <p className="text-gray-900 py-2.5">{formData.lastName || 'Not set'}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        Email
                                    </label>
                                    <p className="text-gray-900 py-2.5">{formData.email}</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        Phone Number
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                                        />
                                    ) : (
                                        <p className="text-gray-900 py-2.5">{formData.phone || 'Not set'}</p>
                                    )}
                                </div>
                            </div>

                            {isEditing && (
                                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100">
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="px-6 py-2.5 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50"
                                    >
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            const nameParts = (profile?.name || '').split(' ');
                                            setFormData({
                                                firstName: nameParts[0] || '',
                                                lastName: nameParts.slice(1).join(' ') || '',
                                                email: session?.user?.email || '',
                                                phone: profile?.phone || '',
                                            });
                                        }}
                                        disabled={isSaving}
                                        className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Payment Methods */}
                        <div className="bg-white rounded-2xl p-8 border border-gray-100">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900">Payment Methods</h3>
                                <button
                                    onClick={() => setShowPaymentModal(true)}
                                    className="text-orange-600 font-semibold text-sm hover:text-orange-700 flex items-center gap-1"
                                >
                                    <Icons.Plus size={16} />
                                    Add New
                                </button>
                            </div>

                            <div className="space-y-4">
                                {loadingPaymentMethods ? (
                                    <div className="text-center py-8">
                                        <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-2"></div>
                                        <p className="text-gray-500 text-sm">Loading payment methods...</p>
                                    </div>
                                ) : paymentMethods.length > 0 ? (
                                    paymentMethods.map((method) => (
                                        <div key={method.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-8 bg-gray-900 rounded flex items-center justify-center text-white text-xs font-bold">
                                                    {method.type}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">•••• •••• •••• {method.last4}</p>
                                                    <p className="text-sm text-gray-500">Expires {method.expiry}</p>
                                                </div>
                                            </div>
                                            {method.isDefault && (
                                                <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                                    DEFAULT
                                                </span>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <Icons.CreditCard size={32} className="mx-auto mb-2 text-gray-400" />
                                        <p className="text-sm">No payment methods added yet</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Transaction History */}
                        <div className="bg-white rounded-2xl p-8 border border-gray-100">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900">Transaction History</h3>
                                <button className="text-gray-500 font-semibold text-sm hover:text-gray-700">
                                    View All
                                </button>
                            </div>

                            <div className="space-y-4">
                                {transactions.map((transaction) => (
                                    <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                transaction.status === 'completed' ? 'bg-green-100' : 'bg-red-100'
                                            }`}>
                                                {transaction.status === 'completed' ? (
                                                    <Icons.CheckCircle size={20} className="text-green-600" />
                                                ) : (
                                                    <Icons.ArrowLeft size={20} className="text-red-600" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{transaction.service}</p>
                                                <p className="text-sm text-gray-500">{transaction.date} • {transaction.provider}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold text-lg ${
                                                transaction.amount > 0 ? 'text-green-600' : 'text-gray-900'
                                            }`}>
                                                {transaction.amount > 0 ? '+' : ''}{transaction.amount < 0 ? '-' : ''}${Math.abs(transaction.amount).toFixed(2)}
                                            </p>
                                            <button className="text-xs text-orange-600 font-semibold hover:text-orange-700">
                                                Download Receipt
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Account Actions */}
                        <div className="bg-white rounded-2xl p-8 border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Account Actions</h3>

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-colors"
                            >
                                <Icons.LogOut size={20} />
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Method Modal */}
            <PaymentMethodModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onSuccess={handleAddPaymentMethod}
            />
        </div>
    );
};

export default AccountPage;
