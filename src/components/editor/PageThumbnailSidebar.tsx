/* src/components/editor/PageThumbnailSidebar.tsx */
import React, { useState, useEffect, useRef } from "react";
import * as pdfjs from "pdfjs-dist";

if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version || "4.10.38"}/build/pdf.worker.min.mjs`;
}

interface PageThumbnailSidebarProps {
    file?: File | string | null;
    currentPage: number;
    totalPages: number;
    onSelectPage: (page: number) => void;
}

export const PageThumbnailSidebar: React.FC<PageThumbnailSidebarProps> = ({
    file,
    currentPage,
    totalPages,
    onSelectPage,
}) => {
    const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!file) {
            setPdfDoc(null);
            setImageUrl(null);
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
                    .promise.then(setPdfDoc)
                    .catch((err) => {
                        console.warn("Could not load PDF from URL in sidebar:", err);
                    });
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
            const reader = new FileReader();
            reader.onload = async (e) => {
                const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
                try {
                    const loadedPdf = await pdfjs.getDocument({ data: typedArray }).promise;
                    setPdfDoc(loadedPdf);
                } catch (err) {
                    console.error("Sidebar PDF parse error:", err);
                }
            };
            reader.readAsArrayBuffer(file);
        }
    }, [file]);

    const pageNumbers = Array.from(
        { length: Math.max(1, totalPages) },
        (_, i) => i + 1
    );

    return (
        <aside className="w-[180px] h-full bg-[#1A1A1A] border-r border-[#373737] p-4 flex flex-col gap-4 overflow-y-auto shrink-0 select-none [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#373737] [&::-webkit-scrollbar-thumb]:rounded-full">
            <div className="text-xs font-sans font-medium text-white/60 tracking-wider uppercase px-1">
                Pages
            </div>

            <div className="flex flex-col gap-4">
                {pageNumbers.map((pageNum) => {
                    const isSelected = pageNum === currentPage;
                    return (
                        <button
                            key={pageNum}
                            onClick={() => onSelectPage(pageNum)}
                            className="group relative w-full flex flex-col items-center gap-2 p-1.5 rounded-[12px] transition-colors cursor-pointer hover:bg-[#222222]"
                        >
                            {/* Page Thumbnail Box (Blue stroke on active) */}
                            <div
                                className={`
                  relative w-full aspect-[1/1.4] bg-white rounded-[6px] overflow-hidden shadow-md flex items-center justify-center transition-all
                  ${isSelected
                                        ? "ring-2 ring-[#3C70F2] ring-offset-2 ring-offset-[#1A1A1A]"
                                        : "border border-black/10"
                                    }
                `}
                            >
                                {pdfDoc ? (
                                    <ThumbnailCanvas pdfDoc={pdfDoc} pageNum={pageNum} />
                                ) : imageUrl ? (
                                    <img
                                        src={imageUrl}
                                        alt={`Page ${pageNum}`}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full p-2 flex flex-col justify-between text-black/20 font-serif text-[6px]">
                                        <div className="space-y-1">
                                            <div className="w-1/2 h-1 bg-black/10 rounded" />
                                            <div className="w-full h-0.5 bg-black/5 rounded" />
                                            <div className="w-full h-0.5 bg-black/5 rounded" />
                                            <div className="w-3/4 h-0.5 bg-black/5 rounded" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Page Number Label */}
                            <span
                                className={`font-sans text-xs font-medium transition-colors ${isSelected ? "text-[#3C70F2]" : "text-white/50 group-hover:text-white"
                                    }`}
                            >
                                {pageNum}
                            </span>
                        </button>
                    );
                })}
            </div>
        </aside>
    );
};

const ThumbnailCanvas: React.FC<{
    pdfDoc: pdfjs.PDFDocumentProxy;
    pageNum: number;
}> = ({ pdfDoc, pageNum }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        let renderTask: any = null;
        let isCancelled = false;

        const renderThumbnail = async () => {
            try {
                if (pageNum > pdfDoc.numPages) return;
                const page = await pdfDoc.getPage(pageNum);
                if (isCancelled || !canvasRef.current) return;

                const canvas = canvasRef.current;
                const context = canvas.getContext("2d");
                if (!context) return;

                const viewport = page.getViewport({ scale: 0.3 });
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                renderTask = page.render({
                    canvasContext: context,
                    viewport: viewport,
                } as any);

                await renderTask.promise;
            } catch (err: any) {
                if (err?.name !== "RenderingCancelledException") {
                    console.error("Thumbnail render error:", err);
                }
            }
        };

        renderThumbnail();

        return () => {
            isCancelled = true;
            if (renderTask) renderTask.cancel();
        };
    }, [pdfDoc, pageNum]);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full object-contain pointer-events-none"
        />
    );
};