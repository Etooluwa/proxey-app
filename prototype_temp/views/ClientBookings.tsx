
import React, { useState } from 'react';
import { Icons } from '../components/Icons';
import { Booking, BookingStatus } from '../types';
import { CATEGORIES, TOP_PROVIDERS } from '../constants';

// --- UTILS: CALENDAR LINK GENERATOR ---
const generateCalendarLinks = (booking: Booking) => {
  const startTime = new Date(`${booking.date} ${booking.time}`);
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Assume 1 hour if duration not parsed

  const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d+/g, '');

  const details = {
    title: `${booking.serviceName} with ${booking.providerName}`,
    description: `Service: ${booking.serviceName}\nProvider: ${booking.providerName}\nLocation: ${booking.location}\nPrice: $${booking.price}`,
    location: booking.location,
    start: formatDate(startTime),
    end: formatDate(endTime)
  };

  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(details.title)}&dates=${details.start}/${details.end}&details=${encodeURIComponent(details.description)}&location=${encodeURIComponent(details.location)}`;
  
  const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&startdt=${startTime.toISOString()}&enddt=${endTime.toISOString()}&subject=${encodeURIComponent(details.title)}&body=${encodeURIComponent(details.description)}&location=${encodeURIComponent(details.location)}`;

  const downloadIcs = () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
URL:${document.location.href}
DTSTART:${details.start}
DTEND:${details.end}
SUMMARY:${details.title}
DESCRIPTION:${details.description}
LOCATION:${details.location}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'appointment.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return { googleUrl, outlookUrl, downloadIcs };
};

// --- SUB-VIEWS ---

const ClientInvoiceModal = ({ booking, onClose }: { booking: Booking, onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
       <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
          
          <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
             <div>
                <h3 className="text-lg font-bold text-gray-900">Invoice #{booking.id.slice(0,8).toUpperCase()}</h3>
                <p className="text-sm text-gray-500">{booking.date}</p>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                <Icons.X size={20} />
             </button>
          </div>

          <div className="p-8 space-y-8">
              
              <div className="flex justify-between items-start">
                 <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">From</p>
                    <p className="font-bold text-gray-900">{booking.providerName}</p>
                    <p className="text-sm text-gray-500">Professional Services</p>
                 </div>
                 <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Billed To</p>
                    <p className="font-bold text-gray-900">Alex Johnson</p>
                    <p className="text-sm text-gray-500">{booking.location}</p>
                 </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                 <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200 border-dashed">
                    <span className="font-medium text-gray-900">{booking.serviceName}</span>
                    <span className="font-bold text-gray-900">${booking.price.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm text-gray-500 mb-1">
                    <span>Subtotal</span>
                    <span>${booking.price.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Service Fee (5%)</span>
                    <span>${(booking.price * 0.05).toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                    <span className="font-bold text-gray-900">Total Paid</span>
                    <span className="font-bold text-brand-600 text-lg">${(booking.price * 1.05).toFixed(2)}</span>
                 </div>
              </div>

              <div className="flex gap-3">
                  <div className="flex-1 p-3 bg-green-50 rounded-xl border border-green-100 flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-full text-green-600">
                          <Icons.Check size={16} />
                      </div>
                      <div>
                          <p className="text-xs font-bold text-green-700 uppercase">Status</p>
                          <p className="font-bold text-green-900 text-sm">Paid in Full</p>
                      </div>
                  </div>
                  <div className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                       <div className="bg-gray-200 p-2 rounded-full text-gray-600">
                          <Icons.Wallet size={16} />
                       </div>
                       <div>
                          <p className="text-xs font-bold text-gray-500 uppercase">Method</p>
                          <p className="font-bold text-gray-900 text-sm">Visa ••4242</p>
                       </div>
                  </div>
              </div>

          </div>

          <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
             <button className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                <Icons.Message size={18} /> Get Help
             </button>
             <button className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-brand-600 transition-colors shadow-lg flex items-center justify-center gap-2">
                <Icons.Download size={18} /> Download PDF
             </button>
          </div>

       </div>
    </div>
  );
};

interface CalendarExportModalProps {
  booking: Booking;
  onClose: () => void;
}

const CalendarExportModal: React.FC<CalendarExportModalProps> = ({ booking, onClose }) => {
  const { googleUrl, outlookUrl, downloadIcs } = generateCalendarLinks(booking);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
       <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-6" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Add to Calendar</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
               <Icons.X size={20} />
            </button>
          </div>
          
          <div className="space-y-3">
             <a 
               href={googleUrl} 
               target="_blank" 
               rel="noopener noreferrer"
               className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-all group"
             >
                <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm text-xl">
                   G
                </div>
                <span className="font-bold text-gray-700 group-hover:text-gray-900">Google Calendar</span>
             </a>
             
             <a 
               href={outlookUrl} 
               target="_blank" 
               rel="noopener noreferrer"
               className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-all group"
             >
                <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center shadow-sm text-blue-600">
                   <Icons.Message size={20} />
                </div>
                <span className="font-bold text-gray-700 group-hover:text-gray-900">Outlook</span>
             </a>

             <button 
               onClick={downloadIcs}
               className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-all group"
             >
                <div className="w-10 h-10 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center shadow-sm text-gray-600">
                   <Icons.Calendar size={20} />
                </div>
                <span className="font-bold text-gray-700 group-hover:text-gray-900">iCal / Apple Calendar</span>
             </button>
          </div>
       </div>
    </div>
  );
};

interface CancelBookingViewProps {
  booking: Booking;
  onBack: () => void;
  onConfirm: () => void;
}

const CancelBookingView: React.FC<CancelBookingViewProps> = ({ booking, onBack, onConfirm }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onConfirm();
    }, 1000);
  };

  return (
    <div className="max-w-lg mx-auto animate-in fade-in zoom-in-95 duration-300 py-12">
       <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl text-center">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
             <Icons.Alert size={40} strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cancel Appointment?</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
             Are you sure you want to cancel your booking with <span className="font-bold text-gray-900">{booking.providerName}</span>?
             <br/><span className="text-xs text-gray-400 mt-2 block">This action cannot be undone.</span>
          </p>
          
          <div className="bg-gray-50 p-4 rounded-xl mb-8 text-left flex gap-4 border border-gray-100">
              <img src={booking.providerAvatar} alt={booking.providerName} className="w-12 h-12 rounded-full object-cover" />
              <div>
                  <h4 className="font-bold text-gray-900 text-sm">{booking.serviceName}</h4>
                  <p className="text-xs text-gray-500">{booking.date} at {booking.time}</p>
              </div>
          </div>

          <div className="space-y-3">
              <button 
                  onClick={handleConfirm}
                  disabled={isProcessing}
                  className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-100"
              >
                  {isProcessing ? 'Cancelling...' : 'Yes, Cancel Booking'}
              </button>
              <button 
                  onClick={onBack}
                  disabled={isProcessing}
                  className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
              >
                  No, Keep it
              </button>
          </div>
       </div>
    </div>
  );
};

interface RescheduleBookingViewProps {
  booking: Booking;
  onBack: () => void;
  onConfirm: (date: string, time: string) => void;
}

const RescheduleBookingView: React.FC<RescheduleBookingViewProps> = ({ booking, onBack, onConfirm }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleConfirm = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto text-center pt-12 animate-in zoom-in-95 duration-300">
         <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
           <Icons.Check size={48} strokeWidth={3} />
         </div>
         <h2 className="text-3xl font-bold text-gray-900 mb-3">Rescheduled!</h2>
         <p className="text-gray-500 mb-8 text-lg leading-relaxed">
           Your appointment with <span className="font-semibold text-gray-900">{booking.providerName}</span> has been updated.
         </p>
         <button onClick={() => onConfirm(date, time)} className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-brand-600 transition-colors shadow-lg shadow-brand-200">
           Back to Bookings
         </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-right-8 duration-300 py-6">
       <div className="flex items-center gap-4 mb-8">
         <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 transition-colors bg-white border border-gray-200 shadow-sm">
           <Icons.ArrowLeft size={20} className="text-gray-700" />
         </button>
         <h1 className="text-2xl font-bold text-gray-900">Reschedule Booking</h1>
       </div>

       <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          
          {/* Current Slot Info */}
          <div className="bg-brand-50 p-4 rounded-xl border border-brand-100 flex items-center justify-between">
             <div>
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">Current Time</span>
                <span className="font-bold text-brand-900 flex items-center gap-2">
                   <Icons.Calendar size={16} /> {booking.date} • {booking.time}
                </span>
             </div>
          </div>

          <div>
             <label className="block text-sm font-bold text-gray-700 mb-2">New Date</label>
             <div className="relative">
                <Icons.Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all text-gray-700 font-medium" 
                />
             </div>
          </div>

          <div>
             <label className="block text-sm font-bold text-gray-700 mb-2">New Time</label>
             <div className="relative">
                <Icons.Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="time" 
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all text-gray-700 font-medium" 
                />
             </div>
          </div>

          <div>
             <label className="block text-sm font-bold text-gray-700 mb-2">Reason for change (Optional)</label>
             <textarea 
               placeholder="Conflict with work schedule..." 
               className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all h-24 resize-none text-gray-700"
             />
          </div>

          <button 
            onClick={handleConfirm}
            disabled={!date || !time || isProcessing}
            className={`w-full py-4 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2
               ${!date || !time || isProcessing 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                  : 'bg-gray-900 text-white hover:bg-brand-600 shadow-brand-200'}
            `}
          >
            {isProcessing ? 'Updating...' : 'Confirm New Time'}
          </button>
       </div>
    </div>
  );
};

interface MessageProviderViewProps {
  booking: Booking;
  onBack: () => void;
  onSend: () => void;
}

const MessageProviderView: React.FC<MessageProviderViewProps> = ({ booking, onBack, onSend }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const quickTags = ["I'm running late", "Is the location correct?", "Rescheduling question", "Thanks!"];

  const handleSend = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setIsSent(true);
    }, 1000);
  };

  if (isSent) {
     return (
       <div className="max-w-lg mx-auto text-center pt-20 animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Icons.Message size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Message Sent</h2>
          <p className="text-gray-500 mb-8">
            {booking.providerName} will receive your message instantly.
          </p>
          <button onClick={onSend} className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-brand-600 transition-colors shadow-lg">
            Done
          </button>
       </div>
     );
  }

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-300 py-6">
       <div className="flex items-center gap-4 mb-8">
         <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 transition-colors bg-white border border-gray-200 shadow-sm">
           <Icons.ArrowLeft size={20} className="text-gray-700" />
         </button>
         <h1 className="text-2xl font-bold text-gray-900">Message Provider</h1>
       </div>

       <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          
          {/* Recipient Info */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
             <img src={booking.providerAvatar} alt={booking.providerName} className="w-12 h-12 rounded-full object-cover" />
             <div>
                <h3 className="font-bold text-gray-900 text-lg">{booking.providerName}</h3>
                <p className="text-sm text-brand-600 font-medium">Regarding: {booking.serviceName}</p>
             </div>
          </div>

          <div className="mb-6">
             <label className="block text-sm font-bold text-gray-700 mb-2">Quick select</label>
             <div className="flex flex-wrap gap-2">
                {quickTags.map(tag => (
                   <button 
                     key={tag}
                     onClick={() => setMessage(tag)}
                     className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-colors"
                   >
                     {tag}
                   </button>
                ))}
             </div>
          </div>

          <div className="mb-8">
             <textarea 
               value={message}
               onChange={(e) => setMessage(e.target.value)}
               placeholder="Type your message here..." 
               className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all h-40 resize-none text-gray-700 placeholder-gray-400 text-base"
               autoFocus
             />
          </div>

          <button 
            onClick={handleSend}
            disabled={!message || isSending}
            className={`w-full py-4 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2
               ${!message || isSending
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                  : 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-200'}
            `}
          >
            {isSending ? 'Sending...' : 'Send Message'} <Icons.Message size={18} />
          </button>
       </div>
    </div>
  );
};

interface LeaveReviewViewProps {
  booking: Booking;
  onBack: () => void;
  onSuccess: () => void;
}

const LeaveReviewView: React.FC<LeaveReviewViewProps> = ({ booking, onBack, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) return; // Validation
    setIsSubmitting(true);
    // Mock API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  if (isSuccess) {
     return (
        <div className="max-w-xl mx-auto text-center pt-12 animate-in zoom-in-95 duration-300">
           <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
             <Icons.Check size={48} strokeWidth={3} />
           </div>
           <h2 className="text-3xl font-bold text-gray-900 mb-3">Review Submitted!</h2>
           <p className="text-gray-500 mb-8 text-lg leading-relaxed">
             Thanks for sharing your experience with <span className="font-semibold text-gray-900">{booking.providerName}</span>.<br/>
             Your feedback helps others make better choices.
           </p>
           <button onClick={onSuccess} className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-brand-600 transition-colors shadow-lg shadow-brand-200">
             Return to Bookings
           </button>
        </div>
     )
  }

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-right-8 duration-300 py-6">
       {/* Header */}
       <div className="flex items-center gap-4 mb-8">
         <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 transition-colors bg-white border border-gray-200 shadow-sm">
           <Icons.ArrowLeft size={20} className="text-gray-700" />
         </button>
         <h1 className="text-2xl font-bold text-gray-900">Write a Review</h1>
       </div>

       <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg">
          
          {/* Provider Info */}
          <div className="flex items-center gap-4 mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100">
             <img src={booking.providerAvatar} alt={booking.providerName} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" />
             <div>
               <h3 className="font-bold text-gray-900 text-lg">{booking.providerName}</h3>
               <p className="text-sm text-gray-500">{booking.serviceName} • {booking.date}</p>
             </div>
          </div>

          {/* Rating Inputs */}
          <div className="mb-8 text-center">
             <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Rate your experience</label>
             <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                   <button 
                     key={star}
                     onMouseEnter={() => setHoverRating(star)}
                     onMouseLeave={() => setHoverRating(0)}
                     onClick={() => setRating(star)}
                     className="p-1 transition-transform hover:scale-110 focus:outline-none"
                   >
                      <Icons.Star 
                        size={40} 
                        className={`transition-colors ${
                           (hoverRating || rating) >= star 
                           ? 'text-yellow-400 fill-current' 
                           : 'text-gray-200'
                        }`} 
                      />
                   </button>
                ))}
             </div>
             <p className="text-sm font-bold text-brand-600 mt-2 h-5 transition-all">
                {hoverRating === 5 ? 'Amazing!' : hoverRating === 4 ? 'Good' : hoverRating === 3 ? 'Okay' : hoverRating === 2 ? 'Poor' : hoverRating === 1 ? 'Terrible' : ''}
             </p>
          </div>

          {/* Review Text */}
          <div className="mb-8">
             <label className="block text-sm font-bold text-gray-700 mb-2">Your Review</label>
             <textarea 
               value={reviewText}
               onChange={(e) => setReviewText(e.target.value)}
               placeholder="Share details of your own experience..."
               className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all h-40 resize-none text-gray-700 placeholder-gray-400"
             />
             <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-400 font-medium">Minimum 10 characters</span>
                <span className="text-xs text-gray-400 font-medium">{reviewText.length}/500</span>
             </div>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className={`w-full py-4 rounded-xl font-bold text-white shadow-xl transition-all flex items-center justify-center gap-2
               ${rating === 0 || isSubmitting ? 'bg-gray-300 cursor-not-allowed shadow-none' : 'bg-gray-900 hover:bg-brand-600 shadow-gray-200 hover:shadow-brand-200'}
            `}
          >
            {isSubmitting ? (
               <>Submitting...</>
            ) : (
               <>Submit Review <Icons.ChevronRight size={18} /></>
            )}
          </button>

       </div>
    </div>
  );
}

// --- MAIN COMPONENT ---

interface ClientBookingsProps {
  bookings: Booking[];
  onUpdateBooking: (booking: Booking) => void;
  onProviderClick?: (providerId: string) => void;
}

export const ClientBookings: React.FC<ClientBookingsProps> = ({ bookings, onUpdateBooking, onProviderClick }) => {
  const [activeFilter, setActiveFilter] = useState<'UPCOMING' | 'PAST' | 'CANCELLED'>('UPCOMING');
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // View States
  const [reviewingBookingId, setReviewingBookingId] = useState<string | null>(null);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [reschedulingBookingId, setReschedulingBookingId] = useState<string | null>(null);
  const [messagingBookingId, setMessagingBookingId] = useState<string | null>(null);
  const [calendarBooking, setCalendarBooking] = useState<Booking | null>(null);
  const [invoiceBooking, setInvoiceBooking] = useState<Booking | null>(null);

  const filteredBookings = bookings.filter(booking => {
    if (activeFilter === 'UPCOMING') return booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.PENDING;
    if (activeFilter === 'PAST') return booking.status === BookingStatus.COMPLETED;
    if (activeFilter === 'CANCELLED') return booking.status === BookingStatus.CANCELLED;
    return true;
  });

  // Filter providers based on search query
  const filteredProviders = TOP_PROVIDERS.filter(provider => {
    const query = searchQuery.toLowerCase();
    return (
      provider.name.toLowerCase().includes(query) ||
      provider.title.toLowerCase().includes(query) ||
      provider.categories.some(cat => cat.toLowerCase().includes(query))
    );
  });

  const getCategoryIcon = (name: string) => {
    switch (name) {
      case 'Cleaning': return Icons.Sparkles;
      case 'Repair': return Icons.Wrench;
      case 'Beauty': return Icons.Scissors;
      case 'Moving': return Icons.Truck;
      case 'Painting': return Icons.Paintbrush;
      case 'Plumbing': return Icons.Droplets;
      default: return Icons.Sparkles;
    }
  };

  // --- Render Logic for Sub-Views ---

  if (reviewingBookingId) {
     const booking = bookings.find(b => b.id === reviewingBookingId);
     if (booking) {
        return (
           <LeaveReviewView 
              booking={booking} 
              onBack={() => setReviewingBookingId(null)} 
              onSuccess={() => setReviewingBookingId(null)} 
           />
        );
     }
  }

  if (cancellingBookingId) {
     const booking = bookings.find(b => b.id === cancellingBookingId);
     if (booking) {
        return (
           <CancelBookingView 
              booking={booking} 
              onBack={() => setCancellingBookingId(null)} 
              onConfirm={() => {
                 onUpdateBooking({...booking, status: BookingStatus.CANCELLED});
                 setCancellingBookingId(null);
              }} 
           />
        );
     }
  }

  if (reschedulingBookingId) {
    const booking = bookings.find(b => b.id === reschedulingBookingId);
    if (booking) {
      return (
        <RescheduleBookingView 
          booking={booking}
          onBack={() => setReschedulingBookingId(null)}
          onConfirm={(newDate, newTime) => {
            // Format date/time for mock
            const formattedDate = new Date(newDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            onUpdateBooking({ ...booking, date: formattedDate, time: newTime });
            setReschedulingBookingId(null);
          }}
        />
      );
    }
  }

  if (messagingBookingId) {
    const booking = bookings.find(b => b.id === messagingBookingId);
    if (booking) {
      return (
        <MessageProviderView 
          booking={booking}
          onBack={() => setMessagingBookingId(null)}
          onSend={() => setMessagingBookingId(null)}
        />
      );
    }
  }

  if (isSearching) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center gap-4">
           <button 
             onClick={() => {
               setIsSearching(false);
               setSearchQuery('');
             }} 
             className="p-2 bg-white border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
           >
             <Icons.ArrowLeft size={20} />
           </button>
           <div>
             <h1 className="text-2xl font-bold text-gray-900">New Booking</h1>
             <p className="text-gray-500 text-sm">Find a professional or service for your next job</p>
           </div>
        </div>

        {/* Search Input */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 focus-within:ring-2 focus-within:ring-brand-100 transition-all sticky top-0 z-10">
            <Icons.Search className="text-gray-400" size={22} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by service (e.g. Cleaning) or provider name..." 
              className="flex-1 outline-none text-gray-700 placeholder-gray-400 text-lg"
              autoFocus
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <Icons.X size={18} />
              </button>
            )}
            <button className="bg-gray-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-brand-500 transition-colors">
              Search
            </button>
         </div>

         {/* Dynamic Content based on Search */}
         {!searchQuery ? (
           <>
             {/* Categories Grid */}
             <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Popular Categories</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {CATEGORIES.map((cat) => {
                    const Icon = getCategoryIcon(cat.name);
                    return (
                      <button key={cat.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-200 hover:-translate-y-1 transition-all group text-center flex flex-col items-center justify-center h-32">
                        <div className={`w-10 h-10 rounded-full ${cat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                          <Icon size={18} />
                        </div>
                        <span className="font-semibold text-gray-700 text-sm group-hover:text-brand-600">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
             </div>

             {/* Top Providers List (Default) */}
             <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Top Rated Professionals</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {TOP_PROVIDERS.map((provider) => (
                    <ProviderCard key={provider.id} provider={provider} onClick={onProviderClick} />
                  ))}
                </div>
             </div>
           </>
         ) : (
           /* Search Results */
           <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Search Results 
                <span className="text-gray-400 font-normal text-sm ml-2">({filteredProviders.length} found)</span>
              </h3>
              
              {filteredProviders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredProviders.map((provider) => (
                    <ProviderCard key={provider.id} provider={provider} onClick={onProviderClick} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                   <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Icons.Search className="text-gray-300" size={32} />
                   </div>
                   <h3 className="text-gray-900 font-bold text-lg">No results found</h3>
                   <p className="text-gray-500 mb-6">We couldn't find any providers or services matching "{searchQuery}".</p>
                   <button 
                     onClick={() => setSearchQuery('')}
                     className="text-sm font-semibold text-brand-600 hover:underline"
                   >
                     Clear search
                   </button>
                </div>
              )}
           </div>
         )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-500 mt-1">Manage your appointments and view history.</p>
        </div>
        <button 
          onClick={() => setIsSearching(true)}
          className="bg-brand-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200 flex items-center gap-2"
        >
          <Icons.Search size={18} />
          Find New Service
        </button>
      </div>
      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-8 overflow-x-auto">
        <button 
          onClick={() => setActiveFilter('UPCOMING')}
          className={`pb-4 text-sm font-bold relative transition-colors whitespace-nowrap ${activeFilter === 'UPCOMING' ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Upcoming
          {activeFilter === 'UPCOMING' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setActiveFilter('PAST')}
          className={`pb-4 text-sm font-bold relative transition-colors whitespace-nowrap ${activeFilter === 'PAST' ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Past
          {activeFilter === 'PAST' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setActiveFilter('CANCELLED')}
          className={`pb-4 text-sm font-bold relative transition-colors whitespace-nowrap ${activeFilter === 'CANCELLED' ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Cancelled
          {activeFilter === 'CANCELLED' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 rounded-t-full"></div>}
        </button>
      </div>

      {/* Booking List */}
      <div className="space-y-4">
        {filteredBookings.length > 0 ? (
          filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6 items-start md:items-center group">
              
              {/* Date Box */}
              <div className="flex-shrink-0 bg-brand-50 rounded-xl p-4 text-center min-w-[90px] flex flex-col justify-center group-hover:bg-brand-100 transition-colors">
                <span className="text-xs font-bold text-brand-400 uppercase">{booking.date.split(' ')[0]}</span>
                <span className="text-2xl font-bold text-brand-900">{booking.date.split(' ')[1] ? booking.date.split(' ')[1].replace(',', '') : booking.date}</span>
                <span className="text-xs font-medium text-brand-600 mt-1">{booking.time}</span>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{booking.serviceName}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                    booking.status === BookingStatus.CONFIRMED ? 'bg-green-100 text-green-700' :
                    booking.status === BookingStatus.PENDING ? 'bg-yellow-100 text-yellow-700' :
                    booking.status === BookingStatus.COMPLETED ? 'bg-gray-100 text-gray-600' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {booking.status}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 mb-3">
                   <button 
                     onClick={(e) => {
                       e.stopPropagation();
                       if (booking.providerId && onProviderClick) onProviderClick(booking.providerId);
                     }}
                     className="flex items-center gap-3 hover:bg-gray-50 -ml-2 px-2 py-1 rounded-lg transition-colors group/provider text-left"
                   >
                       <img src={booking.providerAvatar} alt={booking.providerName} className="w-6 h-6 rounded-full object-cover group-hover/provider:ring-2 ring-brand-100" />
                       <span className="text-sm font-medium text-gray-600 group-hover/provider:text-brand-600 group-hover/provider:underline underline-offset-2">{booking.providerName}</span>
                   </button>
                   <span className="text-gray-300">•</span>
                   <span className="text-sm text-gray-500 font-medium">${booking.price.toFixed(2)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-400">
                   <Icons.MapPin size={14} />
                   <span>{booking.location}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex md:flex-col gap-3 w-full md:w-auto border-t md:border-t-0 md:border-l border-gray-50 pt-4 md:pt-0 md:pl-6">
                {activeFilter === 'UPCOMING' ? (
                  <>
                    <div className="flex gap-2">
                        <button 
                        onClick={() => setReschedulingBookingId(booking.id)}
                        className="flex-1 md:flex-auto px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
                        >
                        Reschedule
                        </button>
                        
                        {/* Add to Calendar Button */}
                        {booking.status === BookingStatus.CONFIRMED && (
                            <button 
                            onClick={() => setCalendarBooking(booking)}
                            className="px-3 py-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-brand-50 hover:text-brand-600 transition-colors"
                            title="Add to Calendar"
                            >
                                <Icons.Calendar size={18} />
                            </button>
                        )}
                    </div>

                    <button 
                      onClick={() => setMessagingBookingId(booking.id)}
                      className="px-4 py-2 bg-brand-50 text-brand-600 rounded-xl text-sm font-bold hover:bg-brand-100 transition-colors"
                    >
                      Message
                    </button>
                    <button 
                      onClick={() => setCancellingBookingId(booking.id)}
                      className="px-4 py-2 bg-white text-red-500 border border-transparent rounded-xl text-sm font-bold hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : activeFilter === 'PAST' ? (
                  <>
                    <button 
                      onClick={() => setReviewingBookingId(booking.id)}
                      className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors flex items-center gap-2 justify-center hover:text-brand-600 hover:border-brand-200 shadow-sm"
                    >
                      <Icons.Star size={14} /> Review
                    </button>
                    <button 
                       onClick={() => setInvoiceBooking(booking)}
                       className="px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors flex items-center gap-2 justify-center"
                    >
                      <Icons.FileText size={14} /> Invoice
                    </button>
                  </>
                ) : (
                  <button className="px-4 py-2 bg-white border border-gray-200 text-gray-400 rounded-xl text-sm font-bold cursor-not-allowed">
                    Archived
                  </button>
                )}
              </div>

            </div>
          ))
        ) : (
           <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icons.Calendar className="text-gray-300" size={32} />
              </div>
              <h3 className="text-gray-900 font-bold text-lg">No bookings found</h3>
              <p className="text-gray-500 mb-6">You don't have any {activeFilter.toLowerCase()} bookings.</p>
              {activeFilter === 'UPCOMING' && (
                <button 
                  onClick={() => setIsSearching(true)}
                  className="text-sm font-semibold text-brand-600 bg-brand-50 px-6 py-2 rounded-xl hover:bg-brand-100 transition-colors"
                >
                  Find a Service
                </button>
              )}
           </div>
        )}
      </div>

      {/* Calendar Export Modal */}
      {calendarBooking && (
        <CalendarExportModal 
            booking={calendarBooking}
            onClose={() => setCalendarBooking(null)}
        />
      )}

      {/* Invoice View Modal */}
      {invoiceBooking && (
        <ClientInvoiceModal 
            booking={invoiceBooking}
            onClose={() => setInvoiceBooking(null)}
        />
      )}

    </div>
  );
};

// Helper Component for rendering a provider card
const ProviderCard = ({ provider, onClick }: { provider: any, onClick?: (id: string) => void }) => (
  <div 
    onClick={() => onClick && onClick(provider.id)}
    className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer"
  >
    <div className="flex justify-between items-start mb-4">
       <div className="flex gap-4">
          <img src={provider.avatarUrl} alt={provider.name} className="w-14 h-14 rounded-full object-cover border border-gray-100" />
          <div>
             <h4 className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{provider.name}</h4>
             <p className="text-xs text-brand-600 font-bold uppercase tracking-wide mb-1">{provider.title}</p>
             <div className="flex items-center gap-1 text-xs text-gray-500">
               <Icons.Star size={12} className="text-yellow-400 fill-current" />
               <span className="font-bold text-gray-900">{provider.rating}</span>
               <span>({provider.reviewCount} reviews)</span>
             </div>
          </div>
       </div>
       <div className="text-right">
          <span className="block text-xl font-bold text-gray-900">${provider.hourlyRate}</span>
          <span className="text-xs text-gray-400">/ hour</span>
       </div>
    </div>
    
    <div className="flex gap-2 mb-4">
      {provider.categories.map((tag: string) => (
        <span key={tag} className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md font-medium border border-gray-100">
          {tag}
        </span>
      ))}
    </div>

    <button 
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick(provider.id);
      }}
      className="w-full py-2.5 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-brand-500 transition-colors shadow-lg shadow-gray-200 group-hover:shadow-brand-200"
    >
      Check Availability
    </button>
  </div>
);
