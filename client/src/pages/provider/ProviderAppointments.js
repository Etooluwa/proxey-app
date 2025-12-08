import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../../components/Icons';
import { ALL_PROVIDER_APPOINTMENTS } from '../../constants';
import { useNotifications } from '../../contexts/NotificationContext';
import { useToast } from '../../components/ui/ToastProvider';
import { useSession } from '../../auth/authContext';

const ProviderAppointments = () => {
    console.log('ProviderAppointments: Component rendering');
    const navigate = useNavigate();
    const { session, profile } = useSession();
    const { addNotification } = useNotifications();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('UPCOMING');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [actionModal, setActionModal] = useState(null); // { type: 'accept'|'decline', appointment: apt, declineReason: '' }

    // Initialize appointments from localStorage or constants
    useEffect(() => {
        const savedAppointments = localStorage.getItem('all_provider_appointments');
        if (savedAppointments) {
            setAppointments(JSON.parse(savedAppointments));
        } else {
            setAppointments([...ALL_PROVIDER_APPOINTMENTS]);
        }
    }, []);

    console.log('ProviderAppointments: ALL_PROVIDER_APPOINTMENTS raw:', ALL_PROVIDER_APPOINTMENTS);

    // Filter appointments by status
    const allAppointments = appointments || [];
    console.log('ProviderAppointments: allAppointments:', allAppointments);
    // UPCOMING tab shows: PENDING, UPCOMING, and CONFIRMED (accepted) appointments
    const upcomingAppointments = allAppointments.filter(apt =>
        apt.status === 'UPCOMING' || apt.status === 'PENDING' || apt.status === 'CONFIRMED'
    );
    const pastAppointments = allAppointments.filter(apt => apt.status === 'COMPLETED');
    // CANCELLED tab shows: CANCELLED and DECLINED appointments
    const cancelledAppointments = allAppointments.filter(apt => apt.status === 'CANCELLED' || apt.status === 'DECLINED');

    // Get current appointments based on active tab
    const getCurrentAppointments = () => {
        let appointments = [];
        if (activeTab === 'UPCOMING') appointments = upcomingAppointments;
        else if (activeTab === 'PAST') appointments = pastAppointments;
        else appointments = cancelledAppointments;

        // Filter by search query
        if (searchQuery) {
            return appointments.filter(apt =>
                apt.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                apt.service.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return appointments;
    };

    const currentAppointments = getCurrentAppointments();

    const getStatusBadge = (status) => {
        if (status === 'PENDING' || status === 'UPCOMING') {
            return 'bg-blue-100 text-blue-700 border-blue-200';
        } else if (status === 'CONFIRMED') {
            return 'bg-green-100 text-green-700 border-green-200';
        } else if (status === 'COMPLETED') {
            return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        } else {
            return 'bg-red-100 text-red-700 border-red-200';
        }
    };

    const handleAcceptAppointment = async () => {
        if (!actionModal?.appointment) return;

        try {
            const apt = actionModal.appointment;

            // Update appointment status to CONFIRMED
            const updatedAppointments = appointments.map(a =>
                a.id === apt.id ? { ...a, status: 'CONFIRMED' } : a
            );
            setAppointments(updatedAppointments);
            localStorage.setItem('all_provider_appointments', JSON.stringify(updatedAppointments));

            // Create time block for this appointment
            const blockData = {
                id: `block_${apt.id}`,
                date: apt.date,
                time: apt.time,
                type: 'APPOINTMENT_BLOCK',
                appointmentId: apt.id,
                clientName: apt.clientName,
                service: apt.service,
            };
            const savedBlocks = localStorage.getItem('time_blocks');
            const blocks = savedBlocks ? JSON.parse(savedBlocks) : [];
            blocks.push(blockData);
            localStorage.setItem('time_blocks', JSON.stringify(blocks));

            // Send notification to client
            const providerName = profile?.name || session?.user?.email?.split('@')[0] || 'the provider';
            addNotification({
                type: 'appointment_approved',
                title: 'Appointment Approved',
                message: `Your ${apt.service} appointment on ${apt.date} at ${apt.time} has been approved by ${providerName}.`,
                clientId: apt.clientId,
            });

            toast.push({
                title: 'Appointment Accepted',
                description: `You've confirmed the booking with ${apt.clientName}. Time slot is now blocked.`,
                variant: 'success',
            });

            setActionModal(null);
            setSelectedAppointment(null);
        } catch (error) {
            console.error('Error accepting appointment:', error);
            toast.push({
                title: 'Error',
                description: 'Failed to accept appointment. Please try again.',
                variant: 'error',
            });
        }
    };

    const handleDeclineAppointment = async () => {
        if (!actionModal?.appointment) return;

        try {
            const apt = actionModal.appointment;
            const reason = actionModal.declineReason || 'Provider declined the appointment';

            // Update appointment status to DECLINED
            const updatedAppointments = appointments.map(a =>
                a.id === apt.id ? {
                    ...a,
                    status: 'DECLINED',
                    declineReason: reason,
                    declinedAt: new Date().toISOString()
                } : a
            );
            setAppointments(updatedAppointments);
            localStorage.setItem('all_provider_appointments', JSON.stringify(updatedAppointments));

            // Send notification to client
            const providerName = profile?.name || session?.user?.email?.split('@')[0] || 'the provider';
            addNotification({
                type: 'appointment_declined',
                title: 'Appointment Declined',
                message: `Your ${apt.service} appointment on ${apt.date} at ${apt.time} has been declined by ${providerName}. Reason: ${reason}`,
                clientId: apt.clientId,
            });

            toast.push({
                title: 'Appointment Declined',
                description: 'Client has been notified of the decline.',
                variant: 'info',
            });

            setActionModal(null);
            setSelectedAppointment(null);
        } catch (error) {
            console.error('Error declining appointment:', error);
            toast.push({
                title: 'Error',
                description: 'Failed to decline appointment. Please try again.',
                variant: 'error',
            });
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">All Appointments</h1>
                    <p className="text-gray-500 mt-1">
                        Manage your upcoming, past, and cancelled appointments
                    </p>
                </div>
                <button
                    onClick={() => navigate('/provider')}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors flex items-center gap-2 w-fit"
                >
                    <Icons.ArrowLeft size={16} />
                    Back to Dashboard
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Upcoming</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{upcomingAppointments.length}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <Icons.Calendar className="text-blue-600" size={24} />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Completed</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{pastAppointments.length}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-xl">
                            <Icons.Check className="text-green-600" size={24} />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Cancelled</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{cancelledAppointments.length}</p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-xl">
                            <Icons.X className="text-red-600" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs and Search */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    {/* Tabs */}
                    <div className="flex p-1.5 bg-gray-100 rounded-xl w-full md:w-auto">
                        <button
                            onClick={() => setActiveTab('UPCOMING')}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'UPCOMING'
                                ? 'bg-white shadow-sm text-brand-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Upcoming ({upcomingAppointments.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('PAST')}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'PAST'
                                ? 'bg-white shadow-sm text-gray-900'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Past ({pastAppointments.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('CANCELLED')}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'CANCELLED'
                                ? 'bg-white shadow-sm text-gray-900'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Cancelled ({cancelledAppointments.length})
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-80">
                        <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by client or service..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
                        />
                    </div>
                </div>

                {/* Appointments List */}
                {currentAppointments.length > 0 ? (
                    <div className="space-y-4">
                        {currentAppointments.map((apt) => (
                            <div
                                key={apt.id}
                                onClick={() => {
                                    if (apt.status === 'PENDING' || apt.status === 'UPCOMING') {
                                        setActionModal({ type: 'accept', appointment: apt, declineReason: '' });
                                    } else {
                                        setSelectedAppointment(apt);
                                    }
                                }}
                                className="p-5 border border-gray-100 rounded-2xl hover:border-brand-200 hover:bg-brand-50/30 transition-all group cursor-pointer"
                            >
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    {/* Left: Client Info */}
                                    <div className="flex items-center gap-4 flex-1">
                                        <img
                                            src={apt.clientAvatar}
                                            alt={apt.clientName}
                                            className="w-14 h-14 rounded-full object-cover shadow-sm"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 text-base mb-1">{apt.clientName}</h3>
                                            <p className="text-sm font-medium text-gray-600 mb-1">{apt.service}</p>
                                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Icons.Calendar size={12} />
                                                    {apt.date}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Icons.Clock size={12} />
                                                    {apt.time}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Icons.MapPin size={12} />
                                                    {apt.address}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Status and Actions */}
                                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-gray-900">${apt.price.toFixed(2)}</p>
                                            <span
                                                className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border mt-1 ${getStatusBadge(
                                                    apt.status
                                                )}`}
                                            >
                                                {apt.status}
                                            </span>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-wrap gap-2 md:flex-nowrap">
                                            {(apt.status === 'PENDING' || apt.status === 'UPCOMING') && (
                                                <>
                                                    <button
                                                        onClick={() => setActionModal({ type: 'accept', appointment: apt, declineReason: '' })}
                                                        className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-xs font-bold hover:bg-green-200 transition-colors whitespace-nowrap"
                                                        title="Accept Appointment"
                                                    >
                                                        <Icons.Check size={16} className="inline mr-1" />
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => setActionModal({ type: 'decline', appointment: apt, declineReason: '' })}
                                                        className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors whitespace-nowrap"
                                                        title="Decline Appointment"
                                                    >
                                                        <Icons.X size={16} className="inline mr-1" />
                                                        Decline
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => navigate(`/provider/schedule?date=${encodeURIComponent(apt.date)}`)}
                                                className="p-2.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-brand-600 hover:border-brand-200 transition-colors"
                                                title="View in Schedule"
                                            >
                                                <Icons.Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => navigate(`/provider/messages?clientId=${apt.clientId}&clientName=${encodeURIComponent(apt.clientName)}`)}
                                                className="p-2.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-brand-600 hover:border-brand-200 transition-colors"
                                                title="Message Client"
                                            >
                                                <Icons.Message size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icons.Calendar className="text-gray-400" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No appointments found</h3>
                        <p className="text-gray-500">
                            {searchQuery
                                ? 'Try adjusting your search query'
                                : `You don't have any ${activeTab.toLowerCase()} appointments yet`}
                        </p>
                    </div>
                )}
            </div>

            {/* Action Confirmation Modal */}
            {actionModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setActionModal(null)}>
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">
                                {actionModal.type === 'accept' ? 'Accept Appointment' : 'Decline Appointment'}
                            </h3>
                            <button
                                onClick={() => setActionModal(null)}
                                className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                <Icons.X size={20} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-4">
                            {/* Appointment Info */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h4 className="font-bold text-gray-900 mb-3">Appointment Details</h4>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold uppercase">Client</p>
                                        <p className="text-gray-900 font-medium">{actionModal.appointment.clientName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold uppercase">Service</p>
                                        <p className="text-gray-900 font-medium">{actionModal.appointment.service}</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 font-semibold uppercase">Date</p>
                                            <p className="text-gray-900 font-medium">{actionModal.appointment.date}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-semibold uppercase">Time</p>
                                            <p className="text-gray-900 font-medium">{actionModal.appointment.time}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold uppercase">Price</p>
                                        <div>
                                            <p className="text-lg font-bold text-brand-600">${actionModal.appointment.price.toFixed(2)}</p>
                                            {actionModal.appointment.depositAmount && (
                                                <p className="text-xs text-gray-600 mt-1">Deposit: ${actionModal.appointment.depositAmount.toFixed(2)}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Client Provided Information */}
                            {actionModal.appointment.customInputValues && Object.keys(actionModal.appointment.customInputValues).length > 0 && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <h4 className="font-bold text-gray-900 mb-2">Client Information</h4>
                                    <div className="space-y-2 text-sm">
                                        {Object.entries(actionModal.appointment.customInputValues).map(([key, value]) => (
                                            <div key={key}>
                                                <p className="text-xs text-gray-500 font-semibold uppercase">{key}</p>
                                                <p className="text-gray-900 font-medium">{value || '(not provided)'}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Message for Action */}
                            {actionModal.type === 'accept' && (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                    <p className="text-sm text-green-700">
                                        <Icons.Check size={16} className="inline mr-2 text-green-600" />
                                        Accepting this appointment will confirm the booking. The time slot will be automatically blocked.
                                    </p>
                                </div>
                            )}

                            {actionModal.type === 'decline' && (
                                <div className="space-y-3">
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                        <p className="text-sm text-red-700">
                                            <Icons.AlertCircle size={16} className="inline mr-2 text-red-600" />
                                            The client will be notified that you've declined this appointment.
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-2">Reason for declining (optional)</label>
                                        <textarea
                                            value={actionModal.declineReason}
                                            onChange={(e) => setActionModal({ ...actionModal, declineReason: e.target.value })}
                                            placeholder="e.g., Double-booked, transportation issue, etc."
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 resize-none"
                                            rows="3"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
                            <button
                                onClick={() => setActionModal(null)}
                                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            {actionModal.type === 'accept' ? (
                                <button
                                    onClick={handleAcceptAppointment}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center gap-2"
                                >
                                    <Icons.Check size={16} />
                                    Confirm Accept
                                </button>
                            ) : (
                                <button
                                    onClick={handleDeclineAppointment}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors flex items-center gap-2"
                                >
                                    <Icons.X size={16} />
                                    Confirm Decline
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Appointment Details Modal */}
            {selectedAppointment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedAppointment(null)}>
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">Appointment Details</h2>
                            <button
                                onClick={() => setSelectedAppointment(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Icons.X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Client Info Section */}
                            <div className="bg-gray-50 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Client Information</h3>
                                <div className="flex items-center gap-4 mb-4">
                                    <img
                                        src={selectedAppointment.clientAvatar}
                                        alt={selectedAppointment.clientName}
                                        className="w-16 h-16 rounded-full object-cover"
                                    />
                                    <div>
                                        <p className="text-lg font-bold text-gray-900">{selectedAppointment.clientName}</p>
                                        <p className="text-sm text-gray-600">{selectedAppointment.service}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Appointment Details Section */}
                            <div className="bg-gray-50 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Appointment Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Date</p>
                                        <p className="text-sm font-bold text-gray-900 flex items-center gap-2 mt-1">
                                            <Icons.Calendar size={14} />
                                            {selectedAppointment.date}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Time</p>
                                        <p className="text-sm font-bold text-gray-900 flex items-center gap-2 mt-1">
                                            <Icons.Clock size={14} />
                                            {selectedAppointment.time}
                                        </p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Location</p>
                                        <p className="text-sm font-bold text-gray-900 flex items-center gap-2 mt-1">
                                            <Icons.MapPin size={14} />
                                            {selectedAppointment.address}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Service & Price Section */}
                            <div className="bg-gray-50 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Service Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Service</p>
                                        <p className="text-sm font-bold text-gray-900 mt-1">{selectedAppointment.service}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Price</p>
                                        <div>
                                            <p className="text-lg font-bold text-brand-600 mt-1">${selectedAppointment.price.toFixed(2)}</p>
                                            {selectedAppointment.depositAmount && (
                                                <div className="text-xs text-gray-600 mt-1">
                                                    <p>Deposit: ${selectedAppointment.depositAmount.toFixed(2)}</p>
                                                    <p>Final: ${(selectedAppointment.price - selectedAppointment.depositAmount).toFixed(2)}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Client Provided Information Section */}
                            {selectedAppointment.customInputValues && Object.keys(selectedAppointment.customInputValues).length > 0 && (
                                <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Client Information</h3>
                                    <div className="space-y-3">
                                        {Object.entries(selectedAppointment.customInputValues).map(([key, value]) => (
                                            <div key={key}>
                                                <p className="text-xs font-semibold text-gray-500 uppercase">{key}</p>
                                                <p className="text-sm font-medium text-gray-900 mt-1 break-words">{value || '(not provided)'}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Notes Section */}
                            {selectedAppointment.notes && (
                                <div className="bg-amber-50 rounded-xl p-6 border border-amber-100">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Client Notes</h3>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedAppointment.notes}</p>
                                </div>
                            )}

                            {/* Status Section */}
                            <div className="bg-gray-50 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Status</h3>
                                <span
                                    className={`inline-block px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide border ${getStatusBadge(
                                        selectedAppointment.status
                                    )}`}
                                >
                                    {selectedAppointment.status}
                                </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => {
                                        navigate(`/provider/schedule?date=${encodeURIComponent(selectedAppointment.date)}`);
                                        setSelectedAppointment(null);
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                                >
                                    <Icons.Eye size={16} />
                                    View in Schedule
                                </button>
                                <button
                                    onClick={() => {
                                        navigate(`/provider/messages?clientId=${selectedAppointment.clientId}&clientName=${encodeURIComponent(selectedAppointment.clientName)}`);
                                        setSelectedAppointment(null);
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 transition-colors"
                                >
                                    <Icons.Message size={16} />
                                    Message Client
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProviderAppointments;
