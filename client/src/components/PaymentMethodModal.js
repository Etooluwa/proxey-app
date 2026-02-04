import { useState } from 'react';
import { CardElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Icons } from './Icons';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// Inner component that uses Stripe hooks (must be inside Elements provider)
const PaymentMethodForm = ({ onClose, onSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const cardElement = elements.getElement(CardElement);

            const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
            });

            if (stripeError) {
                setError(stripeError.message);
                setIsProcessing(false);
                return;
            }

            // Extract card details
            const cardData = {
                id: paymentMethod.id,
                brand: paymentMethod.card.brand,
                last4: paymentMethod.card.last4,
                expMonth: paymentMethod.card.exp_month,
                expYear: paymentMethod.card.exp_year,
                isDefault: false
            };

            onSuccess(cardData);
            onClose();
        } catch (err) {
            setError('Failed to add payment method. Please try again.');
            console.error('Payment method error:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Add Payment Method</h2>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <Icons.X size={20} className="text-gray-500" />
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Card Information
                    </label>
                    <div className="p-4 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-brand-100 focus-within:border-brand-300 transition-all">
                        <CardElement
                            options={{
                                style: {
                                    base: {
                                        fontSize: '16px',
                                        color: '#374151',
                                        '::placeholder': {
                                            color: '#9CA3AF',
                                        },
                                    },
                                    invalid: {
                                        color: '#EF4444',
                                    },
                                },
                            }}
                        />
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                        <Icons.AlertCircle size={18} className="text-red-500 mt-0.5" />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!stripe || isProcessing}
                        className="flex-1 px-4 py-3 rounded-xl font-bold bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Adding...' : 'Add Card'}
                    </button>
                </div>
            </form>

            <p className="text-xs text-gray-500 text-center mt-4">
                Your payment information is securely processed by Stripe
            </p>
        </div>
    );
};

// Outer component that provides the Elements context
const PaymentMethodModal = ({ isOpen, onClose, onSuccess }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Elements stripe={stripePromise}>
                <PaymentMethodForm onClose={onClose} onSuccess={onSuccess} />
            </Elements>
        </div>
    );
};

export default PaymentMethodModal;
