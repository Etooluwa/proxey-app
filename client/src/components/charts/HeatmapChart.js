import React from 'react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const HeatmapChart = ({ data = [] }) => {
    // Create a map for quick lookup
    const dataMap = {};
    let maxValue = 0;
    data.forEach(({ dayOfWeek, hour, bookings }) => {
        const key = `${dayOfWeek}-${hour}`;
        dataMap[key] = bookings;
        if (bookings > maxValue) maxValue = bookings;
    });

    const getColor = (value) => {
        if (!value || maxValue === 0) return 'bg-gray-100';
        const intensity = value / maxValue;
        if (intensity > 0.75) return 'bg-brand-500';
        if (intensity > 0.5) return 'bg-brand-400';
        if (intensity > 0.25) return 'bg-brand-300';
        return 'bg-brand-200';
    };

    const formatHour = (h) => {
        if (h === 0) return '12am';
        if (h === 12) return '12pm';
        if (h < 12) return `${h}am`;
        return `${h - 12}pm`;
    };

    return (
        <div className="overflow-x-auto">
            <div className="min-w-[600px]">
                {/* Header row - hours */}
                <div className="flex mb-1">
                    <div className="w-12 flex-shrink-0"></div>
                    {HOURS.filter((_, i) => i % 3 === 0).map((hour) => (
                        <div
                            key={hour}
                            className="flex-1 text-center text-[10px] text-gray-400 font-medium"
                        >
                            {formatHour(hour)}
                        </div>
                    ))}
                </div>

                {/* Grid rows - one per day */}
                {DAYS.map((day, dayIndex) => (
                    <div key={day} className="flex items-center mb-1">
                        <div className="w-12 flex-shrink-0 text-xs text-gray-500 font-medium pr-2 text-right">
                            {day}
                        </div>
                        <div className="flex flex-1 gap-0.5">
                            {HOURS.map((hour) => {
                                const key = `${dayIndex}-${hour}`;
                                const value = dataMap[key] || 0;
                                return (
                                    <div
                                        key={hour}
                                        className={`flex-1 h-6 rounded-sm ${getColor(value)} transition-colors cursor-pointer hover:ring-2 hover:ring-brand-300`}
                                        title={`${day} ${formatHour(hour)}: ${value} booking${value !== 1 ? 's' : ''}`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}

                {/* Legend */}
                <div className="flex items-center justify-end gap-2 mt-4">
                    <span className="text-xs text-gray-500">Less</span>
                    <div className="flex gap-0.5">
                        <div className="w-4 h-4 rounded-sm bg-gray-100"></div>
                        <div className="w-4 h-4 rounded-sm bg-brand-200"></div>
                        <div className="w-4 h-4 rounded-sm bg-brand-300"></div>
                        <div className="w-4 h-4 rounded-sm bg-brand-400"></div>
                        <div className="w-4 h-4 rounded-sm bg-brand-500"></div>
                    </div>
                    <span className="text-xs text-gray-500">More</span>
                </div>
            </div>
        </div>
    );
};

export default HeatmapChart;
