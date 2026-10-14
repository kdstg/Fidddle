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

    return (
        <div className="absolute right-0 top-[52px] z-40 w-[320px] bg-[#202020] border border-[#373737] rounded-[20px] shadow-2xl overflow-hidden p-2 select-none animate-in fade-in slide-in-from-top-2 duration-150">
            {documents.length === 0 ? (
                <div className="p-4 text-center text-sm text-[#A1A1A0]">
                    No activity yet
                </div>
            ) : (
                <div className="flex flex-col gap-1">
                    {documents.map((doc) => (
                        <button
                            key={doc.id}
                            onClick={() => onSelectDoc(doc)}
                            className="w-full flex items-center justify-between p-3 rounded-[12px] hover:bg-[#282828] transition-colors text-left cursor-pointer group"
                        >
                            <div className="flex flex-col gap-0.5 truncate pr-2">
                                <span className="font-sans font-medium text-[15px] text-white truncate">
                                    {doc.title}
                                </span>
                                <span className="font-sans text-[13px] text-[#A1A1A0]">
                                    {doc.createdAt}
                                </span>
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