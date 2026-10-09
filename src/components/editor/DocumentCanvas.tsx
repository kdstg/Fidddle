/* src/components/editor/DocumentCanvas.tsx */
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import * as pdfjs from "pdfjs-dist";

if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version || "4.10.38"
        }/build/pdf.worker.min.mjs`;
}

export interface SignatureField {
    id: string;
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
    isSigned?: boolean;
    signatureValue?: string;
}

interface DocumentCanvasProps {
    mode: "sender" | "recipient";
    file?: File | string | null;
    currentPage: number;
    zoomLevel: number;
    fields: SignatureField[];
    activeFieldIndex?: number | null;
    isPlacingBlock?: boolean;
    onFieldSelect?: (index: number) => void;
    onSignFieldClick?: (fieldId: string) => void;
    onFieldsChange?: (fields: SignatureField[]) => void;
    onTotalPagesChange?: (pages: number) => void;
    onFieldDelete?: (fieldId: string) => void;
    onFinishPlacingBlock?: () => void;
}

export const DocumentCanvas: React.FC<DocumentCanvasProps> = ({
    mode,
    file,
    currentPage,
    zoomLevel,
    fields,
    activeFieldIndex,
    isPlacingBlock = false,
    onFieldSelect,
    onSignFieldClick,
    onFieldsChange,
    onTotalPagesChange,
    onFieldDelete,
    onFinishPlacingBlock,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const docWrapperRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [pageDimensions, setPageDimensions] = useState<{
        width: number;
        height: number;
    } | null>(null);

    /* Existing Field Drag & Resize State */
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [resizingId, setResizingId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ startX: 0, startY: 0, fieldX: 0, fieldY: 0 });
    const [resizeOffset, setResizeOffset] = useState({ startX: 0, startY: 0, fieldW: 0, fieldH: 0 });

    /* Marquee Drag-to-Draw Box State */
    const [isDrawingBox, setIsDrawingBox] = useState(false);
    const [boxStart, setBoxStart] = useState<{ x: number; y: number } | null>(null);
    const [boxCurrent, setBoxCurrent] = useState<{ x: number; y: number } | null>(null);

    /* Load Document File */
    useEffect(() => {
        if (!file) {
            setPdfDoc(null);
            setImageUrl(null);
            setPageDimensions(null);
            if (onTotalPagesChange) onTotalPagesChange(1);
            return;
        }

        if (typeof file === "string") {
            if (
                file.endsWith(".pdf") ||
                file.includes("application/pdf") ||
                file.startsWith("/")
            ) {
                pdfjs
                    .getDocument({ url: file })
                    .promise.then((doc) => {
                        setPdfDoc(doc);
                        if (onTotalPagesChange) onTotalPagesChange(doc.numPages);
                    })
                    .catch((err) =>
                        console.warn("Could not load PDF in main canvas:", err)
                    );
            } else {
                setImageUrl(file);
                if (onTotalPagesChange) onTotalPagesChange(1);
            }
            return;
        }

        if (file.type.startsWith("image/")) {
            const url = URL.createObjectURL(file);
            setImageUrl(url);
            setPdfDoc(null);
            if (onTotalPagesChange) onTotalPagesChange(1);
            return () => URL.revokeObjectURL(url);
        }

        if (file.type === "application/pdf") {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
                try {
                    const loadedPdf = await pdfjs.getDocument({ data: typedArray }).promise;
                    setPdfDoc(loadedPdf);
                    if (onTotalPagesChange) onTotalPagesChange(loadedPdf.numPages);
                } catch (err) {
                    console.error("Main canvas PDF parse error:", err);
                }
            };
            reader.readAsArrayBuffer(file);
        }
    }, [file]);

    /* Render PDF Page */
    useEffect(() => {
        if (!pdfDoc || !canvasRef.current) return;
        let renderTask: any = null;

        const renderPage = async () => {
            try {
                const page = await pdfDoc.getPage(currentPage);
                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                const unscaledViewport = page.getViewport({ scale: 1.0 });
                setPageDimensions({
                    width: unscaledViewport.width,
                    height: unscaledViewport.height,
                });

                const renderScale = 2.0;
                const viewport = page.getViewport({ scale: renderScale });

                canvas.width = viewport.width;
                canvas.height = viewport.height;

                renderTask = page.render({
                    canvasContext: ctx,
                    viewport: viewport,
                } as any);

                await renderTask.promise;
            } catch (err: any) {
                if (err?.name !== "RenderingCancelledException") {
                    console.error("Main canvas render error:", err);
                }
            }
        };

        renderPage();

        return () => {
            if (renderTask) renderTask.cancel();
        };
    }, [pdfDoc, currentPage]);

    /* Page Drag-to-Draw & Pointer Handlers */
    const handlePagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isPlacingBlock || mode !== "sender") return;
        if (!docWrapperRef.current) return;

        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);

        const rect = docWrapperRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

        setBoxStart({ x, y });
        setBoxCurrent({ x, y });
        setIsDrawingBox(true);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!docWrapperRef.current) return;
        const rect = docWrapperRef.current.getBoundingClientRect();

        /* 1. Dragging existing field */
        if (draggingId) {
            const deltaXPercent = ((e.clientX - dragOffset.startX) / rect.width) * 100;
            const deltaYPercent = ((e.clientY - dragOffset.startY) / rect.height) * 100;

            const updated = fields.map((f) => {
                if (f.id !== draggingId) return f;
                const newX = Math.max(0, Math.min(100 - f.width, dragOffset.fieldX + deltaXPercent));
                const newY = Math.max(0, Math.min(100 - f.height, dragOffset.fieldY + deltaYPercent));
                return { ...f, x: newX, y: newY };
            });
            if (onFieldsChange) onFieldsChange(updated);
            return;
        }

        /* 2. Resizing existing field */
        if (resizingId) {
            const deltaXPercent = ((e.clientX - resizeOffset.startX) / rect.width) * 100;
            const deltaYPercent = ((e.clientY - resizeOffset.startY) / rect.height) * 100;

            const updated = fields.map((f) => {
                if (f.id !== resizingId) return f;
                const newW = Math.max(12, Math.min(100 - f.x, resizeOffset.fieldW + deltaXPercent));
                const newH = Math.max(4, Math.min(100 - f.y, resizeOffset.fieldH + deltaYPercent));
                return { ...f, width: newW, height: newH };
            });
            if (onFieldsChange) onFieldsChange(updated);
            return;
        }

        /* 3. Live Marquee Drawing New Box */
        if (isDrawingBox && boxStart) {
            const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
            const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
            setBoxCurrent({ x, y });
        }
    };

    const handlePointerUp = () => {
        setDraggingId(null);
        setResizingId(null);

        /* Finalize Drawn Box */
        if (isDrawingBox && boxStart && boxCurrent) {
            const minX = Math.min(boxStart.x, boxCurrent.x);
            const maxX = Math.max(boxStart.x, boxCurrent.x);
            const minY = Math.min(boxStart.y, boxCurrent.y);
            const maxY = Math.max(boxStart.y, boxCurrent.y);

            let width = maxX - minX;
            let height = maxY - minY;
            let x = minX;
            let y = minY;

            /* Fallback for simple tap click without drag */
            if (width < 3 || height < 1.5) {
                const defaultW = 28;
                const defaultH = 7;
                x = Math.max(0, Math.min(100 - defaultW, boxStart.x - defaultW / 2));
                y = Math.max(0, Math.min(100 - defaultH, boxStart.y - defaultH / 2));
                width = defaultW;
                height = defaultH;
            }

            const newField: SignatureField = {
                id: `sig_${Date.now()}`,
                page: currentPage,
                x: Math.round(x * 10) / 10,
                y: Math.round(y * 10) / 10,
                width: Math.round(width * 10) / 10,
                height: Math.round(height * 10) / 10,
                label: `Signature ${fields.length + 1}`,
                isSigned: false,
            };

            const updated = [...fields, newField];
            if (onFieldsChange) onFieldsChange(updated);
            if (onFieldSelect) onFieldSelect(updated.length - 1);
            if (onFinishPlacingBlock) onFinishPlacingBlock();

            setIsDrawingBox(false);
            setBoxStart(null);
            setBoxCurrent(null);
        }
    };

    const currentPageFields = fields.filter((f) => f.page === currentPage);

    /* Compute Display Size */
    const scaleFactor = zoomLevel / 100;
    const displayWidth = pageDimensions
        ? pageDimensions.width * scaleFactor
        : 612 * scaleFactor;
    const displayHeight = pageDimensions
        ? pageDimensions.height * scaleFactor
        : 792 * scaleFactor;

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full flex items-start justify-center overflow-auto p-8 select-none [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-[#373737] [&::-webkit-scrollbar-thumb]:rounded-full"
        >
            <div
                ref={docWrapperRef}
                onPointerDown={handlePagePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className={`relative bg-white shadow-2xl rounded-[4px] my-auto transition-all duration-150 shrink-0 ${isPlacingBlock ? "cursor-crosshair ring-4 ring-[#3C70F2]/50" : ""
                    }`}
                style={{
                    width: `${displayWidth}px`,
                    height: `${displayHeight}px`,
                }}
            >
                {pdfDoc ? (
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full block rounded-[4px] pointer-events-none"
                    />
                ) : imageUrl ? (
                    <img
                        src={imageUrl}
                        alt="Document Page"
                        className="w-full h-full object-contain block rounded-[4px] pointer-events-none"
                    />
                ) : (
                    <div className="w-full h-full bg-white p-12 flex flex-col justify-between text-black/30 font-serif pointer-events-none">
                        <div className="space-y-4">
                            <div className="w-1/3 h-4 bg-black/10 rounded" />
                            <div className="w-full h-2 bg-black/5 rounded" />
                            <div className="w-full h-2 bg-black/5 rounded" />
                            <div className="w-4/5 h-2 bg-black/5 rounded" />
                        </div>
                        <div className="text-center font-sans text-xs text-black/20">
                            Blank Document Workspace Page {currentPage}
                        </div>
                    </div>
                )}

                {/* Live Dashed Selection Marquee while dragging */}
                {isDrawingBox && boxStart && boxCurrent && (
                    <div
                        style={{
                            left: `${Math.min(boxStart.x, boxCurrent.x)}%`,
                            top: `${Math.min(boxStart.y, boxCurrent.y)}%`,
                            width: `${Math.abs(boxCurrent.x - boxStart.x)}%`,
                            height: `${Math.abs(boxCurrent.y - boxStart.y)}%`,
                        }}
                        className="absolute border-2 border-dashed border-[#3C70F2] bg-[#3C70F2]/15 rounded-[8px] pointer-events-none z-30 flex items-center justify-center shadow-lg"
                    >
                        <div className="flex items-center gap-1.5 text-[#3C70F2] font-sans font-medium text-xs">
                            <Image src="/icon-sig-scrib.svg" alt="" width={14} height={14} />
                            <span className="hidden sm:inline">Signature Area</span>
                        </div>
                    </div>
                )}

                {/* Overlay Signature Fields */}
                {currentPageFields.map((field) => {
                    const globalIndex = fields.findIndex((f) => f.id === field.id);
                    const isSelected = activeFieldIndex === globalIndex;

                    return (
                        <div
                            key={field.id}
                            onPointerDown={(e) => {
                                e.stopPropagation();
                                if (mode === "sender") {
                                    (e.target as HTMLElement).setPointerCapture(e.pointerId);
                                    if (onFieldSelect) onFieldSelect(globalIndex);
                                    setDraggingId(field.id);
                                    setDragOffset({
                                        startX: e.clientX,
                                        startY: e.clientY,
                                        fieldX: field.x,
                                        fieldY: field.y,
                                    });
                                }
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (mode === "recipient" && onSignFieldClick) {
                                    onSignFieldClick(field.id);
                                }
                            }}
                            style={{
                                left: `${field.x}%`,
                                top: `${field.y}%`,
                                width: `${field.width}%`,
                                height: `${field.height}%`,
                            }}
                            className={`
                absolute rounded-[8px] flex items-center justify-center transition-all border-2 overflow-visible
                ${field.isSigned
                                    ? "border-emerald-500/60 bg-emerald-500/5 hover:bg-emerald-500/10 cursor-pointer"
                                    : isSelected
                                        ? "border-[#3C70F2] bg-[#3C70F2]/10 shadow-lg cursor-grab active:cursor-grabbing z-20"
                                        : "border-dashed border-[#3C70F2] bg-[#3C70F2]/5 hover:bg-[#3C70F2]/10 cursor-pointer z-10"
                                }
              `}
                        >
                            {field.isSigned && field.signatureValue ? (
                                <img
                                    src={field.signatureValue}
                                    alt="Signature"
                                    className="w-full h-full object-contain p-1 pointer-events-none"
                                />
                            ) : (
                                <div className="flex items-center gap-2 w-full h-full px-2 overflow-hidden pointer-events-none">
                                    <div className="w-5 h-5 rounded-full bg-[#3C70F2]/20 text-[#3C70F2] flex items-center justify-center shrink-0">
                                        <Image
                                            src="/icon-sig-scrib.svg"
                                            alt=""
                                            width={13}
                                            height={13}
                                        />
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="font-sans font-semibold text-[11px] text-[#3C70F2] truncate leading-tight">
                                            {field.label || "Signature Line"}
                                        </span>
                                        <span className="font-sans font-light text-[9px] text-[#3C70F2]/70 truncate">
                                            {mode === "sender"
                                                ? "Drag to move field"
                                                : "Click here to sign"}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Red Delete Button */}
                            {mode === "sender" && isSelected && onFieldDelete && (
                                <button
                                    type="button"
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onFieldDelete(field.id);
                                    }}
                                    className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-[#FF4D4D] hover:bg-[#FF3333] text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md transition-all cursor-pointer z-30"
                                    title="Delete field"
                                >
                                    ✕
                                </button>
                            )}

                            {/* Bottom Right Resize Handle */}
                            {mode === "sender" && isSelected && (
                                <div
                                    onPointerDown={(e) => {
                                        e.stopPropagation();
                                        (e.target as HTMLElement).setPointerCapture(e.pointerId);
                                        setResizingId(field.id);
                                        setResizeOffset({
                                            startX: e.clientX,
                                            startY: e.clientY,
                                            fieldW: field.width,
                                            fieldH: field.height,
                                        });
                                    }}
                                    className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-[#3C70F2] rounded-full border-2 border-white cursor-nwse-resize z-30 shadow-sm hover:scale-125 transition-transform"
                                    title="Resize field"
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};