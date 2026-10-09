import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import * as pdfjs from "pdfjs-dist";

export interface SignatureField {
    id: string;
    page: number;
    x: number; // percentage (0 - 100)
    y: number; // percentage (0 - 100)
    width: number; // percentage (0 - 100)
    height: number; // percentage (0 - 100)
    label?: string;
    isSigned: boolean;
    signatureValue?: string;
}

interface DocumentCanvasProps {
    mode: "sender" | "recipient";
    currentPage: number;
    zoomLevel: number;
    fields: SignatureField[];
    file?: File | string | null;
    activeFieldIndex?: number | null;
    isPlacingBlock?: boolean;
    onFieldSelect?: (index: number) => void;
    onFieldsChange?: (fields: SignatureField[]) => void;
    onFieldDelete?: (fieldId: string) => void;
    onSignFieldClick?: (fieldId: string) => void;
    onTotalPagesChange?: (pages: number) => void;
    onFinishPlacingBlock?: () => void;
}

export const DocumentCanvas: React.FC<DocumentCanvasProps> = ({
    mode,
    currentPage,
    zoomLevel,
    fields,
    file,
    activeFieldIndex,
    isPlacingBlock = false,
    onFieldSelect,
    onFieldsChange,
    onFieldDelete,
    onSignFieldClick,
    onTotalPagesChange,
    onFinishPlacingBlock,
}) => {
    const paperRef = useRef<HTMLDivElement>(null);
    const pdfCanvasRef = useRef<HTMLCanvasElement>(null);

    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    /* Marquee Selection Drag State (Snipping Tool style) */
    const [marquee, setMarquee] = useState<{
        startX: number;
        startY: number;
        currentX: number;
        currentY: number;
    } | null>(null);

    /* Drag / Resize State */
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [resizingId, setResizingId] = useState<string | null>(null);

    const activeDragRef = useRef<{
        fieldId: string;
        startX: number;
        startY: number;
        initialX: number;
        initialY: number;
    } | null>(null);

    const activeResizeRef = useRef<{
        fieldId: string;
        startX: number;
        startY: number;
        initialWidth: number;
        initialHeight: number;
    } | null>(null);

    const fieldsRef = useRef(fields);
    useEffect(() => {
        fieldsRef.current = fields;
    }, [fields]);

    const onFieldsChangeRef = useRef(onFieldsChange);
    useEffect(() => {
        onFieldsChangeRef.current = onFieldsChange;
    }, [onFieldsChange]);

    /* Set Local Worker */
    useEffect(() => {
        if (typeof window !== "undefined") {
            pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        }
    }, []);

    /* Load Document */
    useEffect(() => {
        if (!file) {
            setImageUrl(null);
            setPdfDoc(null);
            return;
        }

        if (typeof file === "string") {
            if (file.endsWith(".pdf") || file.includes("application/pdf")) {
                loadPdfFromUrl(file);
            } else {
                setImageUrl(file);
            }
            return;
        }

        if (file.type.startsWith("image/")) {
            const url = URL.createObjectURL(file);
            setImageUrl(url);
            setPdfDoc(null);
            return () => URL.revokeObjectURL(url);
        }

        if (file.type === "application/pdf") {
            setIsLoading(true);
            const reader = new FileReader();
            reader.onload = async (e) => {
                const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
                try {
                    const loadedPdf = await pdfjs.getDocument({ data: typedArray }).promise;
                    setPdfDoc(loadedPdf);
                    setImageUrl(null);
                    if (onTotalPagesChange) onTotalPagesChange(loadedPdf.numPages);
                } catch (err) {
                    console.error("Error loading PDF:", err);
                } finally {
                    setIsLoading(false);
                }
            };
            reader.readAsArrayBuffer(file);
        }
    }, [file]);

    const loadPdfFromUrl = async (url: string) => {
        try {
            setIsLoading(true);
            const loadedPdf = await pdfjs.getDocument(url).promise;
            setPdfDoc(loadedPdf);
            if (onTotalPagesChange) onTotalPagesChange(loadedPdf.numPages);
        } catch (err) {
            console.error("Failed to load PDF URL:", err);
        } finally {
            setIsLoading(false);
        }
    };

    /* Render PDF Page */
    useEffect(() => {
        if (!pdfDoc || !pdfCanvasRef.current) return;

        let renderTask: any = null;
        let isCancelled = false;

        const renderPage = async () => {
            try {
                const pageNumber = Math.min(Math.max(1, currentPage), pdfDoc.numPages);
                const page = await pdfDoc.getPage(pageNumber);
                if (isCancelled) return;

                const canvas = pdfCanvasRef.current;
                if (!canvas) return;

                const context = canvas.getContext("2d");
                if (!context) return;

                const viewport = page.getViewport({ scale: 1.5, rotation: 0 });

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                renderTask = page.render({
                    canvasContext: context,
                    viewport: viewport,
                } as any);

                await renderTask.promise;
            } catch (err: any) {
                if (err?.name !== "RenderingCancelledException") {
                    console.error("Render page error:", err);
                }
            }
        };

        renderPage();

        return () => {
            isCancelled = true;
            if (renderTask) {
                renderTask.cancel();
            }
        };
    }, [pdfDoc, currentPage]);

    /* Global Window Event Listeners for Repositioning & Resizing */
    useEffect(() => {
        const handleWindowPointerMove = (e: PointerEvent) => {
            if (!paperRef.current) return;
            const paperRect = paperRef.current.getBoundingClientRect();

            // Repositioning
            if (activeDragRef.current) {
                const { fieldId, startX, startY, initialX, initialY } = activeDragRef.current;

                const deltaXPercent = ((e.clientX - startX) / paperRect.width) * 100;
                const deltaYPercent = ((e.clientY - startY) / paperRect.height) * 100;

                let newX = Math.max(0, Math.min(85, initialX + deltaXPercent));
                let newY = Math.max(0, Math.min(92, initialY + deltaYPercent));

                if (onFieldsChangeRef.current) {
                    const updated = fieldsRef.current.map((f) =>
                        f.id === fieldId ? { ...f, x: newX, y: newY } : f
                    );
                    onFieldsChangeRef.current(updated);
                }
            }

            // Resizing
            if (activeResizeRef.current) {
                const { fieldId, startX, startY, initialWidth, initialHeight } = activeResizeRef.current;

                const deltaWPercent = ((e.clientX - startX) / paperRect.width) * 100;
                const deltaHPercent = ((e.clientY - startY) / paperRect.height) * 100;

                let newW = Math.max(12, Math.min(80, initialWidth + deltaWPercent));
                let newH = Math.max(4, Math.min(40, initialHeight + deltaHPercent));

                if (onFieldsChangeRef.current) {
                    const updated = fieldsRef.current.map((f) =>
                        f.id === fieldId ? { ...f, width: newW, height: newH } : f
                    );
                    onFieldsChangeRef.current(updated);
                }
            }
        };

        const handleWindowPointerUp = () => {
            if (activeDragRef.current) {
                activeDragRef.current = null;
                setDraggingId(null);
            }
            if (activeResizeRef.current) {
                activeResizeRef.current = null;
                setResizingId(null);
            }
        };

        window.addEventListener("pointermove", handleWindowPointerMove);
        window.addEventListener("pointerup", handleWindowPointerUp);

        return () => {
            window.removeEventListener("pointermove", handleWindowPointerMove);
            window.removeEventListener("pointerup", handleWindowPointerUp);
        };
    }, []);

    /* Snipping Tool Marquee Drawing Handlers */
    const handlePaperPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isPlacingBlock || !paperRef.current) return;

        e.preventDefault();
        const paperRect = paperRef.current.getBoundingClientRect();

        const startX = ((e.clientX - paperRect.left) / paperRect.width) * 100;
        const startY = ((e.clientY - paperRect.top) / paperRect.height) * 100;

        setMarquee({ startX, startY, currentX: startX, currentY: startY });
    };

    const handlePaperPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!marquee || !paperRef.current) return;

        const paperRect = paperRef.current.getBoundingClientRect();
        const currentX = Math.max(
            0,
            Math.min(100, ((e.clientX - paperRect.left) / paperRect.width) * 100)
        );
        const currentY = Math.max(
            0,
            Math.min(100, ((e.clientY - paperRect.top) / paperRect.height) * 100)
        );

        setMarquee((prev) => (prev ? { ...prev, currentX, currentY } : null));
    };

    const handlePaperPointerUp = () => {
        if (!marquee) return;

        const x = Math.min(marquee.startX, marquee.currentX);
        const y = Math.min(marquee.startY, marquee.currentY);
        const width = Math.abs(marquee.currentX - marquee.startX);
        const height = Math.abs(marquee.currentY - marquee.startY);

        // If click without drag, create default sized box
        const finalW = width < 3 ? 30 : width;
        const finalH = height < 2 ? 7 : height;

        const newField: SignatureField = {
            id: `field-${Date.now()}`,
            page: currentPage,
            x,
            y,
            width: finalW,
            height: finalH,
            label: `Signature ${fields.length + 1}`,
            isSigned: false,
        };

        if (onFieldsChange) {
            const nextFields = [...fields, newField];
            onFieldsChange(nextFields);
            if (onFieldSelect) onFieldSelect(nextFields.length - 1);
        }

        setMarquee(null);
        if (onFinishPlacingBlock) onFinishPlacingBlock();
    };

    /* Reposition Drag */
    const handleFieldPointerDown = (
        e: React.PointerEvent<HTMLDivElement>,
        field: SignatureField,
        globalIndex: number
    ) => {
        if (mode !== "sender" || isPlacingBlock) return;
        if ((e.target as HTMLElement).closest("button")) return;

        e.preventDefault();
        e.stopPropagation();

        if (onFieldSelect) onFieldSelect(globalIndex);

        activeDragRef.current = {
            fieldId: field.id,
            startX: e.clientX,
            startY: e.clientY,
            initialX: field.x,
            initialY: field.y,
        };

        setDraggingId(field.id);
    };

    /* Resize Drag */
    const handleResizePointerDown = (
        e: React.PointerEvent<HTMLButtonElement>,
        field: SignatureField
    ) => {
        if (mode !== "sender") return;

        e.preventDefault();
        e.stopPropagation();

        activeResizeRef.current = {
            fieldId: field.id,
            startX: e.clientX,
            startY: e.clientY,
            initialWidth: field.width || 30,
            initialHeight: field.height || 7,
        };

        setResizingId(field.id);
    };

    const currentPageFields = fields.filter((f) => f.page === currentPage);

    // Computed Snipping Marquee Rectangle
    const marqueeRect = marquee
        ? {
            left: `${Math.min(marquee.startX, marquee.currentX)}%`,
            top: `${Math.min(marquee.startY, marquee.currentY)}%`,
            width: `${Math.abs(marquee.currentX - marquee.startX)}%`,
            height: `${Math.abs(marquee.currentY - marquee.startY)}%`,
        }
        : null;

    return (
        <div className="relative w-full h-full flex items-center justify-center overflow-auto p-8 select-none [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#373737] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#505050]">
            <div
                style={{ transform: `scale(${zoomLevel / 100})` }}
                className="transition-transform duration-200 ease-out flex items-center justify-center"
            >
                <div
                    ref={paperRef}
                    onPointerDown={handlePaperPointerDown}
                    onPointerMove={handlePaperPointerMove}
                    onPointerUp={handlePaperPointerUp}
                    className={`
            relative w-[500px] h-[707px] bg-white rounded-[4px] shadow-2xl flex flex-col justify-between overflow-hidden touch-none
            ${isPlacingBlock ? "cursor-crosshair ring-2 ring-[#3C70F2]" : "cursor-default"}
          `}
                >
                    {isLoading && (
                        <div className="absolute inset-0 z-30 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                            <span className="font-sans text-xs text-black/50 animate-pulse">
                                Rendering document...
                            </span>
                        </div>
                    )}

                    {pdfDoc ? (
                        <canvas
                            ref={pdfCanvasRef}
                            className="w-full h-full object-contain pointer-events-none"
                        />
                    ) : imageUrl ? (
                        <img
                            src={imageUrl}
                            alt="Document Page"
                            className="w-full h-full object-contain pointer-events-none"
                        />
                    ) : (
                        <div className="w-full h-full p-8 flex flex-col justify-between text-black/80 font-serif">
                            <div className="space-y-4">
                                <div className="w-1/3 h-4 bg-black/10 rounded" />
                                <div className="w-full h-2.5 bg-black/5 rounded" />
                                <div className="w-full h-2.5 bg-black/5 rounded" />
                                <div className="w-4/5 h-2.5 bg-black/5 rounded" />
                            </div>
                        </div>
                    )}

                    {/* Snipping Tool Selection Trace (Marquee) */}
                    {marqueeRect && (
                        <div
                            style={marqueeRect}
                            className="absolute z-50 border-2 border-dashed border-[#3C70F2] bg-[#3C70F2]/15 pointer-events-none flex items-center justify-center"
                        >
                            <span className="font-sans font-medium text-[10px] text-[#3C70F2] bg-white/90 px-1.5 py-0.5 rounded shadow-sm border border-[#3C70F2]/30">
                                Drag to draw signature area
                            </span>
                        </div>
                    )}

                    {/* OVERLAY SIGNATURE FIELDS (Clean Glass Target aesthetic) */}
                    {currentPageFields.map((field) => {
                        const globalIndex = fields.findIndex((f) => f.id === field.id);
                        const isActive = activeFieldIndex === globalIndex;
                        const isDraggingThis = draggingId === field.id;
                        const isResizingThis = resizingId === field.id;

                        return (
                            <div
                                key={field.id}
                                onPointerDown={(e) => handleFieldPointerDown(e, field, globalIndex)}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onFieldSelect) onFieldSelect(globalIndex);
                                    if (mode === "recipient" && onSignFieldClick) {
                                        onSignFieldClick(field.id);
                                    }
                                }}
                                style={{
                                    left: `${field.x}%`,
                                    top: `${field.y}%`,
                                    width: `${field.width || 30}%`,
                                    height: `${field.height || 7}%`,
                                }}
                                className={`
                  absolute rounded-[6px] transition-all duration-75 select-none touch-none
                  flex items-center justify-between px-2.5 border
                  ${field.isSigned
                                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-900 z-10 cursor-pointer"
                                        : isActive
                                            ? "bg-[#3C70F2]/15 border-2 border-[#3C70F2] ring-2 ring-[#3C70F2]/20 z-30"
                                            : "bg-[#3C70F2]/5 border-dashed border-[#3C70F2]/60 hover:bg-[#3C70F2]/10 z-20"
                                    }
                  ${mode === "sender"
                                        ? isDraggingThis
                                            ? "cursor-grabbing scale-[1.01]"
                                            : "cursor-grab"
                                        : "cursor-pointer"
                                    }
                `}
                            >
                                {/* Delete Button */}
                                {mode === "sender" && isActive && onFieldDelete && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            onFieldDelete(field.id);
                                        }}
                                        className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-[#F23C3C] text-white rounded-full flex items-center justify-center font-sans text-xs font-bold shadow-md hover:scale-110 active:scale-95 transition-transform z-50 cursor-pointer"
                                        title="Delete field"
                                    >
                                        ×
                                    </button>
                                )}

                                {/* Resize Handle Handle */}
                                {mode === "sender" && isActive && (
                                    <button
                                        type="button"
                                        onPointerDown={(e) => handleResizePointerDown(e, field)}
                                        className={`
                      absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-[#3C70F2] rounded-full
                      border-2 border-white shadow-md z-50 cursor-nwse-resize hover:scale-125 transition-transform
                      ${isResizingThis ? "scale-125" : ""}
                    `}
                                        title="Resize field area"
                                    />
                                )}

                                {field.isSigned && field.signatureValue ? (
                                    <img
                                        src={field.signatureValue}
                                        alt="Signature"
                                        className="w-full h-full object-contain p-1 pointer-events-none"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 w-full h-full overflow-hidden">
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
                                                {mode === "sender" ? "Signer placement area" : "Click here to sign"}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};