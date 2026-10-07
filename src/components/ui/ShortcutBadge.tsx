import React from "react";

interface ShortcutBadgeProps {
    label: string;
    className?: string;
}

export const ShortcutBadge: React.FC<ShortcutBadgeProps> = ({ label, className = "" }) => {
    return (
        <span
            className={`
        inline-flex items-center justify-center
        px-1.5 py-0.5
        text-[11px] font-sans font-medium tracking-tight
        text-white/60 bg-white/10
        border-[0.5px] border-[#373737]
        rounded-[4px]
        select-none
        ${className}
      `}
        >
            {label}
        </span>
    );
};