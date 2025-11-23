import React from 'react';

const StepIndicator = ({ currentStep, totalSteps }) => {
    return (
        <div className="flex items-center justify-center gap-2 mb-8">
            {[...Array(totalSteps)].map((_, index) => {
                const step = index + 1;
                const isActive = step === currentStep;
                const isCompleted = step < currentStep;

                return (
                    <div key={step} className="flex items-center">
                        <div
                            className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-300
                ${isActive ? 'bg-brand-500 text-white shadow-lg shadow-brand-200' :
                                    isCompleted ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}
              `}
                        >
                            {isCompleted ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : step}
                        </div>
                        {step < totalSteps && (
                            <div className={`w-8 h-1 mx-2 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-gray-100'}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default StepIndicator;
