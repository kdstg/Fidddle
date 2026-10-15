"use client";

import React from "react";
import { DocumentLog } from "@/types/document";

interface ActivityPopoverProps {
    isOpen: boolean;
    documents: DocumentLog[];
    onSelectDoc: (doc: DocumentLog) => void;
}

export const ActivityPopover: React.FC<ActivityPopoverProps> = ({
    isOpen,
    documents,
    onSelectDoc,
}) => {
    if (!isOpen) return null;

    // Helper for status styling
    const getStatusBadge = (status?: string) => {
        switch (status) {
            case "signed":
                return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">Signed</span>;
            case "revoked":
                return <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">Revoked</span>;
            default:
                return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">Pending</span>;
        }
    };

    return (
        <div className="absolute right-0 top-[52px] z-40 w-[340px] bg-[#202020] border border-[#373737] rounded-[20px] shadow-2xl overflow-hidden p-2 select-none">
            {documents.length === 0 ? (
                <div className="p-4 text-center text-sm text-[#A1A1A0]">
                    No activity yet
                </div>
            ) : (
                <div className="flex flex-col gap-1 max-h-[360px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#373737] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#4a4a4a]">
                    {documents.map((doc) => (
                        <button
                            key={doc.id}
                            onClick={() => onSelectDoc(doc)}
                            className="w-full flex items-center justify-between p-3 rounded-[12px] hover:bg-[#282828] transition-colors text-left cursor-pointer group"
                        >
                            <div className="flex flex-col gap-1 truncate pr-2">
                                <span className="font-sans font-medium text-[15px] text-white truncate">
                                    {doc.title}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="font-sans text-[12px] text-[#A1A1A0]">
                                        {doc.createdAt}
                                    </span>
                                    {getStatusBadge(doc.status)}
                                </div>
                            </div>

                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                className="text-[#A1A1A0] group-hover:text-white transition-colors shrink-0"
                            >
                                <path
                                    d="M6 12L10 8L6 4"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};