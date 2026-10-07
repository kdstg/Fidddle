import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: "primary" | "glass" | "danger-text" | "cancel";
    size?: "sm" | "md" | "lg";
    icon?: React.ReactNode;
    shortcut?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ children, variant = "glass", size = "md", icon, shortcut, className = "", ...props }, ref) => {
        const baseStyles =
            "inline-flex items-center justify-center font-sans font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none rounded-full";

        const sizeStyles = {
            sm: "px-3 py-1.5 text-xs gap-1.5",
            md: "px-5 py-2.5 text-sm gap-2",
            lg: "px-7 py-3.5 text-base gap-2.5",
        };

        const variantStyles = {
            primary: `
        bg-blue-btn text-white shadow-lg shadow-blue-600/25
        relative
        before:absolute before:inset-0 before:rounded-full before:p-[1.5px] 
        before:bg-blue-btn-stroke before:-z-10
        hover:brightness-110
      `,
            glass: `
        bg-[#1D1D1D]/90 text-white 
        border-[0.5px] border-[#373737] 
        backdrop-blur-glass 
        hover:bg-[#252525]
      `,
            "danger-text": `
        bg-transparent text-[#F23C3C] 
        hover:bg-[#F23C3C]/10
      `,
            cancel: `
        bg-[#1D1D1D]/90 text-[#F23C3C] 
        border-[0.5px] border-[#373737] 
        backdrop-blur-glass 
        hover:bg-[#252525]
      `,
        };

        return (
            <button
                ref={ref}
                className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
                {...props}
            >
                {icon && <span className="shrink-0">{icon}</span>}
                <span>{children}</span>
                {shortcut && (
                    <span className="ml-1 text-[11px] text-white/50 font-sans tracking-normal">
                        {shortcut}
                    </span>
                )}
            </button>
        );
    }
);

Button.displayName = "Button";