import React, { useRef, useState } from "react";
import Image from "next/image";
import { IconButton } from "@/components/ui/IconButton";
import { Notification01Icon } from "hugeicons-react";

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
            <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
            />

            {/* Top Header Navigation */}
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
                        onClick={() => fileInputRef.current?.click()}
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
                        onClick={() => fileInputRef.current?.click()}
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
                        onClick={onImportUrl || (() => fileInputRef.current?.click())}
                    />
                </div>

                {/* Bell Button (Solid Surface) */}
                <IconButton
                    size="lg"
                    variant="solid"
                    icon={<Notification01Icon size={28} className="text-white" />}
                />
            </header>

            {/* Center Hero Section */}
            <main className="relative z-10 flex flex-col items-center justify-center text-center -mt-4 gap-6">
                <div className="flex flex-col items-center gap-3">
                    <div className="relative w-[220px] h-[70px]">
                        <Image
                            src="/logo.svg"
                            alt="fidddle"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>

                    <p className="font-brand text-base sm:text-lg italic text-white/90 tracking-wide">
                        Send, sign, and seal agreements in seconds. Simple and Secure
                    </p>
                </div>

                {/* Action CTAs */}
                <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-3">
                        {/* Upload Doc CTA */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="
                w-[243px] h-[64px]
                inline-flex items-center justify-center gap-3
                rounded-full bg-white text-[#121212]
                font-sans font-medium text-[24px] tracking-tight
                hover:bg-white/90 active:scale-[0.98]
                transition-all duration-150 shadow-lg shadow-[#121212]/30
              "
                        >
                            <span>Upload Doc</span>
                            <Image
                                src="/shortcut-cmd-o.svg"
                                alt="⌘O"
                                width={32}
                                height={21}
                                className="shrink-0"
                            />
                        </button>

                        {/* Glassmorphic Learn More CTA */}
                        <button
                            onClick={onLearnMore}
                            className="
                glass-button
                w-[191px] h-[64px]
                inline-flex items-center justify-center
                rounded-full text-white
                font-sans font-medium text-[24px] tracking-tight
                active:scale-[0.98]
              "
                        >
                            Learn More
                        </button>
                    </div>

                    <p className="font-sans font-light text-[20px] text-white/60 tracking-tight mt-1">
                        Drag & drop your PDF anywhere
                    </p>
                </div>
            </main>

            {/* Footer Meta */}
            <footer className="w-full z-10 flex items-center justify-between">
                <p className="text-xs font-sans text-white/40 tracking-tight">
                    Supports .pdf • 25MB max • End-to-end encrypted
                </p>
            </footer>

            {/* Background Watermark */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-[140px] pointer-events-none select-none z-0">
                <div className="relative w-[1552px] h-[768px]">
                    <Image
                        src="/watermark.svg"
                        alt=""
                        fill
                        className="object-contain object-bottom"
                        priority
                    />
                </div>
            </div>
        </div>
    );
};