"use client";

import React, { useState } from "react";
import Image from "next/image";

interface SignLinkModalProps {
    isOpen: boolean;
    signingUrl: string;
    onClose: () => void;
}

export const SignLinkModal: React.FC<SignLinkModalProps> = ({
    isOpen,
    signingUrl,
    onClose,
}) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const fullUrl = `localhost:3000${signingUrl}`;

    const handleCopy = async () => {
        if (copied) return;
        try {
            await navigator.clipboard.writeText(`http://${fullUrl}`);
            setCopied(true);
            setTimeout(() => {
                setCopied(false);
            }, 4000);
        } catch (err) {
            console.error("Failed to copy link", err);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 select-none">
            <div
                className="relative bg-[#202020] border border-[#373737] rounded-[24px] shadow-2xl flex flex-col justify-between"
                style={{ width: "520px", height: "180px", padding: "32px" }}
            >
                {/* Header with Close */}
                <div className="flex items-center justify-between">
                    <h2 className="font-sans font-medium text-[20px] text-white tracking-tight">
                        Sign Link Generated
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-[#A1A1A0] hover:text-white transition-colors text-sm cursor-pointer"
                    >
                        Done
                    </button>
                </div>

                {/* Link Row */}
                <div className="flex items-center gap-[12px]">
                    <div
                        className="bg-[#181818] border border-[#373737] rounded-[12px] px-[16px] py-[12px] flex items-center overflow-hidden flex-1"
                        style={{ height: "46px", borderWidth: "0.5px" }}
                    >
                        <span className="font-sans font-normal text-[15px] text-[#A1A1A0] truncate">
                            {fullUrl}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleCopy}
                        className="h-[46px] px-[20px] bg-[#3C70F2] hover:bg-[#3261D6] rounded-[12px] flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0 font-medium text-white text-[15px]"
                    >
                        <Image
                            src={copied ? "/icon-copied.svg" : "/icon-copy.svg"}
                            alt={copied ? "Copied" : "Copy Link"}
                            width={18}
                            height={18}
                        />
                        <span>{copied ? "Copied!" : "Copy Link"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};