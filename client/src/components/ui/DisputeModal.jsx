import React, { useState } from 'react';
import { Icons } from '../Icons';
import { createDispute, DISPUTE_REASONS } from '../../data/disputes';

const DisputeModal = ({ open, onClose, booking, userRole }) => {
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Filter reasons based on user role
    const availableReasons = DISPUTE_REASONS.filter(r => {
        if (userRole === 'client') {
            return r.value !== 'no_show_client';
        }
        if (userRole === 'provider') {
            return r.value !== 'no_show_provider';
        }
        return true;
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!reason) {
            setError('Please select a reason');
            return;
        }
        if (description.length < 50) {
            setError('Please provide at least 50 characters of description');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await createDispute({
                bookingId: booking.id,
                reason,
                description,
                evidenceUrls: []
            });
            setSuccess(true);
        } catch (err) {
            setError(err.message || 'Failed to open dispute');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setReason('');
        setDescription('');
        setError('');
        setSuccess(false);
        onClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                            <Icons.AlertTriangle size={20} className="text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Open a Dispute</h2>
                            <p className="text-sm text-gray-500">Report an issue with this booking</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <Icons.X size={20} className="text-gray-500" />
                    </button>
                </div>

                {success ? (
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icons.CheckCircle size={32} className="text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Dispute Submitted</h3>
                        <p className="text-gray-600 mb-6">
                            We've received your dispute and will review it within 48 hours.
                            You'll be notified of the resolution.
                        </p>
                        <button
                            onClick={handleClose}
                            className="px-6 py-2 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Booking Info */}
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-sm text-gray-500 mb-1">Booking</p>
                            <p className="font-medium text-gray-900">{booking.serviceName || booking.services?.name || 'Service'}</p>
                            <p className="text-sm text-gray-600">
                                {new Date(booking.scheduledAt || booking.scheduled_at).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>

                        {/* Reason */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                What went wrong? <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                            >
                                <option value="">Select a reason...</option>
                                {availableReasons.map((r) => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Describe the issue <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                placeholder="Please provide details about what happened. Include any relevant information that will help us understand the situation..."
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none"
                            />
                            <p className={`text-xs mt-1 ${description.length >= 50 ? 'text-green-600' : 'text-gray-400'}`}>
                                {description.length}/50 minimum characters
                            </p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        {/* Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div className="flex gap-3">
                                <Icons.Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-800">
                                    <p className="font-medium mb-1">What happens next?</p>
                                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                                        <li>The other party will be notified and can respond</li>
                                        <li>Our team will review both sides</li>
                                        <li>We'll make a fair decision within 48 hours</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Icons.Loader className="w-4 h-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit Dispute'
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default DisputeModal;
