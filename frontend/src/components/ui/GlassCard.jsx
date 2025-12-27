import React from 'react';

const GlassCard = ({ children, className = "", hoverEffect = false }) => {
    return (
        <div
            className={`
        glass rounded-2xl p-6 relative overflow-hidden
        ${hoverEffect ? 'hover:bg-white/5 transition-colors duration-300' : ''}
        ${className}
      `}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};

export default GlassCard;
