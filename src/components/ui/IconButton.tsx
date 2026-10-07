import React from "react";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: React.ReactNode;
    variant?: "primary" | "glass";
    size?: "sm" | "md" | "lg";
}

export const IconButton: React.FC<IconButtonProps> = ({
    icon,
    variant = "glass",
    size = "md",
    className = "",
    ...props
}) => {
    const sizeStyles = {
        sm: "w-8 h-8 text-xs",
        md: "w-10 h-10 text-sm",
        lg: "w-12 h-12 text-base",
    };

    const variantStyles = {
        primary: `
      bg-blue-btn text-white shadow-lg shadow-blue-600/25
      border-[1.5px] border-[#376EFB]
      hover:brightness-110
    `,
        glass: `
      bg-[#1D1D1D]/90 text-white 
      border-[0.5px] border-[#373737] 
      backdrop-blur-glass 
      hover:bg-[#252525]
    `,
    };

    return (
        <button
            className={`
        inline-flex items-center justify-center 
        rounded-full transition-transform active:scale-95 
        ${sizeStyles[size]} 
        ${variantStyles[variant]} 
        ${className}
      `}
            {...props}
        >
            {icon}
        </button>
    );
};