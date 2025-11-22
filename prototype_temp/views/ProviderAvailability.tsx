
import React, { useState, useEffect } from 'react';
import { Icons } from '../components/Icons';
import { ScheduleDay, DateOverride } from '../types';

const TIME_SLOTS = [
  '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM'
];

interface ProviderAvailabilityProps {
  schedule: ScheduleDay[];
  exceptions: DateOverride[];
  onUpdateSchedule: (schedule: ScheduleDay[]) => void;
  onUpdateExceptions: (exceptions: DateOverride[]) => void;
}

export const ProviderAvailability: React.FC<ProviderAvailabilityProps> = ({ schedule, exceptions, onUpdateSchedule, onUpdateExceptions }) => {
  // Local state for editing
  const [localSchedule, setLocalSchedule] = useState<ScheduleDay[]>(schedule);
  const [localExceptions, setLocalExceptions] = useState<DateOverride[]>(exceptions);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Date Override State
  const [isAddOverrideOpen, setIsAddOverrideOpen] = useState(false);
  const [newOverride, setNewOverride] = useState({ date: '', reason: '' });

  // Sync local state with props if props change (e.g., re-mount or parent update)
  useEffect(() => {
    setLocalSchedule(schedule);
    setLocalExceptions(exceptions);
  }, [schedule, exceptions]);

  const toggleDay = (id: string) => {
    setLocalSchedule(localSchedule.map(day => 
      day.id === id ? { ...day, active: !day.active } : day
    ));
  };

  const updateTime = (id: string, field: 'start' | 'end', value: string) => {
    setLocalSchedule(localSchedule.map(day => 
      day.id === id ? { ...day, [field]: value } : day
    ));
  };

  const copyToAll = (sourceDay: ScheduleDay) => {
    setLocalSchedule(localSchedule.map(day => 
      day.id !== sourceDay.id ? { ...day, active: sourceDay.active, start: sourceDay.start, end: sourceDay.end } : day
    ));
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API saving delay
    setTimeout(() => {
      onUpdateSchedule(localSchedule);
      onUpdateExceptions(localExceptions);
      setIsSaving(false);
      setIsSuccess(true);
    }, 1500);
  };

  const handleAddOverride = () => {
    if (!newOverride.date) return;
    const newId = Math.max(0, ...localExceptions.map(e => e.id)) + 1;
    const updatedExceptions = [...localExceptions, { id: newId, ...newOverride }];
    setLocalExceptions(updatedExceptions);
    setNewOverride({ date: '', reason: '' });
    setIsAddOverrideOpen(false);
  };

  const handleRemoveOverride = (id: number) => {
    setLocalExceptions(localExceptions.filter(e => e.id !== id));
  };

  const formatDateDisplay = (dateStr: string) => {
    // Handle date formatting for display
    if (!dateStr) return '';
    // Append time to force local timezone interpretation or split YYYY-MM-DD to avoid UTC shift issues with Date()
    const [year, month, day] = dateStr.split('-').map(Number);
    if (year && month && day) {
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return dateStr; // Fallback
  };

  if (isSuccess) {
    return (
        <div className="max-w-xl mx-auto text-center pt-20 animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Icons.Check size={48} strokeWidth={3} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Schedule Updated!</h2>
            <p className="text-gray-500 mb-8 text-lg leading-relaxed">
              Your availability has been successfully saved.<br/>Clients will see your new hours immediately.
            </p>
            <button 
              onClick={() => setIsSuccess(false)}
              className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-brand-600 transition-colors shadow-lg shadow-brand-200"
            >
              Back to Availability
            </button>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Availability</h1>
          <p className="text-gray-500 mt-1">Set your recurring weekly schedule and time off.</p>
        </div>
        <div className="flex gap-3">
          <button 
             disabled={isSaving}
             className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-brand-500 transition-colors shadow-lg flex items-center gap-2"
          >
            {isSaving ? (
               <>Saving...</>
            ) : (
               <>Save Changes <Icons.Check size={18} /></>
            )}
          </button>
        </div>
      </div>

      {/* Weekly Schedule Card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Icons.Calendar size={20} className="text-brand-500" /> 
            Weekly Schedule
          </h3>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Default Hours</span>
        </div>

        <div className="divide-y divide-gray-50">
          {localSchedule.map((day) => (
            <div key={day.id} className={`p-4 md:p-6 transition-colors ${day.active ? 'bg-white' : 'bg-gray-50/30'}`}>
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                
                {/* Toggle & Label */}
                <div className="flex items-center gap-4 w-40">
                  <button 
                    onClick={() => toggleDay(day.id)}
                    className={`w-12 h-6 rounded-full relative transition-colors flex-shrink-0 ${day.active ? 'bg-brand-500' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${day.active ? 'left-7' : 'left-1'}`}></div>
                  </button>
                  <span className={`font-bold ${day.active ? 'text-gray-900' : 'text-gray-400'}`}>{day.label}</span>
                </div>

                {/* Time Selectors */}
                <div className="flex-1 flex items-center gap-3">
                  {day.active ? (
                    <>
                      <div className="relative flex-1 md:flex-none md:w-40">
                        <select 
                          value={day.start}
                          onChange={(e) => updateTime(day.id, 'start', e.target.value)}
                          className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-4 pr-8 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-100 hover:border-brand-200 transition-colors cursor-pointer"
                        >
                          {TIME_SLOTS.map(time => <option key={time} value={time}>{time}</option>)}
                        </select>
                        <Icons.ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" size={14} />
                      </div>
                      
                      <span className="text-gray-300">-</span>
                      
                      <div className="relative flex-1 md:flex-none md:w-40">
                        <select 
                           value={day.end}
                           onChange={(e) => updateTime(day.id, 'end', e.target.value)}
                           className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-4 pr-8 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-100 hover:border-brand-200 transition-colors cursor-pointer"
                        >
                           {TIME_SLOTS.map(time => <option key={time} value={time}>{time}</option>)}
                        </select>
                        <Icons.ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" size={14} />
                      </div>

                      {/* Copy Actions */}
                      <button 
                        onClick={() => copyToAll(day)}
                        className="hidden md:flex ml-4 text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline whitespace-nowrap"
                      >
                        Copy to all
                      </button>
                    </>
                  ) : (
                    <span className="text-gray-400 font-medium text-sm italic py-2">Unavailable</span>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Date Overrides */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <div className="flex justify-between items-start mb-6">
           <div>
             <h3 className="text-lg font-bold text-gray-900">Date Overrides</h3>
             <p className="text-sm text-gray-500">Add specific dates when you are unavailable (holidays, vacation, etc.)</p>
           </div>
           <button 
             onClick={() => setIsAddOverrideOpen(true)}
             className="text-brand-600 font-bold text-sm hover:bg-brand-50 px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
           >
             <Icons.Calendar size={16} /> Add Date
           </button>
        </div>

        {localExceptions.length > 0 ? (
          <div className="space-y-3">
            {localExceptions.map(ex => (
              <div key={ex.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 shadow-sm">
                    <Icons.Calendar size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{formatDateDisplay(ex.date)}</p>
                    <p className="text-xs text-gray-500">{ex.reason}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleRemoveOverride(ex.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Icons.X size={18} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">
            No date overrides set.
          </div>
        )}
      </div>

      {/* Add Override Modal */}
      {isAddOverrideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-900">Add Date Override</h2>
                    <button onClick={() => setIsAddOverrideOpen(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                        <Icons.X size={20} />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                        <input 
                            type="date" 
                            value={newOverride.date}
                            onChange={(e) => setNewOverride({...newOverride, date: e.target.value})}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reason</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Vacation, Personal Day"
                            value={newOverride.reason}
                            onChange={(e) => setNewOverride({...newOverride, reason: e.target.value})}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
                        />
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    <button onClick={() => setIsAddOverrideOpen(false)} className="px-6 py-2.5 font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors text-sm">
                        Cancel
                    </button>
                    <button 
                        onClick={handleAddOverride}
                        disabled={!newOverride.date}
                        className={`px-8 py-2.5 font-bold rounded-xl transition-colors shadow-lg text-sm ${!newOverride.date ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-brand-600 shadow-brand-200'}`}
                    >
                        Add Date
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};
