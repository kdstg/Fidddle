import React from "react";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: React.ReactNode;
    size?: "md" | "lg";
    variant?: "glass" | "solid";
}

export const IconButton: React.FC<IconButtonProps> = ({
    icon,
    size = "lg",
    variant = "glass",
    className = "",
    ...props
}) => {
    const sizeClasses =
        size === "lg"
            ? "w-[56px] h-[56px] [&_svg]:w-[28px] [&_svg]:h-[28px] [&_img]:w-[28px] [&_img]:h-[28px]"
            : "w-[40px] h-[40px] [&_svg]:w-[20px] [&_svg]:h-[20px] [&_img]:w-[20px] [&_img]:h-[20px]";

    const variantClasses =
        variant === "glass"
            ? "glass-button"
            : "bg-[#1D1D1D] border-[0.5px] border-[#373737] hover:bg-[#252525]";

    return (
        <button
            type="button"
            className={`
        ${sizeClasses}
        ${variantClasses}
        shrink-0 rounded-full
        inline-flex items-center justify-center
        transition-all duration-150 active:scale-[0.96]
        cursor-pointer select-none
        ${className}
      `}
            {...props}
        >
            {icon}
        </button>
    );
};