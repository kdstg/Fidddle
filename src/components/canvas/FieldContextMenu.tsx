import React from "react";
import { GlassContainer } from "@/components/ui/GlassContainer";
import { ShortcutBadge } from "@/components/ui/ShortcutBadge";

// Example imports using hugeicons-react package syntax
// If your hugeicons package setup uses a different export name, adjust icon imports accordingly.
import {
    Crop01Icon,
    UserChange01Icon,
    Delete02Icon,
} from "hugeicons-react";

interface FieldContextMenuProps {
    isOpen: boolean;
    /** Normalized or pixel coordinates for absolute positioning adjacent to bounding box */
    position?: { x: number; y: number };
    onResize?: () => void;
    onReassign?: () => void;
    onDelete?: () => void;
    className?: string;
}

export const FieldContextMenu: React.FC<FieldContextMenuProps> = ({
    isOpen,
    position,
    onResize,
    onReassign,
    onDelete,
    className = "",
}) => {
    if (!isOpen) return null;

    return (
        <div
            style={
                position
                    ? {
                        position: "absolute",
                        left: `${position.x}px`,
                        top: `${position.y}px`,
                    }
                    : undefined
            }
            className={`z-50 select-none animate-in fade-in-0 zoom-in-95 duration-100 ${className}`}
        >
            <GlassContainer
                variant="popover"
                className="w-[180px] p-1.5 flex flex-col gap-0.5 shadow-2xl"
            >
                {/* Resize Option */}
                <button
                    onClick={onResize}
                    className="
            w-full flex items-center justify-between
            px-2.5 py-1.5 rounded-[10px]
            text-xs font-sans font-medium text-white/90
            hover:bg-white/10 active:bg-white/15
            transition-colors duration-150
            group
          "
                >
                    <div className="flex items-center gap-2">
                        <Crop01Icon
                            size={15}
                            className="text-white/70 group-hover:text-white transition-colors"
                        />
                        <span>Resize</span>
                    </div>
                    <ShortcutBadge label="⌘ R" />
                </button>

                {/* Reassign Option */}
                <button
                    onClick={onReassign}
                    className="
            w-full flex items-center justify-between
            px-2.5 py-1.5 rounded-[10px]
            text-xs font-sans font-medium text-white/90
            hover:bg-white/10 active:bg-white/15
            transition-colors duration-150
            group
          "
                >
                    <div className="flex items-center gap-2">
                        <UserChange01Icon
                            size={15}
                            className="text-white/70 group-hover:text-white transition-colors"
                        />
                        <span>Reassign</span>
                    </div>
                    <ShortcutBadge label="⌘ /" />
                </button>

                {/* Subtle Horizontal Divider */}
                <div className="h-[0.5px] bg-[#373737] my-1 mx-1" />

                {/* Delete Option (Danger Accent) */}
                <button
                    onClick={onDelete}
                    className="
            w-full flex items-center justify-between
            px-2.5 py-1.5 rounded-[10px]
            text-xs font-sans font-medium text-[#F23C3C]
            hover:bg-[#F23C3C]/10 active:bg-[#F23C3C]/20
            transition-colors duration-150
            group
          "
                >
                    <div className="flex items-center gap-2">
                        <Delete02Icon
                            size={15}
                            className="text-[#F23C3C] group-hover:scale-105 transition-transform"
                        />
                        <span>Delete</span>
                    </div>
                    <ShortcutBadge
                        label="⌘ ⌫"
                        className="border-[#F23C3C]/30 text-[#F23C3C]/80 bg-[#F23C3C]/10"
                    />
                </button>
            </GlassContainer>
        </div>
    );
};