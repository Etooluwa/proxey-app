import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icons } from '../../components/Icons';
import { fetchProviderJobs, updateProviderJobStatus } from '../../data/provider';
import { useToast } from '../../components/ui/ToastProvider';

const AppointmentRequestAcceptance = () => {
    const navigate = useNavigate();
    const { requestId } = useParams();
    const toast = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [request, setRequest] = useState(null);

    const load = useCallback(async () => {
        try {
            const pending = await fetchProviderJobs({ status: "pending" });
            setRequest(pending.find((j) => j.id === requestId) || null);
        } catch (error) {
            console.error("Failed to load request", error);
            toast.push({
                title: "Error loading request",
                description: error.message,
                variant: "error",
            });
        }
    }, [requestId, toast]);

    useEffect(() => {
        load();
    }, [load]);

    if (!request) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                        <Icons.AlertCircle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Not Found</h2>
                    <p className="text-gray-600 mb-6">This appointment request could not be found or has already been processed.</p>
                    <button
                        onClick={() => navigate('/provider/notifications')}
                        className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors"
                    >
                        Back to Notifications
                    </button>
                </div>
            </div>
        );
    }

    const handleUpdate = async (nextStatus, successMessage, variant = "success") => {
        setIsProcessing(true);
        try {
            await updateProviderJobStatus(request.id, nextStatus);
            toast.push({
                title: successMessage,
                description: `${request.client_name || request.clientName || "Client"} will be notified.`,
                variant,
            });
            await load();
            navigate('/provider/appointments');
        } catch (error) {
            console.error('Error updating request:', error);
            toast.push({
                title: 'Error',
                description: error.message || 'Failed to update appointment. Please try again.',
                variant: 'error',
            });
            setIsProcessing(false);
        }
    };

    const requestedDate = request.scheduled_at || request.scheduledAt;
    const requestedTime = requestedDate ? new Date(requestedDate).toLocaleString() : 'TBD';

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Appointment Request</h1>
                    <p className="text-gray-600 mt-1">Review and decide to accept or decline</p>
                </div>
                <button
                    onClick={() => navigate('/provider/notifications')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <Icons.X size={24} />
                </button>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-brand-50 to-brand-100 border-b border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-600">
                                {request.client_name?.[0] || request.clientName?.[0] || 'C'}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{request.client_name || request.clientName || 'Client'}</h2>
                                <p className="text-sm text-gray-600">{request.service_name || request.service || 'Service'}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-semibold text-gray-500 uppercase">Requested</div>
                            <div className="text-sm text-gray-600">{requestedTime}</div>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Client Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Name</p>
                                <p className="text-sm font-medium text-gray-900">{request.client_name || request.clientName || 'N/A'}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Service</p>
                                <p className="text-sm font-medium text-gray-900">{request.service_name || request.service || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Appointment Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Date & Time</p>
                                <p className="text-sm font-medium text-gray-900">{requestedTime}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Status</p>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                                    {request.status || 'pending'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => handleUpdate("confirmed", "Appointment Accepted", "success")}
                            disabled={isProcessing}
                            className="flex-1 px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors disabled:opacity-60"
                        >
                            {isProcessing ? "Processing..." : "Accept Request"}
                        </button>
                        <button
                            onClick={() => handleUpdate("declined", "Appointment Declined", "info")}
                            disabled={isProcessing}
                            className="flex-1 px-6 py-3 bg-white border border-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-50 transition-colors disabled:opacity-60"
                        >
                            Decline
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppointmentRequestAcceptance;
