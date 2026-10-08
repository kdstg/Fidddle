import React, { useState } from "react";
import Image from "next/image";
import { IconButton } from "@/components/ui/IconButton";
import { ConfirmCheckButton } from "@/components/ui/ConfirmCheckButton";
import { PageThumbnailSidebar } from "./PageThumbnailSidebar";

interface Collaborator {
    id: string;
    name: string;
    avatarUrl?: string;
}

interface SenderWorkspaceProps {
    documentName?: string;
    collaborators?: Collaborator[];
    onAddSignatureBlock?: () => void;
    onConfirm?: () => void;
    onClose?: () => void;
}

export const SenderWorkspace: React.FC<SenderWorkspaceProps> = ({
    documentName = "Contract-Agreement-2026.pdf",
    collaborators = [],
    onAddSignatureBlock,
    onConfirm,
    onClose,
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [placedBlocksCount, setPlacedBlocksCount] = useState(0);
    const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(null);

    const handleAddBlock = () => {
        setPlacedBlocksCount((prev) => {
            const newCount = prev + 1;
            setActiveBlockIndex(newCount);
            return newCount;
        });
        if (onAddSignatureBlock) onAddSignatureBlock();
    };

    const handlePrevBlock = () => {
        if (placedBlocksCount === 0) return;
        setActiveBlockIndex((prev) => (prev === null || prev <= 1 ? placedBlocksCount : prev - 1));
    };

    const handleNextBlock = () => {
        if (placedBlocksCount === 0) return;
        setActiveBlockIndex((prev) => (prev === null || prev >= placedBlocksCount ? 1 : prev + 1));
    };

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
                <PageThumbnailSidebar
                    currentPage={currentPage}
                    onSelectPage={setCurrentPage}
                />

                <div className="flex-1 h-full flex flex-col justify-between px-[40px] py-6 relative">
                    {/* Header Bar */}
                    <header className="w-full flex items-center justify-between z-10 gap-4">
                        <h1
                            className="font-sans font-normal text-[20px] text-white tracking-tight max-w-[550px] truncate"
                            title={documentName}
                        >
                            {documentName}
                        </h1>

                        <div className="flex items-center gap-4 shrink-0">
                            {collaborators.length > 0 && (
                                <div className="flex items-center -space-x-2">
                                    {collaborators.slice(0, 3).map((collab) => (
                                        <div
                                            key={collab.id}
                                            className="w-[40px] h-[40px] rounded-full border-2 border-[#202020] bg-blue-600 overflow-hidden flex items-center justify-center font-sans text-xs text-white"
                                        >
                                            {collab.name.charAt(0)}
                                        </div>
                                    ))}
                                    {collaborators.length > 3 && (
                                        <span className="pl-3 font-sans font-normal text-[20px] text-white/80">
                                            +{collaborators.length - 3}
                                        </span>
                                    )}
                                </div>
                            )}

                            <IconButton
                                size="lg"
                                variant="solid"
                                icon={
                                    <Image
                                        src="/icon-share.svg"
                                        alt="Share"
                                        width={24}
                                        height={24}
                                    />
                                }
                            />
                        </div>
                    </header>

                    {/* PDF Viewport */}
                    <main className="relative flex-1 my-2 flex items-center justify-center">
                        <p className="font-sans text-sm text-white/20 select-none pointer-events-none">
                            {placedBlocksCount > 0
                                ? `Focused Block: ${activeBlockIndex} / ${placedBlocksCount}`
                                : "PDF Page View Area"}
                        </p>
                    </main>

                    {/* Bottom Toolbar */}
                    <div className="w-full bg-[#202020] border border-[#373737] rounded-full px-4 py-2 flex items-center justify-between z-10 shadow-lg">
                        <div className="flex items-center gap-[24px]">
                            <span className="font-sans font-normal text-[20px] text-white whitespace-nowrap">
                                {placedBlocksCount} block{placedBlocksCount === 1 ? "" : "s"} added
                            </span>

                            <div className="flex items-center gap-[16px]">
                                <IconButton
                                    size="lg"
                                    variant="glass"
                                    disabled={placedBlocksCount === 0}
                                    icon={
                                        <Image
                                            src="/icon-arrow-left.svg"
                                            alt="Previous Block"
                                            width={24}
                                            height={24}
                                            className={placedBlocksCount === 0 ? "opacity-30" : "opacity-100"}
                                        />
                                    }
                                    onClick={handlePrevBlock}
                                />
                                <IconButton
                                    size="lg"
                                    variant="glass"
                                    disabled={placedBlocksCount === 0}
                                    icon={
                                        <Image
                                            src="/icon-arrow-right.svg"
                                            alt="Next Block"
                                            width={24}
                                            height={24}
                                            className={placedBlocksCount === 0 ? "opacity-30" : "opacity-100"}
                                        />
                                    }
                                    onClick={handleNextBlock}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-[16px]">
                            <button
                                onClick={handleAddBlock}
                                className="
                  glass-button
                  w-[259px] h-[56px] px-4 py-2
                  inline-flex items-center justify-center gap-3
                  rounded-full text-white
                  font-sans font-medium text-[20px] tracking-tight
                  active:scale-[0.98] cursor-pointer
                "
                            >
                                <Image
                                    src="/icon-sig-scrib.svg"
                                    alt=""
                                    width={24}
                                    height={24}
                                />
                                <span>Add Signature Block</span>
                            </button>

                            <ConfirmCheckButton onClick={onConfirm} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};