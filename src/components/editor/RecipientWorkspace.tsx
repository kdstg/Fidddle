import React, { useState, useEffect } from "react";
import Image from "next/image";
import { IconButton } from "@/components/ui/IconButton";
import { ConfirmCheckButton } from "@/components/ui/ConfirmCheckButton";
import { PageThumbnailSidebar } from "./PageThumbnailSidebar";

export interface SignatureField {
    id: string;
    page: number;
    x: number;
    y: number;
    label?: string;
    isSigned: boolean;
    value?: string;
}

interface RecipientWorkspaceProps {
    documentName?: string;
    senderName?: string;
    senderCompany?: string;
    fields?: SignatureField[];
    onSignField?: (fieldId: string) => void;
    onConfirm?: () => void;
    onClose?: () => void;
}

export const RecipientWorkspace: React.FC<RecipientWorkspaceProps> = ({
    documentName = "Contract-Agreement-2026.pdf",
    senderName = "Alex Rivera",
    senderCompany = "Acme Corp",
    fields: initialFields = [],
    onSignField,
    onConfirm,
    onClose,
}) => {
    const [fields, setFields] = useState<SignatureField[]>(initialFields);
    const [currentPage, setCurrentPage] = useState(1);
    const [zoomLevel, setZoomLevel] = useState(100);

    /* Signing State */
    const [isSigning, setIsSigning] = useState(false);
    const [activeFieldIndex, setActiveFieldIndex] = useState(0);

    /* Derived Counts from Dynamic Data */
    const totalFieldsCount = fields.length;
    const completedFieldsCount = fields.filter((f) => f.isSigned).length;
    const activeField = fields[activeFieldIndex];

    /* Keep canvas page in sync with the active target signature block */
    useEffect(() => {
        if (isSigning && activeField) {
            setCurrentPage(activeField.page);
        }
    }, [activeFieldIndex, isSigning, activeField]);

    /* Zoom Handlers */
    const handleZoomOut = () => setZoomLevel((prev) => Math.max(50, prev - 10));
    const handleZoomIn = () => setZoomLevel((prev) => Math.min(200, prev + 10));

    /* Signing Flow Actions */
    const handleStartSigning = () => {
        if (totalFieldsCount === 0) return;
        setIsSigning(true);
        // Focus first unsigned field, or default to 0
        const firstUnsignedIndex = fields.findIndex((f) => !f.isSigned);
        setActiveFieldIndex(firstUnsignedIndex !== -1 ? firstUnsignedIndex : 0);
    };

    const handlePrevField = () => {
        if (totalFieldsCount === 0) return;
        setActiveFieldIndex((prev) => (prev <= 0 ? totalFieldsCount - 1 : prev - 1));
    };

    const handleNextField = () => {
        if (totalFieldsCount === 0) return;
        setActiveFieldIndex((prev) => (prev >= totalFieldsCount - 1 ? 0 : prev + 1));
    };

    const handleSignActiveField = () => {
        if (!activeField) return;

        // Toggle/Set active field as signed
        setFields((prev) =>
            prev.map((field) =>
                field.id === activeField.id ? { ...field, isSigned: true } : field
            )
        );

        if (onSignField) onSignField(activeField.id);

        // Auto-advance to next unsigned field if available
        const nextUnsigned = fields.findIndex(
            (f, idx) => idx > activeFieldIndex && !f.isSigned
        );
        if (nextUnsigned !== -1) {
            setActiveFieldIndex(nextUnsigned);
        }
    };

    /* Backdrop Outside Click */
    const handleBackdropPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && onClose) {
            e.stopPropagation();
            e.preventDefault();
            onClose();
        }
    };

    return (
        <div
            onPointerDown={handleBackdropPointerDown}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-6 sm:p-8 select-none cursor-pointer"
        >
            <div
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="relative w-[1214.4px] h-[703px] bg-[#202020] border border-[#373737] rounded-[24px] flex overflow-hidden shadow-2xl cursor-default"
            >
                {/* Left Thumbnail Sidebar */}
                <PageThumbnailSidebar
                    currentPage={currentPage}
                    onSelectPage={setCurrentPage}
                />

                {/* Right Main Content Area */}
                <div className="flex-1 h-full flex flex-col justify-between px-[40px] py-6 relative">
                    {/* Header */}
                    <header className="w-full grid grid-cols-[auto_1fr_auto] items-center gap-4 z-10">
                        {/* Left: Zoom Controls */}
                        <div className="flex items-center gap-3 shrink-0">
                            <IconButton
                                size="lg"
                                variant="solid"
                                onClick={handleZoomOut}
                                icon={
                                    <Image
                                        src="/icon-minus.svg"
                                        alt="Zoom Out"
                                        width={24}
                                        height={24}
                                    />
                                }
                            />
                            <span className="font-sans font-normal text-[20px] text-white min-w-[55px] text-center">
                                {zoomLevel}%
                            </span>
                            <IconButton
                                size="lg"
                                variant="solid"
                                onClick={handleZoomIn}
                                icon={
                                    <Image
                                        src="/icon-plus.svg"
                                        alt="Zoom In"
                                        width={24}
                                        height={24}
                                    />
                                }
                            />
                        </div>

                        {/* Center: Doc Title & Sender */}
                        <div className="flex flex-col items-center justify-center text-center px-4 overflow-hidden">
                            <h1
                                className="font-sans font-normal text-[20px] text-white tracking-tight max-w-[480px] truncate"
                                title={documentName}
                            >
                                {documentName}
                            </h1>
                            <p className="font-sans font-light text-[16px] text-[#A1A1A0] truncate">
                                Sent by {senderName} • {senderCompany}
                            </p>
                        </div>

                        <div className="w-[140px] shrink-0" />
                    </header>

                    {/* Canvas Viewport */}
                    <main className="relative flex-1 my-2 flex items-center justify-center overflow-hidden">
                        <div
                            className="transition-transform duration-200 ease-out"
                            style={{ transform: `scale(${zoomLevel / 100})` }}
                        >
                            <p className="font-sans text-sm text-white/20 select-none pointer-events-none">
                                {isSigning && activeField
                                    ? `Targeting Field ${activeFieldIndex + 1} of ${totalFieldsCount} on Page ${activeField.page}`
                                    : totalFieldsCount > 0
                                        ? `${totalFieldsCount} signature field(s) detected`
                                        : "No signature fields placed"}
                            </p>
                        </div>
                    </main>

                    {/* Bottom Toolbar States */}
                    {!isSigning ? (
                        /* STATE A: Review Mode */
                        <div className="w-full flex items-center justify-end gap-[16px] z-10">
                            <button
                                onClick={onClose}
                                className="w-[99px] h-[56px] px-4 py-2 bg-[#1D1D1D] border-[0.5px] border-[#373737] rounded-full text-[#F23C3C] font-sans font-medium text-[20px] tracking-tight hover:bg-[#252525] active:scale-[0.98] transition-all duration-150 cursor-pointer inline-flex items-center justify-center"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleStartSigning}
                                disabled={totalFieldsCount === 0}
                                className="w-[190px] h-[56px] px-4 py-2 bg-[#1D1D1D] border-[0.5px] border-[#373737] rounded-full text-white font-sans font-medium text-[20px] tracking-tight hover:bg-[#252525] active:scale-[0.98] transition-all duration-150 cursor-pointer inline-flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Image
                                    src="/icon-sig-scrib.svg"
                                    alt=""
                                    width={24}
                                    height={24}
                                />
                                <span>Start Signing</span>
                            </button>
                        </div>
                    ) : (
                        /* STATE B: Active Signing Mode (Driven by Real Fields) */
                        <div className="w-full flex items-center justify-between z-10">
                            <div className="flex items-center gap-[24px]">
                                <span className="font-sans font-normal text-[20px] text-white whitespace-nowrap">
                                    {completedFieldsCount} of {totalFieldsCount} completed
                                </span>

                                <div className="flex items-center gap-[16px]">
                                    <IconButton
                                        size="lg"
                                        variant="solid"
                                        disabled={totalFieldsCount <= 1}
                                        icon={
                                            <Image
                                                src="/icon-arrow-left.svg"
                                                alt="Previous Field"
                                                width={24}
                                                height={24}
                                            />
                                        }
                                        onClick={handlePrevField}
                                    />
                                    <IconButton
                                        size="lg"
                                        variant="solid"
                                        disabled={totalFieldsCount <= 1}
                                        icon={
                                            <Image
                                                src="/icon-arrow-right.svg"
                                                alt="Next Field"
                                                width={24}
                                                height={24}
                                            />
                                        }
                                        onClick={handleNextField}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-[16px]">
                                <button
                                    onClick={handleSignActiveField}
                                    className="px-6 h-[56px] py-2 bg-[#1D1D1D] border-[0.5px] border-[#373737] rounded-full text-white font-sans font-medium text-[20px] tracking-tight hover:bg-[#252525] active:scale-[0.98] transition-all duration-150 cursor-pointer inline-flex items-center justify-center gap-3"
                                >
                                    <Image
                                        src="/icon-sig-scrib.svg"
                                        alt=""
                                        width={24}
                                        height={24}
                                    />
                                    <span>
                                        {activeField?.isSigned ? "Re-sign" : "Sign"}
                                    </span>
                                </button>

                                <ConfirmCheckButton onClick={onConfirm} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};