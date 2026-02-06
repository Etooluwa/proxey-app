import React from 'react';

const periods = [
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'quarter', label: 'Quarter' },
    { id: 'year', label: 'Year' },
];

export const PeriodSelector = ({ value, onChange }) => {
    return (
        <div className="flex gap-2">
            {periods.map((period) => (
                <button
                    key={period.id}
                    onClick={() => onChange(period.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        value === period.id
                            ? 'bg-brand-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    {period.label}
                </button>
            ))}
        </div>
    );
};

export default PeriodSelector;
