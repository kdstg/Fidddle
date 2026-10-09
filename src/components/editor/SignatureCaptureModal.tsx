/* src/components/editor/SignatureCaptureModal.tsx */
import React, { useState, useRef, useEffect } from "react";

interface SignatureCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (signatureDataUrl: string) => void;
}

export const SignatureCaptureModal: React.FC<SignatureCaptureModalProps> = ({
    isOpen,
    onClose,
    onSave,
}) => {
    const [activeTab, setActiveTab] = useState<"draw" | "type" | "upload">("draw");
    const [typedText, setTypedText] = useState("");
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [isCanvasEmpty, setIsCanvasEmpty] = useState(true);

    /* Draw Canvas Refs & History */
    const drawCanvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);
    const historyRef = useRef<ImageData[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && activeTab === "draw") {
            const canvas = drawCanvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 3.5;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
        }
    }, [isOpen, activeTab]);

    if (!isOpen) return null;

    /* Draw Handlers */
    const saveHistoryState = () => {
        const canvas = drawCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    };

    const handleResetDraw = () => {
        const canvas = drawCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        historyRef.current = [];
        setIsCanvasEmpty(true);
    };

    const handleUndoDraw = () => {
        const canvas = drawCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        if (historyRef.current.length > 0) {
            historyRef.current.pop();
            if (historyRef.current.length > 0) {
                const lastState = historyRef.current[historyRef.current.length - 1];
                ctx.putImageData(lastState, 0, 0);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                setIsCanvasEmpty(true);
            }
        }
    };

    const startDrawing = (
        e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
    ) => {
        isDrawing.current = true;
        const canvas = drawCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        saveHistoryState();
        setIsCanvasEmpty(false);

        const rect = canvas.getBoundingClientRect();
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

        ctx.beginPath();
        ctx.moveTo(clientX - rect.left, clientY - rect.top);
    };

    const draw = (
        e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
    ) => {
        if (!isDrawing.current) return;
        const canvas = drawCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

        ctx.lineTo(clientX - rect.left, clientY - rect.top);
        ctx.stroke();
    };

    const stopDrawing = () => {
        isDrawing.current = false;
    };

    /* Convert White Draw Stroke to Dark Charcoal Ink PNG */
    const convertCanvasToBlackInk = (sourceCanvas: HTMLCanvasElement): string => {
        const offscreen = document.createElement("canvas");
        offscreen.width = sourceCanvas.width;
        offscreen.height = sourceCanvas.height;
        const ctx = offscreen.getContext("2d");
        if (!ctx) return "";

        ctx.drawImage(sourceCanvas, 0, 0);
        const imgData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3];
            if (alpha > 20) {
                data[i] = 20;     // R
                data[i + 1] = 20; // G
                data[i + 2] = 20; // B
            }
        }

        ctx.putImageData(imgData, 0, 0);
        return offscreen.toDataURL("image/png");
    };

    /* Save Trigger */
    const handleSave = () => {
        if (activeTab === "draw") {
            const canvas = drawCanvasRef.current;
            if (canvas && !isCanvasEmpty) {
                const blackInkDataUrl = convertCanvasToBlackInk(canvas);
                onSave(blackInkDataUrl);
            }
        } else if (activeTab === "type") {
            if (!typedText.trim()) return;
            const canvas = document.createElement("canvas");
            canvas.width = 600;
            canvas.height = 200;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.font = "italic 40px 'Georgia', serif";
                ctx.fillStyle = "#141414";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(typedText, canvas.width / 2, canvas.height / 2);
                onSave(canvas.toDataURL("image/png"));
            }
        } else if (activeTab === "upload") {
            if (uploadedImage) {
                onSave(uploadedImage);
            }
        }
        onClose();
    };

    /* File Upload Handler */
    const handleFileUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            setUploadedImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleDiscardUpload = () => {
        setUploadedImage(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 font-sans select-none">
            {/* Main Outer Dark Modal Card */}
            <div className="relative w-full max-w-[564px] bg-[#222222] border border-white/10 rounded-[28px] p-7 shadow-2xl space-y-6">

                {/* Header: Title + Red Circle Close Button */}
                <div className="flex items-center justify-between">
                    <h2 className="text-[22px] font-semibold text-white tracking-tight">
                        Adopt your signature
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-full bg-[#FF4D4D] hover:bg-[#FF3333] flex items-center justify-center transition-transform active:scale-95 text-white shadow-md cursor-pointer"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Tab Selection */}
                <div className="flex items-center gap-7 border-b border-white/10 pb-3 text-sm font-medium">
                    {(["draw", "type", "upload"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`capitalize relative transition-colors cursor-pointer ${activeTab === tab ? "text-[#3C70F2] font-semibold" : "text-white/50 hover:text-white"
                                }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute -bottom-[13px] left-0 right-0 h-[3px] bg-[#3C70F2] rounded-full" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Inner Dark Workspace Box */}
                <div className="relative w-full h-[250px] bg-[#181818] rounded-[20px] overflow-hidden flex flex-col justify-between p-5">

                    {/* TAB 1: DRAW */}
                    {activeTab === "draw" && (
                        <div className="relative w-full h-full flex flex-col justify-between">
                            <canvas
                                ref={drawCanvasRef}
                                width={508}
                                height={170}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                                className="w-full h-[170px] cursor-crosshair block z-10"
                            />

                            {/* Draw Placeholder: Pushed upward slightly via -translate-y-6 */}
                            {isCanvasEmpty && (
                                <div className="absolute inset-0 flex items-center justify-center -translate-y-6 pointer-events-none text-white/30 text-sm font-normal">
                                    Draw your signature on the canvas
                                </div>
                            )}

                            {/* Bottom Bar: Reset + Undo Pills on Left, Gradient Save on Right */}
                            <div className="flex items-center justify-between z-20 pt-2">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleResetDraw}
                                        className="px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white/90 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
                                    >
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21.5 2v6h-6M2.5 22v-6h6" />
                                            <path d="M2 11.5a10 10 0 0 1 18.8-4.3L21.5 8M2.5 16l1.2 1.2A10 10 0 0 0 22 12.5" />
                                        </svg>
                                        <span>Reset</span>
                                    </button>

                                    <button
                                        onClick={handleUndoDraw}
                                        className="w-9 h-9 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white/90 flex items-center justify-center transition-colors cursor-pointer"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M9 14L4 9l5-5" />
                                            <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
                                        </svg>
                                    </button>
                                </div>

                                <button
                                    onClick={handleSave}
                                    className="px-7 py-2.5 rounded-full bg-gradient-to-r from-[#4F80FF] to-[#2B66F6] hover:from-[#5B8CFF] hover:to-[#3872F6] text-white font-medium text-sm shadow-[0_4px_14px_rgba(43,102,246,0.4)] transition-all cursor-pointer active:scale-95"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: TYPE */}
                    {activeTab === "type" && (
                        <div className="relative w-full h-full flex flex-col justify-between">
                            <div className="w-full h-[170px] flex items-center justify-center px-6">
                                <input
                                    type="text"
                                    value={typedText}
                                    onChange={(e) => setTypedText(e.target.value)}
                                    placeholder="Type your signature on your keyboard"
                                    className="w-full bg-transparent text-center text-[20px] font-serif italic text-white placeholder:text-white/30 focus:outline-none tracking-wide"
                                    autoFocus
                                />
                            </div>

                            {/* Bottom Bar: Gradient Save on Right */}
                            <div className="flex items-center justify-end z-20 pt-2">
                                <button
                                    onClick={handleSave}
                                    className="px-7 py-2.5 rounded-full bg-gradient-to-r from-[#4F80FF] to-[#2B66F6] hover:from-[#5B8CFF] hover:to-[#3872F6] text-white font-medium text-sm shadow-[0_4px_14px_rgba(43,102,246,0.4)] transition-all cursor-pointer active:scale-95"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: UPLOAD */}
                    {activeTab === "upload" && (
                        <div className="relative w-full h-full flex flex-col justify-between">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
                                }}
                                className="w-full h-[170px] flex flex-col items-center justify-center gap-2 cursor-pointer group"
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/png, image/jpeg, image/webp"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                                    }}
                                />

                                {uploadedImage ? (
                                    <img
                                        src={uploadedImage}
                                        alt="Uploaded signature"
                                        className="max-h-[130px] object-contain"
                                    />
                                ) : (
                                    <>
                                        <div className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-105 transition-transform mb-1">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="17 8 12 3 7 8" />
                                                <line x1="12" y1="3" x2="12" y2="15" />
                                            </svg>
                                        </div>
                                        <p className="font-sans font-medium text-sm text-white/90">
                                            Tap to upload signature or drag & drop
                                        </p>
                                        <p className="font-sans text-xs text-white/40">
                                            Supports PNG, JPG, or WebP
                                        </p>
                                    </>
                                )}
                            </div>

                            {/* Bottom Bar: Discard Pill on Left, Gradient Save on Right */}
                            <div className="flex items-center justify-between z-20 pt-2">
                                <button
                                    onClick={handleDiscardUpload}
                                    className="px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white/90 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="9.5" y1="12.5" x2="14.5" y2="17.5" />
                                        <line x1="14.5" y1="12.5" x2="9.5" y2="17.5" />
                                    </svg>
                                    <span>Discard</span>
                                </button>

                                <button
                                    onClick={handleSave}
                                    className="px-7 py-2.5 rounded-full bg-gradient-to-r from-[#4F80FF] to-[#2B66F6] hover:from-[#5B8CFF] hover:to-[#3872F6] text-white font-medium text-sm shadow-[0_4px_14px_rgba(43,102,246,0.4)] transition-all cursor-pointer active:scale-95"
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