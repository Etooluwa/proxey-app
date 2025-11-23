import React from 'react';

const Button = ({
    children,
    onClick,
    loading = false,
    disabled = false,
    className = '',
    type = 'button',
    variant = 'primary'
}) => {
    const baseStyles = "px-6 py-3 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-brand-500 text-white hover:bg-brand-600 shadow-lg shadow-brand-200",
        secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
        outline: "border-2 border-brand-500 text-brand-600 hover:bg-brand-50"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseStyles} ${variants[variant]} ${className}`}
        >
            {loading ? (
                <>
                    <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading...</span>
                </>
            ) : children}
        </button>
    );
};

export default Button;
