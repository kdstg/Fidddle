import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import * as pdfjs from "pdfjs-dist";

export interface SignatureField {
    id: string;
    page: number;
    x: number; // percentage (0 - 100)
    y: number; // percentage (0 - 100)
    width?: number; // percentage (0 - 100)
    height?: number; // percentage (0 - 100)
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
    onCanvasClickToPlace?: (xPercent: number, yPercent: number) => void;
    onFieldSelect?: (index: number) => void;
    onFieldsChange?: (fields: SignatureField[]) => void;
    onFieldDelete?: (fieldId: string) => void;
    onSignFieldClick?: (fieldId: string) => void;
    onTotalPagesChange?: (pages: number) => void;
}

export const DocumentCanvas: React.FC<DocumentCanvasProps> = ({
    mode,
    currentPage,
    zoomLevel,
    fields,
    file,
    activeFieldIndex,
    isPlacingBlock = false,
    onCanvasClickToPlace,
    onFieldSelect,
    onFieldsChange,
    onFieldDelete,
    onSignFieldClick,
    onTotalPagesChange,
}) => {
    const paperRef = useRef<HTMLDivElement>(null);
    const pdfCanvasRef = useRef<HTMLCanvasElement>(null);

    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [resizingId, setResizingId] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Synchronous refs for active drag and resize operations
    const activeDragRef = useRef<{
        fieldId: string;
        startX: number;
        startY: number;
        initialFieldX: number;
        initialFieldY: number;
    } | null>(null);

    const activeResizeRef = useRef<{
        fieldId: string;
        startX: number;
        startY: number;
        initialWidth: number;
        initialHeight: number;
    } | null>(null);

    // Keep fresh references for window listeners
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

    /* Load File Source */
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

    /* Global Window Listeners for Moving & Resizing */
    useEffect(() => {
        const handleWindowPointerMove = (e: PointerEvent) => {
            if (!paperRef.current) return;
            const paperRect = paperRef.current.getBoundingClientRect();

            // Handle Repositioning
            if (activeDragRef.current) {
                const { fieldId, startX, startY, initialFieldX, initialFieldY } =
                    activeDragRef.current;

                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;

                const deltaXPercent = (deltaX / paperRect.width) * 100;
                const deltaYPercent = (deltaY / paperRect.height) * 100;

                let newX = initialFieldX + deltaXPercent;
                let newY = initialFieldY + deltaYPercent;

                // Bound checking
                newX = Math.max(0, Math.min(80, newX));
                newY = Math.max(0, Math.min(92, newY));

                if (onFieldsChangeRef.current) {
                    const updated = fieldsRef.current.map((f) =>
                        f.id === fieldId ? { ...f, x: newX, y: newY } : f
                    );
                    onFieldsChangeRef.current(updated);
                }
            }

            // Handle Container Resizing
            if (activeResizeRef.current) {
                const { fieldId, startX, startY, initialWidth, initialHeight } =
                    activeResizeRef.current;

                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;

                const deltaWPercent = (deltaX / paperRect.width) * 100;
                const deltaHPercent = (deltaY / paperRect.height) * 100;

                // Minimum dimensions: 18% width, 5% height
                let newW = Math.max(18, Math.min(60, initialWidth + deltaWPercent));
                let newH = Math.max(5, Math.min(30, initialHeight + deltaHPercent));

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

    /* Tap-to-Place on Paper Canvas */
    const handlePaperClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!paperRef.current || !isPlacingBlock || !onCanvasClickToPlace) return;

        const paperRect = paperRef.current.getBoundingClientRect();
        const x = ((e.clientX - paperRect.left) / paperRect.width) * 100;
        const y = ((e.clientY - paperRect.top) / paperRect.height) * 100;

        const clampedX = Math.max(2, Math.min(70, x));
        const clampedY = Math.max(2, Math.min(90, y));

        onCanvasClickToPlace(clampedX, clampedY);
    };

    /* Start Reposition Drag */
    const handleFieldPointerDown = (
        e: React.PointerEvent<HTMLDivElement>,
        field: SignatureField,
        globalIndex: number
    ) => {
        if (mode !== "sender" || isPlacingBlock) return;
        if ((e.target as HTMLElement).closest("button")) return;

        e.preventDefault();
        e.stopPropagation();

        if (onFieldSelect) {
            onFieldSelect(globalIndex);
        }

        activeDragRef.current = {
            fieldId: field.id,
            startX: e.clientX,
            startY: e.clientY,
            initialFieldX: field.x,
            initialFieldY: field.y,
        };

        setDraggingId(field.id);
    };

    /* Start Resize Drag */
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
            initialWidth: field.width || 36, // default ~180px on 500px paper
            initialHeight: field.height || 7.3, // default ~52px on 707px paper
        };

        setResizingId(field.id);
    };

    const currentPageFields = fields.filter((f) => f.page === currentPage);

    return (
        <div className="relative w-full h-full flex items-center justify-center overflow-auto p-8 select-none [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#373737] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#505050]">
            <div
                style={{ transform: `scale(${zoomLevel / 100})` }}
                className="transition-transform duration-200 ease-out flex items-center justify-center"
            >
                <div
                    ref={paperRef}
                    onClick={handlePaperClick}
                    className={`
            relative w-[500px] h-[707px] bg-white rounded-[4px] shadow-2xl flex flex-col justify-between overflow-hidden
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
                                <div className="pt-6 space-y-2">
                                    <div className="w-full h-2 bg-black/5 rounded" />
                                    <div className="w-full h-2 bg-black/5 rounded" />
                                    <div className="w-3/4 h-2 bg-black/5 rounded" />
                                </div>
                            </div>
                            <div className="text-center font-sans text-[11px] text-black/30 border-t border-black/5 pt-4">
                                Page {currentPage}
                            </div>
                        </div>
                    )}

                    {/* OVERLAY SIGNATURE FIELDS */}
                    {currentPageFields.map((field) => {
                        const globalIndex = fields.findIndex((f) => f.id === field.id);
                        const isActive = activeFieldIndex === globalIndex;
                        const isDraggingThis = draggingId === field.id;
                        const isResizingThis = resizingId === field.id;

                        const fieldWidth = field.width ? `${field.width}%` : "184px";
                        const fieldHeight = field.height ? `${field.height}%` : "52px";

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
                                    width: fieldWidth,
                                    height: fieldHeight,
                                }}
                                className={`
                  absolute rounded-[12px] bg-[#1A1A1A] text-white
                  flex items-center justify-between px-3 select-none touch-none shadow-2xl
                  ${isActive
                                        ? "border-2 border-[#3C70F2] ring-4 ring-[#3C70F2]/20 z-30"
                                        : field.isSigned
                                            ? "bg-emerald-950/90 border border-emerald-500/80 text-white z-10 cursor-pointer"
                                            : "border border-[#373737] hover:border-[#3C70F2] z-20"
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
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-[#F23C3C] text-white rounded-full flex items-center justify-center font-sans text-xs font-bold shadow-xl hover:scale-110 active:scale-95 transition-transform z-50 cursor-pointer"
                                        title="Delete field"
                                    >
                                        ×
                                    </button>
                                )}

                                {/* Bottom-Right Corner Resize Grip Handle */}
                                {mode === "sender" && isActive && (
                                    <button
                                        type="button"
                                        onPointerDown={(e) => handleResizePointerDown(e, field)}
                                        className={`
                      absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-[#3C70F2] rounded-full
                      border-2 border-white shadow-md z-50 cursor-nwse-resize
                      hover:scale-125 transition-transform
                      ${isResizingThis ? "scale-125 ring-2 ring-white" : ""}
                    `}
                                        title="Drag to resize box"
                                    />
                                )}

                                {field.isSigned ? (
                                    <div className="flex items-center justify-between w-full h-full">
                                        <span className="font-sans font-medium text-xs text-emerald-400 italic truncate max-w-[120px]">
                                            {field.signatureValue || "Signed"}
                                        </span>
                                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
                                            <Image
                                                src="/icon-tick.svg"
                                                alt="Signed"
                                                width={12}
                                                height={12}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2.5 w-full h-full overflow-hidden">
                                        <div
                                            className={`
                        w-7 h-7 rounded-full flex items-center justify-center shrink-0
                        ${isActive ? "bg-[#3C70F2] text-white" : "bg-[#282828] text-white/70"}
                      `}
                                        >
                                            <Image
                                                src="/icon-sig-scrib.svg"
                                                alt=""
                                                width={16}
                                                height={16}
                                            />
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="font-sans font-medium text-[12px] text-white truncate leading-tight">
                                                {field.label || "Signature"}
                                            </span>
                                            <span className="font-sans font-light text-[10px] text-white/50 truncate">
                                                {mode === "sender" ? "Drag / resize box" : "Click to sign"}
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