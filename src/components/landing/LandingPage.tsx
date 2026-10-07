import React, { useRef, useState } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { Button } from "@/components/ui/Button";
import { ShortcutBadge } from "@/components/ui/ShortcutBadge";
import {
    Notification01Icon,
    Link01Icon,
    GoogleDriveIcon,
    DropboxIcon,
} from "hugeicons-react";

interface LandingPageProps {
    onFileSelect: (file: File) => void;
    onLearnMore?: () => void;
    onImportUrl?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
    onFileSelect,
    onLearnMore,
    onImportUrl,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type === "application/pdf") {
                onFileSelect(file);
            }
        }
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="relative w-screen h-screen bg-[#202020] overflow-hidden flex flex-col justify-between p-6 sm:p-8 select-none"
        >
            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
            />

            {/* Full-Viewport Drag Active Overlay */}
            {isDragOver && (
                <div className="absolute inset-4 z-50 rounded-[24px] border-2 border-dashed border-[#3C70F2] bg-[#202020]/90 backdrop-blur-md flex flex-col items-center justify-center gap-3 animate-in fade-in-0 duration-150">
                    <div className="w-16 h-16 rounded-full bg-[#3C70F2]/10 border border-[#3C70F2] flex items-center justify-center text-[#3C70F2]">
                        <span className="text-2xl font-bold">+</span>
                    </div>
                    <p className="text-lg font-sans font-medium text-white">
                        Drop PDF anywhere to start signing
                    </p>
                </div>
            )}

            {/* Top Navigation Bar */}
            <header className="w-full flex items-center justify-between z-10">
                {/* Left Action Cluster */}
                <div className="flex items-center gap-2.5">
                    <IconButton
                        size="md"
                        icon={<GoogleDriveIcon size={18} className="text-white/80" />}
                        onClick={() => fileInputRef.current?.click()}
                        title="Import from Google Drive"
                    />
                    <IconButton
                        size="md"
                        icon={<DropboxIcon size={18} className="text-white/80" />}
                        onClick={() => fileInputRef.current?.click()}
                        title="Import from Dropbox"
                    />
                    <IconButton
                        size="md"
                        icon={<Link01Icon size={18} className="text-white/80" />}
                        onClick={onImportUrl || (() => fileInputRef.current?.click())}
                        title="Import from Web URL"
                    />
                </div>

                {/* Right Action: Notifications */}
                <IconButton
                    size="md"
                    icon={<Notification01Icon size={18} className="text-white/80" />}
                    title="Notifications"
                />
            </header>

            {/* Center Hero Section */}
            <main className="relative z-10 flex flex-col items-center justify-center text-center -mt-8 gap-7">
                {/* Brand Logo & Tagline */}
                <div className="flex flex-col items-center gap-2">
                    <h1 className="text-6xl sm:text-7xl font-brand font-normal text-white tracking-tight">
                        fidddle
                    </h1>
                    <p className="text-base sm:text-lg font-brand italic text-white/90 tracking-wide">
                        Send, sign, and seal agreements in seconds. Simple and Secure
                    </p>
                </div>

                {/* Action CTAs */}
                <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-3">
                        {/* White Upload Button with #121212 Elements */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="
                inline-flex items-center gap-2.5
                px-6 py-3 rounded-full
                bg-white text-[#121212]
                font-sans text-sm font-medium
                hover:bg-white/90 active:scale-[0.98]
                transition-all duration-150 shadow-lg shadow-[#121212]/40
              "
                        >
                            <span>Upload Doc</span>
                            <ShortcutBadge
                                label="⌘ O"
                                className="bg-[#121212]/10 border-[#121212]/20 text-[#121212]/80 font-semibold"
                            />
                        </button>

                        {/* Dark Glass Learn More Button */}
                        <Button
                            variant="glass"
                            size="md"
                            onClick={onLearnMore}
                            className="px-6 py-3 text-sm font-medium"
                        >
                            Learn More
                        </Button>
                    </div>

                    {/* Drag & Drop Hint */}
                    <p className="text-xs font-sans text-white/50 tracking-tight">
                        Drag & drop your PDF anywhere
                    </p>
                </div>
            </main>

            {/* Footer Info */}
            <footer className="w-full z-10 flex items-center justify-between">
                <p className="text-xs font-sans text-white/40 tracking-tight">
                    Supports .pdf • 25MB max • End-to-end encrypted
                </p>
            </footer>

            {/* SVG Watermark Target Container */}
            <div className="absolute inset-x-0 -bottom-10 pointer-events-none select-none flex justify-center overflow-hidden">
                {/* Replace this span with your <FidddleWatermarkSVG /> once exported */}
                <span className="font-brand text-[22vw] leading-none text-white/[0.03] tracking-tighter whitespace-nowrap">
                    fidddle
                </span>
            </div>
        </div>
    );
};