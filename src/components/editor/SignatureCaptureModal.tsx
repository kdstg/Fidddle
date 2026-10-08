import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";

interface SignatureCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (signatureDataUrl: string) => void;
}

type TabType = "draw" | "type" | "upload";

export const SignatureCaptureModal: React.FC<SignatureCaptureModalProps> = ({
    isOpen,
    onClose,
    onSave,
}) => {
    const [activeTab, setActiveTab] = useState<TabType>("draw");

    /* Tab States (Preserved in Memory) */
    // Draw state
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawData, setHasDrawData] = useState(false);
    const [strokesStack, setStrokesStack] = useState<ImageData[]>([]);

    // Type state
    const [typedText, setTypedText] = useState("");

    // Upload state
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [isProcessingUpload, setIsProcessingUpload] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /* Set up Drawing Canvas */
    useEffect(() => {
        if (activeTab === "draw" && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            if (ctx && strokesStack.length === 0) {
                ctx.strokeStyle = "#FFFFFF";
                ctx.lineWidth = 2.5;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
            }
        }
    }, [activeTab]);

    if (!isOpen) return null;

    /* --- DRAW TAB HANDLERS --- */
    const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Save history state for undo
        const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setStrokesStack((prev) => [...prev, currentState]);

        setIsDrawing(true);
        setHasDrawData(true);

        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };

    const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const handleResetDraw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawData(false);
        setStrokesStack([]);
    };

    const handleUndoDraw = () => {
        if (strokesStack.length === 0 || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const previousState = strokesStack[strokesStack.length - 1];
        ctx.putImageData(previousState, 0, 0);

        const newStack = strokesStack.slice(0, -1);
        setStrokesStack(newStack);
        if (newStack.length === 0) {
            setHasDrawData(false);
        }
    };

    /* Export Drawn Signature (Convert White Ink -> Black PNG) */
    const exportDrawnSignature = (): string | null => {
        const canvas = canvasRef.current;
        if (!canvas || !hasDrawData) return null;

        const offscreen = document.createElement("canvas");
        offscreen.width = canvas.width;
        offscreen.height = canvas.height;
        const ctx = offscreen.getContext("2d");
        if (!ctx) return null;

        ctx.drawImage(canvas, 0, 0);
        const imgData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);
        const data = imgData.data;

        // Convert White drawing stroke pixels into Dark Charcoal (#1A1A1A) for PDF placement
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 0) {
                data[i] = 26; // R
                data[i + 1] = 26; // G
                data[i + 2] = 26; // B
            }
        }
        ctx.putImageData(imgData, 0, 0);
        return offscreen.toDataURL("image/png");
    };

    /* --- TYPE TAB HANDLERS --- */
    const exportTypedSignature = (): string | null => {
        if (!typedText.trim()) return null;

        const offscreen = document.createElement("canvas");
        offscreen.width = 400;
        offscreen.height = 120;
        const ctx = offscreen.getContext("2d");
        if (!ctx) return null;

        ctx.font = "italic 40px 'Caveat', 'Dancing Script', cursive, sans-serif";
        ctx.fillStyle = "#1A1A1A";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(typedText, offscreen.width / 2, offscreen.height / 2);

        return offscreen.toDataURL("image/png");
    };

    /* --- UPLOAD TAB HANDLERS --- */
    const handleFileUpload = (file: File) => {
        if (file.size > 8 * 1024 * 1024) {
            alert("File size exceeds 8MB threshold.");
            return;
        }

        setIsProcessingUpload(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new window.Image();
            img.onload = () => {
                // Auto White-Background Removal using Canvas Thresholding
                const offscreen = document.createElement("canvas");
                offscreen.width = img.width;
                offscreen.height = img.height;
                const ctx = offscreen.getContext("2d");
                if (!ctx) return;

                ctx.drawImage(img, 0, 0);
                const imgData = ctx.getImageData(0, 0, img.width, img.height);
                const data = imgData.data;

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    // Turn near-white background pixels transparent
                    if (r > 210 && g > 210 && b > 210) {
                        data[i + 3] = 0;
                    }
                }
                ctx.putImageData(imgData, 0, 0);
                setUploadedImage(offscreen.toDataURL("image/webp"));
                setIsProcessingUpload(false);
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    /* Determine Save Button Active State */
    const isSaveEnabled =
        (activeTab === "draw" && hasDrawData) ||
        (activeTab === "type" && typedText.trim().length > 0) ||
        (activeTab === "upload" && uploadedImage !== null);

    const handleSave = () => {
        let resultUrl: string | null = null;
        if (activeTab === "draw") resultUrl = exportDrawnSignature();
        if (activeTab === "type") resultUrl = exportTypedSignature();
        if (activeTab === "upload") resultUrl = uploadedImage;

        if (resultUrl) {
            onSave(resultUrl);
            onClose();
        }
    };

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center select-none"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-[564px] h-[366px] bg-[#1D1D1D] border border-[#373737] rounded-[24px] p-[36px] flex flex-col justify-between shadow-2xl"
            >
                {/* Header Title & Gradient Red Close Button */}
                <div className="flex items-center justify-between w-full">
                    <h3 className="font-sans font-medium text-[20px] text-white tracking-tight">
                        Adopt your signature
                    </h3>

                    <button
                        onClick={onClose}
                        className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                        style={{
                            background:
                                "linear-gradient(180deg, #F23C3C 0%, #FF6767 50%, #C71212 100%)",
                            boxShadow: "inset 0 0 0 0.5px #FB3737",
                        }}
                        title="Close modal"
                    >
                        <Image
                            src="/icon-close.svg"
                            alt="Close"
                            width={10}
                            height={10}
                        />
                    </button>
                </div>

                {/* Tab Navigation (24px space below header) */}
                <div className="flex items-center gap-6 mt-[24px] mb-[16px] border-b border-[#373737]/40 relative">
                    {(["draw", "type", "upload"] as TabType[]).map((tab) => {
                        const isActive = activeTab === tab;
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className="relative pb-2 font-sans font-normal text-[16px] capitalize transition-colors cursor-pointer"
                                style={{ color: isActive ? "#0061FF" : "#A1A1A0" }}
                            >
                                {tab}
                                {isActive && (
                                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0061FF] rounded-full translate-y-[1px]" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Canvas Body Container */}
                <div className="relative w-full flex-1 bg-[#202020] rounded-[16px] p-[16px] flex flex-col justify-between overflow-hidden">
                    {/* TAB 1: DRAW */}
                    {activeTab === "draw" && (
                        <div className="relative w-full h-full flex flex-col justify-between">
                            {!hasDrawData && (
                                <span className="absolute inset-0 flex items-center justify-center font-sans font-light text-[16px] text-white/40 pointer-events-none">
                                    Draw your signature on the canvas
                                </span>
                            )}
                            <canvas
                                ref={canvasRef}
                                width={492}
                                height={120}
                                onPointerDown={startDrawing}
                                onPointerMove={draw}
                                onPointerUp={stopDrawing}
                                onPointerLeave={stopDrawing}
                                className="w-full h-[120px] cursor-crosshair touch-none"
                            />

                            {/* Action Toolbar */}
                            <div className="flex items-center justify-between w-full pt-2">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleResetDraw}
                                        className="h-[36px] px-3 bg-[#1D1D1D] border border-[#373737] rounded-full text-white font-sans font-medium text-[16px] flex items-center gap-2 hover:bg-[#252525] active:scale-95 transition-all cursor-pointer"
                                    >
                                        <Image
                                            src="/icon-reset.svg"
                                            alt=""
                                            width={16}
                                            height={16}
                                        />
                                        <span>Reset</span>
                                    </button>

                                    <button
                                        onClick={handleUndoDraw}
                                        disabled={strokesStack.length === 0}
                                        className="w-[49px] h-[36px] bg-[#1D1D1D] border border-[#373737] rounded-full text-white flex items-center justify-center hover:bg-[#252525] active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <Image
                                            src="/icon-undo.svg"
                                            alt="Undo"
                                            width={16}
                                            height={16}
                                        />
                                    </button>
                                </div>

                                {/* Save Button */}
                                <button
                                    onClick={handleSave}
                                    disabled={!isSaveEnabled}
                                    className="w-[70px] h-[36px] rounded-full font-sans font-medium text-[16px] text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    style={{
                                        background:
                                            "linear-gradient(180deg, #3C70F2 0%, #6792FF 50%, #1245C7 100%)",
                                        boxShadow: "inset 0 0 0 1.5px #3C70F2",
                                    }}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: TYPE */}
                    {activeTab === "type" && (
                        <div className="relative w-full h-full flex flex-col justify-between">
                            <input
                                type="text"
                                value={typedText}
                                onChange={(e) => setTypedText(e.target.value)}
                                placeholder="Type your signature on your keyboard"
                                className="w-full bg-transparent font-serif italic text-[24px] text-white placeholder:font-sans placeholder:not-italic placeholder:font-light placeholder:text-[16px] placeholder:text-white/40 border-none outline-none pt-4 text-center"
                            />

                            <div className="flex items-center justify-end w-full pt-2">
                                <button
                                    onClick={handleSave}
                                    disabled={!isSaveEnabled}
                                    className="w-[70px] h-[36px] rounded-full font-sans font-medium text-[16px] text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    style={{
                                        background:
                                            "linear-gradient(180deg, #3C70F2 0%, #6792FF 50%, #1245C7 100%)",
                                        boxShadow: "inset 0 0 0 1.5px #3C70F2",
                                    }}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: UPLOAD */}
                    {activeTab === "upload" && (
                        <div className="relative w-full h-full flex flex-col justify-between">
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/png, image/jpeg, image/jpg, image/webp"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                                }}
                            />

                            {uploadedImage ? (
                                <div className="relative w-full h-[100px] flex items-center justify-center">
                                    <img
                                        src={uploadedImage}
                                        alt="Uploaded Signature"
                                        className="max-h-full object-contain"
                                    />
                                </div>
                            ) : (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full h-[100px] flex flex-col items-center justify-center gap-2 font-sans font-light text-[16px] text-white/40 hover:text-white/70 cursor-pointer border border-dashed border-[#373737] rounded-[12px] transition-colors"
                                >
                                    <Image
                                        src="/icon-upload.svg"
                                        alt=""
                                        width={20}
                                        height={20}
                                        className="opacity-50"
                                    />
                                    <span>
                                        {isProcessingUpload
                                            ? "Removing background..."
                                            : "Tap to upload signature or drag & drop"}
                                    </span>
                                </button>
                            )}

                            <div className="flex items-center justify-between w-full pt-2">
                                {uploadedImage ? (
                                    <button
                                        onClick={() => setUploadedImage(null)}
                                        className="h-[36px] px-3 bg-[#1D1D1D] border border-[#373737] rounded-full text-white font-sans font-medium text-[16px] flex items-center gap-2 hover:bg-[#252525] active:scale-95 transition-all cursor-pointer"
                                    >
                                        <Image
                                            src="/icon-discard.svg"
                                            alt=""
                                            width={16}
                                            height={16}
                                        />
                                        <span>Discard</span>
                                    </button>
                                ) : (
                                    <div />
                                )}

                                <button
                                    onClick={handleSave}
                                    disabled={!isSaveEnabled}
                                    className="w-[70px] h-[36px] rounded-full font-sans font-medium text-[16px] text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    style={{
                                        background:
                                            "linear-gradient(180deg, #3C70F2 0%, #6792FF 50%, #1245C7 100%)",
                                        boxShadow: "inset 0 0 0 1.5px #3C70F2",
                                    }}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};