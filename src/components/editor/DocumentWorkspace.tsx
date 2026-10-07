import React, { useState } from "react";
import Image from "next/image";
import { IconButton } from "@/components/ui/IconButton";
import { ConfirmCheckButton } from "@/components/ui/ConfirmCheckButton";
import { PageThumbnailSidebar } from "./PageThumbnailSidebar";

interface DocumentWorkspaceProps {
    documentName?: string;
    onAddSignatureBlock?: () => void;
    onConfirm?: () => void;
}

export const DocumentWorkspace: React.FC<DocumentWorkspaceProps> = ({
    documentName = "Contract-Agreement-2026.pdf",
    onAddSignatureBlock,
    onConfirm,
}) => {
    const [currentPage, setCurrentPage] = useState(1);

    return (
        <div className="w-screen h-screen bg-[#202020] flex items-center justify-center p-4 overflow-hidden select-none">
            {/* Main Container Card: 1214.4px x 703px */}
            <div className="w-[1214.4px] h-[703px] bg-[#202020] border border-[#373737] rounded-[24px] flex overflow-hidden shadow-2xl relative">
                {/* Left Page Sidebar */}
                <PageThumbnailSidebar
                    currentPage={currentPage}
                    onSelectPage={setCurrentPage}
                />

                {/* Right Main PDF Canvas Workspace */}
                <div className="flex-1 h-full flex flex-col justify-between px-[40px] py-6 relative">
                    {/* Top Header Navigation */}
                    <header className="w-full flex items-center justify-between z-10">
                        <h1 className="font-sans font-normal text-[20px] text-white tracking-tight">
                            {documentName}
                        </h1>

                        <div className="flex items-center gap-4">
                            {/* Collaborator Avatars */}
                            <div className="flex items-center -space-x-2">
                                <div className="w-[40px] h-[40px] rounded-full border-2 border-[#202020] bg-purple-500 overflow-hidden flex items-center justify-center font-sans font-normal text-[14px] text-white">
                                    A
                                </div>
                                <div className="w-[40px] h-[40px] rounded-full border-2 border-[#202020] bg-blue-500 overflow-hidden flex items-center justify-center font-sans font-normal text-[14px] text-white">
                                    B
                                </div>
                                <div className="w-[40px] h-[40px] rounded-full border-2 border-[#202020] bg-amber-500 overflow-hidden flex items-center justify-center font-sans font-normal text-[14px] text-white">
                                    C
                                </div>
                                <span className="pl-3 font-sans font-normal text-[20px] text-white/80">
                                    +3
                                </span>
                            </div>

                            {/* Share Button (Solid Surface, 56px x 56px, 24px icon) */}
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

                    {/* Main Document Render Area (PDF Viewport) */}
                    <main className="flex-1 my-4 bg-white/5 rounded-[12px] border border-white/5 flex items-center justify-center text-white/20">
                        {/* PDF Canvas renders here */}
                        <p className="font-sans text-sm">PDF Page View Area</p>
                    </main>

                    {/* Bottom Floating Action Toolbar */}
                    <div className="w-full bg-[#202020] border border-[#373737] rounded-full px-4 py-2 flex items-center justify-between z-10">
                        {/* Left Controls: Text + 24px gap + Arrows (16px gap) */}
                        <div className="flex items-center gap-[24px]">
                            <span className="font-sans font-normal text-[20px] text-white whitespace-nowrap">
                                4 blocks added
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

                        {/* Right Controls: Add Signature CTA + 16px gap + Blue Check */}
                        <div className="flex items-center gap-[16px]">
                            {/* Add Signature Block CTA: 259px x 56px */}
                            <button
                                onClick={onAddSignatureBlock}
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

                            {/* Blue Primary Confirm Checkmark */}
                            <ConfirmCheckButton onClick={onConfirm} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};