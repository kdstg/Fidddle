import React from "react";

interface GlassContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    variant?: "modal" | "floating" | "popover";
    className?: string;
}

export const GlassContainer: React.FC<GlassContainerProps> = ({
    children,
    variant = "floating",
    className = "",
    ...props
}) => {
    const radiusStyles = {
        modal: "rounded-[24px]",
        floating: "rounded-full",
        popover: "rounded-[16px]",
    };

    return (
        <div
            className={`
        bg-[#1D1D1D]/90 
        backdrop-blur-glass 
        border-[0.5px] border-[#373737] 
        shadow-2xl shadow-black/40
        ${radiusStyles[variant]}
        ${className}
      `}
            {...props}
        >
            {children}
        </div>
    );
};