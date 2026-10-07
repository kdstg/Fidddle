import React, { useState, useRef, useEffect } from "react";
import { FieldContextMenu } from "./FieldContextMenu";
import { SignatureIcon, Checkmark01Icon } from "hugeicons-react";

export interface FieldCoordinates {
    /** X position as a percentage of page width (0 - 100) */
    x: number;
    /** Y position as a percentage of page height (0 - 100) */
    y: number;
    /** Width as a percentage of page width (0 - 100) */
    width: number;
    /** Height as a percentage of page height (0 - 100) */
    height: number;
}

interface FieldBoundingBoxProps {
    id: string;
    coords: FieldCoordinates;
    recipientName?: string;
    recipientColor?: string; // e.g. '#F23C3C' for Red, '#3C70F2' for Blue
    isSelected?: boolean;
    isSigned?: boolean;
    signatureImage?: string; // Data URL or SVG string when signed
    onSelect?: (id: string) => void;
    onChange?: (id: string, newCoords: FieldCoordinates) => void;
    onDelete?: (id: string) => void;
    onReassign?: (id: string) => void;
}

export const FieldBoundingBox: React.FC<FieldBoundingBoxProps> = ({
    id,
    coords,
    recipientName = "Signer 1",
    recipientColor = "#F23C3C",
    isSelected = false,
    isSigned = false,
    signatureImage,
    onSelect,
    onChange,
    onDelete,
    onReassign,
}) => {
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const boxRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef<{ startX: number; startY: number; initialCoords: FieldCoordinates }>({
        startX: 0,
        startY: 0,
        initialCoords: coords,
    });

    // Keep menu closed if box becomes unselected
    useEffect(() => {
        if (!isSelected) {
            setShowContextMenu(false);
        }
    }, [isSelected]);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (e.button !== 0) return; // Only primary mouse button
        e.stopPropagation();
        onSelect?.(id);

        // Calculate menu anchor position (top-right of the bounding box)
        if (boxRef.current) {
            const rect = boxRef.current.getBoundingClientRect();
            setMenuPosition({ x: rect.width + 8, y: 0 });
        }

        setIsDragging(true);
        dragStartRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            initialCoords: { ...coords },
        };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging || !boxRef.current?.parentElement) return;

        const parentRect = boxRef.current.parentElement.getBoundingClientRect();
        const deltaXPixels = e.clientX - dragStartRef.current.startX;
        const deltaYPixels = e.clientY - dragStartRef.current.startY;

        // Convert pixel delta into relative percentage change
        const deltaXPercent = (deltaXPixels / parentRect.width) * 100;
        const deltaYPercent = (deltaYPixels / parentRect.height) * 100;

        const newX = Math.max(0, Math.min(100 - coords.width, dragStartRef.current.initialCoords.x + deltaXPercent));
        const newY = Math.max(0, Math.min(100 - coords.height, dragStartRef.current.initialCoords.y + deltaYPercent));

        onChange?.(id, {
            ...coords,
            x: Number(newX.toFixed(3)),
            y: Number(newY.toFixed(3)),
        });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (isDragging) {
            setIsDragging(false);
            (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        }
    };

    const toggleContextMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onSelect?.(id);
        if (boxRef.current) {
            const rect = boxRef.current.getBoundingClientRect();
            setMenuPosition({ x: rect.width + 8, y: 0 });
        }
        setShowContextMenu((prev) => !prev);
    };

    return (
        <div
            ref={boxRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onContextMenu={toggleContextMenu}
            style={{
                position: "absolute",
                left: `${coords.x}%`,
                top: `${coords.y}%`,
                width: `${coords.width}%`,
                height: `${coords.height}%`,
                borderColor: isSelected ? recipientColor : `${recipientColor}80`,
            }}
            className={`
        group custom-field-box select-none cursor-grab active:cursor-grabbing
        border-[1.5px] rounded-[6px]
        transition-shadow duration-150
        ${isSelected ? "bg-black/20 shadow-lg shadow-black/50 ring-1 ring-white/20" : "bg-black/10 hover:bg-black/20"}
        ${isSigned ? "border-emerald-500 bg-emerald-950/10" : ""}
      `}
        >
            {/* Recipient Badge Tag */}
            <div
                style={{ backgroundColor: recipientColor }}
                className="
          absolute -top-3 left-2
          px-1.5 py-0.2
          rounded-[3px]
          text-[10px] font-sans font-semibold text-white tracking-wider uppercase
          shadow-sm
          pointer-events-none
          flex items-center gap-1
        "
            >
                <span>{recipientName}</span>
            </div>

            {/* Field Content Inner View */}
            <div className="w-full h-full flex items-center justify-center p-2">
                {isSigned && signatureImage ? (
                    <img
                        src={signatureImage}
                        alt="Signature"
                        className="max-w-full max-h-full object-contain filter invert drop-shadow-md"
                    />
                ) : isSigned ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 font-sans text-xs font-medium">
                        <Checkmark01Icon size={14} />
                        <span>Signed</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 text-white/50 group-hover:text-white/80 transition-colors">
                        <SignatureIcon size={16} style={{ color: recipientColor }} />
                        <span className="text-xs font-sans font-medium tracking-tight">
                            Sign Here
                        </span>
                    </div>
                )}
            </div>

            {/* Anchor for Context Menu */}
            {isSelected && (
                <FieldContextMenu
                    isOpen={showContextMenu}
                    position={menuPosition}
                    onResize={() => {
                        // Trigger manual resize handle state or modal
                        setShowContextMenu(false);
                    }}
                    onReassign={() => {
                        onReassign?.(id);
                        setShowContextMenu(false);
                    }}
                    onDelete={() => {
                        onDelete?.(id);
                        setShowContextMenu(false);
                    }}
                />
            )}
        </div>
    );
};