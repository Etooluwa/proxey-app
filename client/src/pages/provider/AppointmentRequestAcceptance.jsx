import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icons } from '../../components/Icons';
import { PENDING_APPOINTMENT_REQUESTS, ALL_PROVIDER_APPOINTMENTS } from '../../constants';
import { useNotifications } from '../../contexts/NotificationContext';
import { useToast } from '../../components/ui/ToastProvider';

const AppointmentRequestAcceptance = () => {
    const navigate = useNavigate();
    const { requestId } = useParams();
    const { addNotification } = useNotifications();
    const toast = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    // Find the request
    const request = PENDING_APPOINTMENT_REQUESTS.find(req => req.id === requestId);

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

    const handleAccept = async () => {
        setIsProcessing(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 800));

            // Create a new appointment from the request
            const newAppointment = {
                ...request,
                id: `apt_${Date.now()}`,
                status: 'CONFIRMED',
                clientId: `client_${request.id}`,
                clientAvatar: request.clientAvatar,
                date: request.requestedDate,
                time: request.requestedTime,
                requestedDate: undefined,
                requestedTime: undefined,
                requestedAt: undefined,
            };

            // Add to appointments (in real app, this would be saved to backend)
            const savedAppointments = localStorage.getItem('all_provider_appointments');
            const appointments = savedAppointments ? JSON.parse(savedAppointments) : [...ALL_PROVIDER_APPOINTMENTS];
            appointments.unshift(newAppointment);
            localStorage.setItem('all_provider_appointments', JSON.stringify(appointments));

            // Remove from pending requests
            const savedRequests = localStorage.getItem('pending_requests');
            const requests = savedRequests ? JSON.parse(savedRequests) : PENDING_APPOINTMENT_REQUESTS.filter(r => r.id !== requestId);
            const updatedRequests = requests.filter(r => r.id !== requestId);
            localStorage.setItem('pending_requests', JSON.stringify(updatedRequests));

            // Add success notification
            addNotification({
                type: 'appointment_accepted',
                title: 'Appointment Accepted',
                message: `You've accepted the appointment from ${request.clientName} for ${request.service} on ${request.requestedDate}.`,
            });

            toast.push({
                title: 'Appointment Accepted',
                description: `You've confirmed the booking with ${request.clientName}. They'll be notified shortly.`,
                variant: 'success',
            });

            // Redirect to appointments
            setTimeout(() => {
                navigate('/provider/appointments');
            }, 1000);
        } catch (error) {
            console.error('Error accepting request:', error);
            toast.push({
                title: 'Error',
                description: 'Failed to accept appointment. Please try again.',
                variant: 'error',
            });
            setIsProcessing(false);
        }
    };

    const handleDecline = async () => {
        setIsProcessing(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 800));

            // Remove from pending requests
            const savedRequests = localStorage.getItem('pending_requests');
            const requests = savedRequests ? JSON.parse(savedRequests) : PENDING_APPOINTMENT_REQUESTS.filter(r => r.id !== requestId);
            const updatedRequests = requests.filter(r => r.id !== requestId);
            localStorage.setItem('pending_requests', JSON.stringify(updatedRequests));

            // Add notification about decline
            addNotification({
                type: 'appointment_declined',
                title: 'Appointment Declined',
                message: `You've declined the appointment request from ${request.clientName}.`,
            });

            toast.push({
                title: 'Appointment Declined',
                description: `The client will be notified that you're unable to fulfill this request.`,
                variant: 'info',
            });

            // Redirect to appointments
            setTimeout(() => {
                navigate('/provider/appointments');
            }, 1000);
        } catch (error) {
            console.error('Error declining request:', error);
            toast.push({
                title: 'Error',
                description: 'Failed to decline appointment. Please try again.',
                variant: 'error',
            });
            setIsProcessing(false);
        }
    };

    const requestedDateTime = new Date(request.requestedAt);
    const timeAgo = Math.floor((new Date() - requestedDateTime) / 1000 / 60);

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">New Appointment Request</h1>
                    <p className="text-gray-600 mt-1">Review and decide to accept or decline</p>
                </div>
                <button
                    onClick={() => navigate('/provider/notifications')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <Icons.X size={24} />
                </button>
            </div>

            {/* Request Info Card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-brand-50 to-brand-100 border-b border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <img
                                src={request.clientAvatar}
                                alt={request.clientName}
                                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                            />
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{request.clientName}</h2>
                                <p className="text-sm text-gray-600">{request.service}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-semibold text-gray-500 uppercase">Requested</div>
                            <div className="text-sm text-gray-600">{timeAgo} minutes ago</div>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Client Details Section */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Client Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Email</p>
                                <p className="text-sm font-medium text-gray-900">{request.clientEmail}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Phone</p>
                                <p className="text-sm font-medium text-gray-900">{request.clientPhone}</p>
                            </div>
                        </div>
                    </div>

                    {/* Request Details Section */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Appointment Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Date & Time</p>
                                <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <Icons.Calendar size={16} />
                                    {request.requestedDate}
                                </p>
                                <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                                    <Icons.Clock size={16} />
                                    {request.requestedTime}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Service</p>
                                <p className="text-sm font-bold text-gray-900 mb-3">{request.service}</p>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Price</p>
                                <p className="text-lg font-bold text-brand-600">${request.price.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Location Section */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Service Location</h3>
                        <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
                            <Icons.MapPin size={20} className="text-brand-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-900">{request.address}</p>
                            </div>
                        </div>
                    </div>

                    {/* Client Notes Section */}
                    {request.clientNotes && (
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Client Notes</h3>
                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                                <p className="text-sm text-gray-700 italic">"{request.clientNotes}"</p>
                            </div>
                        </div>
                    )}

                    {/* Price Breakdown */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Payment</h3>
                        <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Service Price</span>
                                <span className="font-bold text-gray-900">${request.price.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-gray-200 mt-3 pt-3">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-gray-900">You'll Receive</span>
                                    <span className="text-lg font-bold text-green-600">${(request.price * 0.8).toFixed(2)}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">After platform fees (20%)</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center md:justify-end">
                <button
                    onClick={handleDecline}
                    disabled={isProcessing}
                    className="px-8 py-3 bg-gray-100 text-gray-900 rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isProcessing ? 'Processing...' : 'Decline Request'}
                </button>
                <button
                    onClick={handleAccept}
                    disabled={isProcessing}
                    className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-200"
                >
                    {isProcessing ? 'Processing...' : 'Accept & Confirm'}
                </button>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
                <Icons.AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-medium text-blue-900">By accepting this request, you're confirming availability for this date and time.</p>
                    <p className="text-xs text-blue-800 mt-1">You can manage or cancel appointments from your appointments page.</p>
                </div>
            </div>
        </div>
    );
};

export default AppointmentRequestAcceptance;
