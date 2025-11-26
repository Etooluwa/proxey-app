import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../../components/Icons';
import { ALL_PROVIDER_APPOINTMENTS } from '../../constants';

const ProviderAppointments = () => {
    console.log('ProviderAppointments: Component rendering');
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('UPCOMING');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    console.log('ProviderAppointments: ALL_PROVIDER_APPOINTMENTS raw:', ALL_PROVIDER_APPOINTMENTS);

    // Filter appointments by status
    const allAppointments = ALL_PROVIDER_APPOINTMENTS || [];
    console.log('ProviderAppointments: allAppointments:', allAppointments);
    const upcomingAppointments = allAppointments.filter(apt => apt.status === 'UPCOMING');
    const pastAppointments = allAppointments.filter(apt => apt.status === 'COMPLETED');
    const cancelledAppointments = allAppointments.filter(apt => apt.status === 'CANCELLED');

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
        if (status === 'UPCOMING') {
            return 'bg-blue-100 text-blue-700 border-blue-200';
        } else if (status === 'COMPLETED') {
            return 'bg-green-100 text-green-700 border-green-200';
        } else {
            return 'bg-red-100 text-red-700 border-red-200';
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
                                onClick={() => setSelectedAppointment(apt)}
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
                                    <div className="flex items-center gap-4">
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
                                        <div className="flex gap-2">
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
                                        <p className="text-lg font-bold text-brand-600 mt-1">${selectedAppointment.price.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

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
