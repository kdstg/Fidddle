"use client";

import React, { useState } from "react";
import Image from "next/image";
import { DocumentLog, DocumentStatus } from "@/types/document";

interface DocumentDetailModalProps {
    isOpen: boolean;
    doc: DocumentLog | null;
    onClose: () => void;
    onRevoke: (docId: string) => void;
    onPreview: (doc: DocumentLog) => void;
    onDownload: (doc: DocumentLog) => void;
}

const statusBadgeStyles: Record<DocumentStatus, { label: string; bg: string; text: string }> = {
    draft: { label: "Draft", bg: "bg-neutral-800", text: "text-neutral-400" },
    pending: { label: "Pending", bg: "bg-[#3D2200]", text: "text-[#FF9F0A]" },
    signed: { label: "Signed", bg: "bg-[#0E3A1A]", text: "text-[#30D158]" },
    revoked: { label: "Revoked", bg: "bg-[#3B0E0E]", text: "text-[#FF453A]" },
};

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
    isOpen,
    doc,
    onClose,
    onRevoke,
    onPreview,
    onDownload,
}) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen || !doc) return null;

    const badge = statusBadgeStyles[doc.status] || statusBadgeStyles.draft;

    // Ensure clean absolute link without duplication
    const cleanUrl = doc.signingUrl.startsWith("http")
        ? doc.signingUrl
        : `${window.location.origin}${doc.signingUrl.startsWith("/") ? "" : "/"}${doc.signingUrl}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(cleanUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        } catch (err) {
            console.error("Failed to copy", err);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 select-none">
            {/* Top Close Button outside modal */}
            <button
                onClick={onClose}
                className="absolute top-8 left-8 bg-[#FF3B30] text-white px-5 py-2 rounded-full font-medium text-sm flex items-center gap-1.5 cursor-pointer hover:bg-[#E03126] transition-all shadow-lg"
            >
                <Image src="/icon-close.svg" alt="Close" width={16} height={16} />
                <span>Close</span>
            </button>

            {/* Modal Card adhering to exact dimensions & borders */}
            <div className="bg-[#1d1d1d] border-[0.5px] border-[#373737] rounded-[28px] w-[1194px] h-[322px] px-[36px] py-[40px] shadow-2xl flex flex-col justify-between relative">
                {/* Header Row */}
                <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-3">
                            <h2 className="font-sans text-[18px] font-medium text-white tracking-tight">
                                {doc.title}
                            </h2>
                            <span
                                className={`px-3 py-1 rounded-full text-[13px] font-medium ${badge.bg} ${badge.text}`}
                            >
                                {badge.label}
                            </span>
                        </div>
                        <span className="text-[#8E8E93] text-sm font-sans">
                            {doc.createdAt}
                        </span>
                    </div>

                    {/* Preview Button with precise specs */}
                    <button
                        onClick={() => onPreview(doc)}
                        style={{ padding: "8px 16px" }}
                        className="bg-[#121212] hover:bg-[#1c1c1c] text-white rounded-full text-[16px] font-light flex items-center gap-2 transition-all cursor-pointer border-[0.5px] border-[#373737]"
                    >
                        <Image src="/icon-preview.svg" alt="Preview" width={16} height={16} />
                        <span>Preview</span>
                    </button>
                </div>

                {/* Link Row */}
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 text-[#8E8E93] hover:text-white text-sm font-sans underline underline-offset-4 cursor-pointer transition-colors w-fit truncate max-w-full"
                >
                    <Image src="/icon-filelink.svg" alt="Link" width={14} height={14} className="opacity-70 shrink-0" />
                    <span className="truncate">{copied ? "Copied to clipboard!" : cleanUrl}</span>
                </button>

                <div className="h-[0.5px] bg-[#373737] w-full" />

                {/* Bottom Controls */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => onRevoke(doc.id)}
                        className="text-[#FF453A] hover:text-[#FF6961] text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer"
                    >
                        <Image src="/icon-trash.svg" alt="Delete" width={16} height={16} />
                        <span>Delete/Revoke</span>
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onDownload(doc)}
                            className="bg-white hover:bg-neutral-200 text-black px-6 py-2.5 rounded-full font-medium text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md"
                        >
                            <Image src="/icon-download.svg" alt="Download" width={16} height={16} />
                            <span>Download</span>
                        </button>

                        <button className="w-9 h-9 bg-[#2C2C2E] border-[0.5px] border-[#373737] rounded-full flex items-center justify-center text-[#8E8E93] hover:text-white text-sm cursor-pointer transition-colors">
                            ?
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};