import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import * as pdfjs from "pdfjs-dist";

export interface SignatureField {
    id: string;
    page: number;
    x: number; // percentage (0 - 100)
    y: number; // percentage (0 - 100)
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
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Keep live refs for drag event handlers to prevent stale closure bugs
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

    /* Render PDF Page with Cancellation */
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

    /* Handle Tap-to-Place on Paper Canvas */
    const handlePaperClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!paperRef.current || !isPlacingBlock || !onCanvasClickToPlace) return;

        const paperRect = paperRef.current.getBoundingClientRect();
        const x = ((e.clientX - paperRect.left) / paperRect.width) * 100;
        const y = ((e.clientY - paperRect.top) / paperRect.height) * 100;

        const clampedX = Math.max(2, Math.min(72, x));
        const clampedY = Math.max(2, Math.min(90, y));

        onCanvasClickToPlace(clampedX, clampedY);
    };

    /* Smooth Window-based Pointer Dragging */
    const handleStartDrag = (
        e: React.PointerEvent<HTMLDivElement>,
        field: SignatureField,
        globalIndex: number
    ) => {
        if (mode !== "sender" || isPlacingBlock) return;

        e.stopPropagation();

        if (onFieldSelect) {
            onFieldSelect(globalIndex);
        }

        if (!paperRef.current) return;
        const paperRect = paperRef.current.getBoundingClientRect();

        // Calculate mouse offset relative to top-left of the field card
        const fieldLeftPx = (field.x / 100) * paperRect.width;
        const fieldTopPx = (field.y / 100) * paperRect.height;
        const offsetX = e.clientX - paperRect.left - fieldLeftPx;
        const offsetY = e.clientY - paperRect.top - fieldTopPx;

        const targetFieldId = field.id;
        setDraggingId(targetFieldId);

        const handleWindowPointerMove = (moveEvent: PointerEvent) => {
            if (!paperRef.current) return;
            const rect = paperRef.current.getBoundingClientRect();

            let newX = ((moveEvent.clientX - rect.left - offsetX) / rect.width) * 100;
            let newY = ((moveEvent.clientY - rect.top - offsetY) / rect.height) * 100;

            // Keep within document boundary margins
            newX = Math.max(0, Math.min(74, newX));
            newY = Math.max(0, Math.min(92, newY));

            if (onFieldsChangeRef.current) {
                const updated = fieldsRef.current.map((f) =>
                    f.id === targetFieldId ? { ...f, x: newX, y: newY } : f
                );
                onFieldsChangeRef.current(updated);
            }
        };

        const handleWindowPointerUp = () => {
            setDraggingId(null);
            window.removeEventListener("pointermove", handleWindowPointerMove);
            window.removeEventListener("pointerup", handleWindowPointerUp);
        };

        window.addEventListener("pointermove", handleWindowPointerMove);
        window.addEventListener("pointerup", handleWindowPointerUp);
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

                        return (
                            <div
                                key={field.id}
                                onPointerDown={(e) => handleStartDrag(e, field, globalIndex)}
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
                                }}
                                className={`
                  absolute w-[184px] h-[52px] rounded-[12px] bg-[#1A1A1A] text-white
                  flex items-center justify-between px-3 transition-shadow duration-150 select-none shadow-2xl
                  ${isActive
                                        ? "border-2 border-[#3C70F2] ring-4 ring-[#3C70F2]/20 z-30"
                                        : field.isSigned
                                            ? "bg-emerald-950/90 border border-emerald-500/80 text-white z-10 cursor-pointer"
                                            : "border border-[#373737] hover:border-[#3C70F2] z-20"
                                    }
                  ${mode === "sender" ? (isDraggingThis ? "cursor-grabbing scale-[1.02]" : "cursor-grab") : "cursor-pointer"}
                `}
                            >
                                {/* Delete Button (Isolated from Drag Propagation) */}
                                {mode === "sender" && isActive && onFieldDelete && (
                                    <button
                                        type="button"
                                        onPointerDown={(e) => {
                                            e.stopPropagation();
                                        }}
                                        onPointerUp={(e) => {
                                            e.stopPropagation();
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            onFieldDelete(field.id);
                                        }}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-[#F23C3C] text-white rounded-full flex items-center justify-center font-sans text-xs font-bold shadow-lg hover:scale-110 active:scale-95 transition-transform z-40 cursor-pointer"
                                        title="Delete field"
                                    >
                                        ×
                                    </button>
                                )}

                                {field.isSigned ? (
                                    <div className="flex items-center justify-between w-full">
                                        <span className="font-sans font-medium text-xs text-emerald-400 italic truncate max-w-[120px]">
                                            {field.signatureValue || "Signed"}
                                        </span>
                                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                                            <Image
                                                src="/icon-tick.svg"
                                                alt="Signed"
                                                width={12}
                                                height={12}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2.5 w-full">
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
                                            <span className="font-sans font-light text-[10px] text-white/50">
                                                {mode === "sender" ? "Drag to adjust" : "Click to sign"}
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