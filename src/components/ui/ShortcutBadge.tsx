import React from "react";

interface ShortcutBadgeProps {
    label: string;
    className?: string;
}

export const ShortcutBadge: React.FC<ShortcutBadgeProps> = ({ label, className = "" }) => {
    const isCmd = label.includes("⌘");
    const cleanLabel = label.replace("⌘", "").trim();

    return (
        <span
            className={`
        inline-flex items-center justify-center gap-1
        px-2 py-0.5
        text-xs font-sans font-medium tracking-tight
        rounded-[6px] border border-[#121212]/20 bg-[#121212]/10 text-[#121212]/80
        select-none
        ${className}
      `}
        >
            {isCmd && (
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0"
                >
                    <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
                </svg>
            )}
            <span>{cleanLabel}</span>
        </span>
    );
};