import React from "react";
import Image from "next/image";

interface ConfirmCheckButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    onClick?: () => void;
    disabled?: boolean;
}

export const ConfirmCheckButton: React.FC<ConfirmCheckButtonProps> = ({
    onClick,
    className = "",
    disabled = false,
    ...props
}) => {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={disabled ? undefined : onClick}
            className={`
                relative w-[56px] h-[56px] rounded-full shrink-0
                inline-flex items-center justify-center
                transition-all duration-150 select-none overflow-hidden
                ${disabled
                    ? "bg-[#2a2a2a] border border-[#373737] opacity-30 cursor-not-allowed shadow-none"
                    : "bg-gradient-to-b from-[#3C70F2] via-[#6792FF] to-[#1245C7] border-[1.5px] border-[#376EFB] active:scale-[0.96] cursor-pointer shadow-lg shadow-[#3C70F2]/20"
                }
                ${className}
            `}
            {...props}
        >
            <Image
                src="/icon-tick.svg"
                alt="Confirm"
                width={24}
                height={24}
                className={`shrink-0 ${disabled ? "opacity-50" : "opacity-100"}`}
            />
        </button>
    );
};