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
    const [email, setEmail] = useState("");

    if (!isOpen) return null;

    const fullUrl = `localhost:3000${signingUrl}`;

    const handleCopy = async () => {
        if (copied) return;
        try {
            await navigator.clipboard.writeText(`http://${fullUrl}`);
            setCopied(true);
            setTimeout(() => {
                setCopied(false);
            }, 5000); // Switches back after 5 seconds
        } catch (err) {
            console.error("Failed to copy link", err);
        }
    };

    const handleSendEmail = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        alert(`Email dispatch to ${email} will be connected in Step 2! Link: ${fullUrl}`);
        setEmail("");
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 select-none">
            <div
                className="relative bg-[#202020] border border-[#373737] rounded-[24px] shadow-2xl flex flex-col justify-between"
                style={{ width: "564px", height: "285px", padding: "36px" }}
            >
                {/* Header */}
                <h2 className="font-sans font-medium text-[20px] text-white tracking-tight">
                    Sign Link Generated
                </h2>

                {/* Link Row */}
                <div className="flex items-center gap-[16px]">
                    <div
                        className="bg-[#202020] border border-[#373737] rounded-[12px] px-[16px] py-[12px] flex items-center overflow-hidden"
                        style={{ width: "423px", height: "46px", borderWidth: "0.5px" }}
                    >
                        <span className="font-sans font-normal text-[16px] text-[#A1A1A0] truncate">
                            {fullUrl}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleCopy}
                        disabled={copied}
                        className="w-[45px] h-[45px] bg-[#202020] border border-[#373737] rounded-[12px] flex items-center justify-center cursor-pointer hover:border-white/40 transition-all shrink-0"
                        style={{ borderWidth: "0.5px" }}
                    >
                        <Image
                            src={copied ? "/icon-copied.svg" : "/icon-copy.svg"}
                            alt={copied ? "Copied" : "Copy Link"}
                            width={24}
                            height={24}
                            className="transition-all duration-300"
                        />
                    </button>
                </div>

                {/* Email Section */}
                <div className="flex flex-col gap-[8px]">
                    <span className="font-sans font-normal text-[16px] text-white">
                        Or Send To Email
                    </span>

                    <form onSubmit={handleSendEmail} className="flex items-center gap-[16px]">
                        <div
                            className="bg-[#202020] border border-[#373737] rounded-[12px] px-[16px] py-[12px] flex items-center overflow-hidden"
                            style={{ width: "423px", height: "46px", borderWidth: "0.5px" }}
                        >
                            <input
                                type="email"
                                placeholder="Enter Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-transparent font-sans font-normal text-[16px] text-white placeholder-[#A1A1A0] focus:outline-none"
                            />
                        </div>

                        <button
                            type="submit"
                            className="flex items-center justify-center text-white font-sans font-medium text-[16px] cursor-pointer transition-all active:scale-[0.96] shrink-0"
                            style={{
                                width: "74px",
                                height: "40px",
                                padding: "8px 16px",
                                borderRadius: "100px",
                                background: "linear-gradient(180deg, #3C70F2 0%, #6792FF 50%, #1245C7 100%)",
                                border: "1.5px solid transparent",
                                backgroundImage: "linear-gradient(180deg, #3C70F2 0%, #6792FF 50%, #1245C7 100%), linear-gradient(180deg, #376EFB 0%, #1853EC 100%)",
                                backgroundOrigin: "border-box",
                                backgroundClip: "padding-box, border-box",
                            }}
                        >
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};