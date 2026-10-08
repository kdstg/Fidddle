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
    onFieldSelect?: (index: number) => void;
    onFieldsChange?: (fields: SignatureField[]) => void;
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
    onFieldSelect,
    onFieldsChange,
    onSignFieldClick,
    onTotalPagesChange,
}) => {
    const paperRef = useRef<HTMLDivElement>(null);
    const pdfCanvasRef = useRef<HTMLCanvasElement>(null);

    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    /* ================= LOCAL PDF WORKER SETUP ================= */
    useEffect(() => {
        if (typeof window !== "undefined") {
            pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        }
    }, []);

    /* ================= LOAD FILE (PDF vs Image) ================= */
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

    /* ================= RENDER PDF PAGE TO CANVAS ================= */
    useEffect(() => {
        if (!pdfDoc || !pdfCanvasRef.current) return;

        let isRenderCancelled = false;

        const renderPage = async () => {
            try {
                const pageNumber = Math.min(Math.max(1, currentPage), pdfDoc.numPages);
                const page = await pdfDoc.getPage(pageNumber);
                if (isRenderCancelled) return;

                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = pdfCanvasRef.current;
                if (!canvas) return;

                const context = canvas.getContext("2d");
                if (!context) return;

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport,
                };

                await (page.render(renderContext as any) as any).promise;
            } catch (err) {
                console.error("Render page error:", err);
            }
        };

        renderPage();

        return () => {
            isRenderCancelled = true;
        };
    }, [pdfDoc, currentPage]);

    /* ================= SENDER DRAG HANDLERS ================= */
    const handlePointerDown = (
        e: React.PointerEvent<HTMLDivElement>,
        field: SignatureField
    ) => {
        if (mode !== "sender") return;
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);

        setDraggingId(field.id);
        const rect = e.currentTarget.getBoundingClientRect();
        dragOffsetRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    };

    const handlePointerMove = (
        e: React.PointerEvent<HTMLDivElement>,
        fieldId: string
    ) => {
        if (mode !== "sender" || draggingId !== fieldId || !paperRef.current) return;

        const paperRect = paperRef.current.getBoundingClientRect();

        let newX =
            ((e.clientX - paperRect.left - dragOffsetRef.current.x) / paperRect.width) *
            100;
        let newY =
            ((e.clientY - paperRect.top - dragOffsetRef.current.y) / paperRect.height) *
            100;

        newX = Math.max(2, Math.min(78, newX));
        newY = Math.max(2, Math.min(90, newY));

        if (onFieldsChange) {
            onFieldsChange(
                fields.map((f) => (f.id === fieldId ? { ...f, x: newX, y: newY } : f))
            );
        }
    };

    const handlePointerUp = (
        e: React.PointerEvent<HTMLDivElement>,
        fieldId: string
    ) => {
        if (mode !== "sender" || draggingId !== fieldId) return;
        e.currentTarget.releasePointerCapture(e.pointerId);
        setDraggingId(null);
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
                    className="relative w-[500px] h-[707px] bg-white rounded-[4px] shadow-2xl flex flex-col justify-between overflow-hidden cursor-default"
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

                        return (
                            <div
                                key={field.id}
                                onPointerDown={(e) => handlePointerDown(e, field)}
                                onPointerMove={(e) => handlePointerMove(e, field.id)}
                                onPointerUp={(e) => handlePointerUp(e, field.id)}
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
                  absolute w-[180px] h-[56px] rounded-[12px]
                  flex items-center justify-between px-3 cursor-pointer
                  transition-all duration-150
                  ${isActive
                                        ? "bg-[#3C70F2]/15 border-2 border-[#3C70F2] ring-4 ring-[#3C70F2]/20 shadow-lg scale-[1.02] z-20"
                                        : field.isSigned
                                            ? "bg-emerald-500/10 border border-emerald-500/50 text-emerald-950 z-10"
                                            : "bg-[#1D1D1D]/90 backdrop-blur-sm border border-dashed border-[#3C70F2] text-white hover:border-solid hover:bg-[#1D1D1D] z-10"
                                    }
                `}
                            >
                                {field.isSigned ? (
                                    <div className="flex items-center justify-between w-full">
                                        <span className="font-sans font-medium text-xs text-emerald-700 italic truncate max-w-[120px]">
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
                        ${isActive ? "bg-[#3C70F2] text-white" : "bg-[#373737] text-white/70"}
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
                                                {mode === "sender" ? "Drag to place" : "Click to sign"}
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