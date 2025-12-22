import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../../components/Icons';
import { fetchProviderJobs, updateProviderJobStatus } from '../../data/provider';
import { useToast } from '../../components/ui/ToastProvider';

const ProviderAppointments = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('UPCOMING');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [actionModal, setActionModal] = useState(null); // { type: 'accept'|'decline', appointment: apt, declineReason: '' }
    const [loading, setLoading] = useState(false);

    const normalizeStatus = (status) => {
        const val = (status || "").toUpperCase();
        if (val === "PENDING") return "PENDING";
        if (val === "DECLINED" || val === "CANCELLED") return "CANCELLED";
        if (val === "COMPLETED") return "COMPLETED";
        if (val === "CONFIRMED" || val === "ACTIVE" || val === "UPCOMING") return "UPCOMING";
        return val || "PENDING";
    };

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const jobs = await fetchProviderJobs();
            const normalized = (jobs || []).map((apt) => ({
                ...apt,
                statusLabel: normalizeStatus(apt.status),
                clientName: apt.client_name || apt.clientName || "Client",
                service: apt.service_name || apt.service || "Service",
                date: apt.scheduled_at || apt.scheduledAt,
                time: apt.scheduled_at ? new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            }));
            setAppointments(normalized);
        } catch (error) {
            console.error("Failed to load appointments", error);
            // Don't show error toast if backend is not available
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        load();
    }, [load]);

    const allAppointments = appointments || [];
    const upcomingAppointments = allAppointments.filter(apt =>
        apt.statusLabel === 'UPCOMING' || apt.statusLabel === 'PENDING'
    );
    const pastAppointments = allAppointments.filter(apt => apt.statusLabel === 'COMPLETED');
    const cancelledAppointments = allAppointments.filter(apt => apt.statusLabel === 'CANCELLED');

    const getCurrentAppointments = () => {
        let list = [];
        if (activeTab === 'UPCOMING') list = upcomingAppointments;
        else if (activeTab === 'PAST') list = pastAppointments;
        else list = cancelledAppointments;

        if (searchQuery) {
            return list.filter(apt =>
                (apt.clientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (apt.service || '').toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return list;
    };

    const currentAppointments = getCurrentAppointments();

    const getStatusBadge = (status) => {
        if (status === 'PENDING' || status === 'UPCOMING') {
            return 'bg-blue-100 text-blue-700 border-blue-200';
        } else if (status === 'CONFIRMED' || status === 'ACTIVE') {
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
            await updateProviderJobStatus(apt.id, "confirmed");
            await load();
            toast.push({
                title: 'Appointment Accepted',
                description: `You've confirmed the booking with ${apt.clientName}.`,
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
            await updateProviderJobStatus(apt.id, "declined");
            await load();
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

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
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

                    <div className="relative w-full md:w-64">
                        <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search appointments..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    {loading && <div className="text-sm text-gray-500">Loading appointments...</div>}
                    {!loading && currentAppointments.length === 0 && (
                        <div className="text-center py-10 text-gray-500">No appointments in this tab.</div>
                    )}
                    {!loading && currentAppointments.map((apt) => (
                        <div
                            key={apt.id}
                            className="p-4 border border-gray-100 rounded-2xl hover:border-brand-100 hover:shadow-sm transition-all bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center text-brand-600 font-bold">
                                    <Icons.Calendar size={22} />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-bold text-gray-900">{apt.clientName}</h3>
                                        <span className={`text-xs px-2 py-1 rounded-full border ${getStatusBadge(apt.statusLabel)}`}>
                                            {apt.statusLabel}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600">{apt.service}</p>
                                    <div className="flex gap-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Icons.Calendar size={14} /> {apt.date ? new Date(apt.date).toLocaleDateString() : 'TBD'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Icons.Clock size={14} /> {apt.time || 'TBD'}
                                        </span>
                                        {apt.location && (
                                            <span className="flex items-center gap-1">
                                                <Icons.MapPin size={14} /> {apt.location}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {apt.statusLabel === 'PENDING' && (
                                    <>
                                        <button
                                            onClick={() => setActionModal({ type: 'accept', appointment: apt })}
                                            className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors"
                                        >
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => setActionModal({ type: 'decline', appointment: apt, declineReason: '' })}
                                            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
                                        >
                                            Decline
                                        </button>
                                    </>
                                )}
                                {apt.statusLabel !== 'PENDING' && (
                                    <button
                                        onClick={() => setSelectedAppointment(apt)}
                                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
                                    >
                                        View
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {actionModal?.appointment && (
                <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
                    <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6 space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    {actionModal.type === 'accept' ? 'Accept Appointment' : 'Decline Appointment'}
                                </h3>
                                <p className="text-gray-600 mt-1">
                                    {actionModal.appointment.clientName} — {actionModal.appointment.service}
                                </p>
                            </div>
                            <button
                                onClick={() => setActionModal(null)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <Icons.X size={18} />
                            </button>
                        </div>

                        {actionModal.type === 'decline' && (
                            <div>
                                <label className="text-sm font-semibold text-gray-700">Reason (optional)</label>
                                <textarea
                                    value={actionModal.declineReason || ''}
                                    onChange={(e) => setActionModal((prev) => ({ ...prev, declineReason: e.target.value }))}
                                    className="w-full mt-2 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-100 focus:border-brand-200 text-sm"
                                    rows={3}
                                    placeholder="Add a short note"
                                />
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={actionModal.type === 'accept' ? handleAcceptAppointment : handleDeclineAppointment}
                                className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm ${actionModal.type === 'accept'
                                    ? 'bg-brand-600 text-white hover:bg-brand-700'
                                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                                    }`}
                            >
                                {actionModal.type === 'accept' ? 'Accept' : 'Decline'}
                            </button>
                            <button
                                onClick={() => setActionModal(null)}
                                className="flex-1 px-4 py-3 rounded-xl font-bold text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedAppointment && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
                    <div className="bg-white rounded-3xl shadow-xl max-w-3xl w-full p-6 space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">{selectedAppointment.clientName}</h3>
                                <p className="text-gray-600">{selectedAppointment.service}</p>
                            </div>
                            <button
                                onClick={() => setSelectedAppointment(null)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <Icons.X size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase">Schedule</p>
                                <p className="text-sm text-gray-800">
                                    {selectedAppointment.date ? new Date(selectedAppointment.date).toLocaleString() : 'TBD'}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase">Status</p>
                                <span className={`text-xs px-2 py-1 rounded-full border ${getStatusBadge(selectedAppointment.statusLabel)}`}>
                                    {selectedAppointment.statusLabel}
                                </span>
                            </div>
                            {selectedAppointment.location && (
                                <div className="bg-gray-50 rounded-2xl p-4 space-y-2 md:col-span-2">
                                    <p className="text-xs font-semibold text-gray-500 uppercase">Location</p>
                                    <p className="text-sm text-gray-800">{selectedAppointment.location}</p>
                                </div>
                            )}
                            {selectedAppointment.notes && (
                                <div className="bg-gray-50 rounded-2xl p-4 space-y-2 md:col-span-2">
                                    <p className="text-xs font-semibold text-gray-500 uppercase">Notes</p>
                                    <p className="text-sm text-gray-800">{selectedAppointment.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProviderAppointments;
