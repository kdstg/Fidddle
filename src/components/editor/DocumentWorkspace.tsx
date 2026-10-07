import React, { useState } from "react";
import Image from "next/image";
import { IconButton } from "@/components/ui/IconButton";
import { ConfirmCheckButton } from "@/components/ui/ConfirmCheckButton";
import { PageThumbnailSidebar } from "./PageThumbnailSidebar";
import { Notification01Icon } from "hugeicons-react";

interface Collaborator {
    id: string;
    name: string;
    avatarUrl?: string;
}

interface DocumentWorkspaceProps {
    documentName?: string;
    collaborators?: Collaborator[];
    onAddSignatureBlock?: () => void;
    onConfirm?: () => void;
    onImportUrl?: () => void;
    onFileSelect?: () => void;
}

export const DocumentWorkspace: React.FC<DocumentWorkspaceProps> = ({
    documentName = "Contract-Agreement-2026.pdf",
    collaborators = [],
    onAddSignatureBlock,
    onConfirm,
    onImportUrl,
    onFileSelect,
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [placedBlocksCount, setPlacedBlocksCount] = useState(0);

    const handleAddBlock = () => {
        setPlacedBlocksCount((prev) => prev + 1);
        if (onAddSignatureBlock) onAddSignatureBlock();
    };

    return (
        <div className="relative w-screen h-screen bg-[#202020] overflow-hidden flex flex-col justify-between p-6 sm:p-8 select-none">
            {/* Outer Viewport Header (Persistent Top Navigation) */}
            <header className="w-full flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                    <IconButton
                        size="lg"
                        variant="glass"
                        icon={
                            <Image
                                src="/icon-gdrive.svg"
                                alt="Google Drive"
                                width={28}
                                height={28}
                            />
                        }
                        onClick={onFileSelect}
                    />
                    <IconButton
                        size="lg"
                        variant="glass"
                        icon={
                            <Image
                                src="/icon-dropbox.svg"
                                alt="Dropbox"
                                width={28}
                                height={28}
                            />
                        }
                        onClick={onFileSelect}
                    />
                    <IconButton
                        size="lg"
                        variant="glass"
                        icon={
                            <Image
                                src="/icon-link.svg"
                                alt="Import Link"
                                width={28}
                                height={28}
                            />
                        }
                        onClick={onImportUrl || onFileSelect}
                    />
                </div>

                <IconButton
                    size="lg"
                    variant="solid"
                    icon={<Notification01Icon size={28} className="text-white" />}
                />
            </header>

            {/* Center 1214.4px x 703px Main Workspace Card */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1214.4px] h-[703px] bg-[#202020] border border-[#373737] rounded-[24px] flex overflow-hidden shadow-2xl z-20">
                {/* Left Page Sidebar (242.4px) */}
                <PageThumbnailSidebar
                    currentPage={currentPage}
                    onSelectPage={setCurrentPage}
                />

                {/* Right Main PDF Canvas Workspace */}
                <div className="flex-1 h-full flex flex-col justify-between px-[40px] py-6 relative">
                    {/* Top Header Bar inside Card */}
                    <header className="w-full flex items-center justify-between z-10 gap-4">
                        {/* Document Title with Truncation */}
                        <h1
                            className="font-sans font-normal text-[20px] text-white tracking-tight max-w-[550px] truncate"
                            title={documentName}
                        >
                            {documentName}
                        </h1>

                        <div className="flex items-center gap-4 shrink-0">
                            {/* Dynamic Collaborators (Only rendered if present) */}
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

                            {/* Share Button (Solid Surface 56px x 56px) */}
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

                    {/* Seamless PDF Canvas Area (No inner gray box) */}
                    <main className="relative flex-1 my-2 flex items-center justify-center">
                        {/* PDF page canvas renders directly here */}
                        <p className="font-sans text-sm text-white/20 select-none pointer-events-none">
                            PDF Page View Area
                        </p>
                    </main>

                    {/* Bottom Floating Action Toolbar */}
                    <div className="w-full bg-[#202020] border border-[#373737] rounded-full px-4 py-2 flex items-center justify-between z-10 shadow-lg">
                        {/* Left Controls: Block count + 24px gap + Arrows */}
                        <div className="flex items-center gap-[24px]">
                            <span className="font-sans font-normal text-[20px] text-white whitespace-nowrap">
                                {placedBlocksCount} block{placedBlocksCount === 1 ? "" : "s"} added
                            </span>

                            <div className="flex items-center gap-[16px]">
                                <IconButton
                                    size="lg"
                                    variant="glass"
                                    icon={
                                        <Image
                                            src="/icon-arrow-left.svg"
                                            alt="Previous"
                                            width={24}
                                            height={24}
                                        />
                                    }
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                />
                                <IconButton
                                    size="lg"
                                    variant="glass"
                                    icon={
                                        <Image
                                            src="/icon-arrow-right.svg"
                                            alt="Next"
                                            width={24}
                                            height={24}
                                        />
                                    }
                                    onClick={() => setCurrentPage((p) => p + 1)}
                                />
                            </div>
                        </div>

                        {/* Right Controls: Signature CTA + 16px gap + Blue Check */}
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