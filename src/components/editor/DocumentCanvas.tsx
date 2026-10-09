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
    onFieldSelect?: (index: number) => void;
    onSignFieldClick?: (fieldId: string) => void;
    onFieldsChange?: (fields: SignatureField[]) => void;
    onTotalPagesChange?: (pages: number) => void;
    onFieldDelete?: (fieldId: string) => void;
}

export const DocumentCanvas: React.FC<DocumentCanvasProps> = ({
    mode,
    file,
    currentPage,
    zoomLevel,
    fields,
    activeFieldIndex,
    onFieldSelect,
    onSignFieldClick,
    onFieldsChange,
    onTotalPagesChange,
    onFieldDelete,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [pageDimensions, setPageDimensions] = useState<{
        width: number;
        height: number;
    } | null>(null);

    /* Load PDF / Image File */
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

    /* Render PDF Page to Canvas with Crisp DPI & Exact Aspect Ratio */
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

                /* Get True Unscaled PDF Page Dimensions */
                const unscaledViewport = page.getViewport({ scale: 1.0 });
                setPageDimensions({
                    width: unscaledViewport.width,
                    height: unscaledViewport.height,
                });

                /* High DPI Render Resolution */
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
                className="relative bg-white shadow-2xl rounded-[4px] my-auto transition-all duration-150 shrink-0"
                style={{
                    width: `${displayWidth}px`,
                    height: `${displayHeight}px`,
                }}
            >
                {pdfDoc ? (
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full block rounded-[4px]"
                    />
                ) : imageUrl ? (
                    <img
                        src={imageUrl}
                        alt="Document Page"
                        className="w-full h-full object-contain block rounded-[4px]"
                    />
                ) : (
                    <div className="w-full h-full bg-white p-12 flex flex-col justify-between text-black/30 font-serif">
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

                {/* Overlay Signature Fields */}
                {currentPageFields.map((field, idx) => {
                    const isSelected = activeFieldIndex === idx;

                    return (
                        <div
                            key={field.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (mode === "sender" && onFieldSelect) onFieldSelect(idx);
                                if (mode === "recipient" && onSignFieldClick)
                                    onSignFieldClick(field.id);
                            }}
                            style={{
                                left: `${field.x}%`,
                                top: `${field.y}%`,
                                width: `${field.width}%`,
                                height: `${field.height}%`,
                            }}
                            className={`
                absolute rounded-[8px] flex items-center justify-center cursor-pointer transition-all border-2 overflow-hidden
                ${field.isSigned
                                    ? "border-emerald-500/60 bg-emerald-500/5 hover:bg-emerald-500/10"
                                    : isSelected
                                        ? "border-[#3C70F2] bg-[#3C70F2]/10 shadow-lg"
                                        : "border-dashed border-[#3C70F2] bg-[#3C70F2]/5 hover:bg-[#3C70F2]/10"
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
                                <div className="flex items-center gap-2 w-full h-full px-2 overflow-hidden">
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
                                                ? "Signer placement area"
                                                : "Click here to sign"}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Delete Button for Sender */}
                            {mode === "sender" && isSelected && onFieldDelete && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onFieldDelete(field.id);
                                    }}
                                    className="absolute -top-2 -right-2 w-5 h-5 bg-[#FF4D4D] hover:bg-[#FF3333] text-white rounded-full flex items-center justify-center text-xs shadow-md transition-all cursor-pointer"
                                    title="Delete field"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};