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
                transition-all duration-150 
                ${disabled ? "opacity-30 cursor-not-allowed shadow-none" : "active:scale-[0.96] cursor-pointer shadow-lg shadow-[#3C70F2]/20"}
                ${className}
            `}
            style={{
                background: disabled
                    ? "#2a2a2a"
                    : "linear-gradient(180deg, #3C70F2 0%, #6792FF 50%, #1245C7 100%)",
                border: "1.5px solid transparent",
                backgroundImage: disabled
                    ? "none"
                    : "linear-gradient(180deg, #3C70F2 0%, #6792FF 50%, #1245C7 100%), linear-gradient(180deg, #376EFB 0%, #1853EC 100%)",
                backgroundOrigin: "border-box",
                backgroundClip: "padding-box, border-box",
            }}
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