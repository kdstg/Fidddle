import React, { useRef, useState, useEffect } from "react";
import * as pdfjs from "pdfjs-dist";

interface PageThumbnailSidebarProps {
    file?: File | string | null;
    currentPage: number;
    totalPages?: number;
    onSelectPage: (page: number) => void;
}

/* Sub-component to render an individual thumbnail canvas */
const ThumbnailCard: React.FC<{
    pdfDoc: pdfjs.PDFDocumentProxy | null;
    imageUrl: string | null;
    pageNumber: number;
}> = ({ pdfDoc, imageUrl, pageNumber }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!pdfDoc || !canvasRef.current) return;

        let isCancelled = false;
        let renderTask: any = null;

        const renderThumb = async () => {
            try {
                const page = await pdfDoc.getPage(pageNumber);
                if (isCancelled) return;

                const canvas = canvasRef.current;
                if (!canvas) return;

                const context = canvas.getContext("2d");
                if (!context) return;

                // Render at 2x thumbnail scale for sharp crisp text on high-DPI screens
                const unscaledViewport = page.getViewport({ scale: 1.0, rotation: 0 });
                const targetWidth = 160;
                const scale = targetWidth / unscaledViewport.width;
                const viewport = page.getViewport({ scale, rotation: 0 });

                canvas.width = viewport.width;
                canvas.height = viewport.height;

                renderTask = page.render({
                    canvasContext: context,
                    viewport,
                } as any);

                await renderTask.promise;
            } catch (err: any) {
                if (err?.name !== "RenderingCancelledException") {
                    console.error("Thumbnail render error:", err);
                }
            }
        };

        renderThumb();

        return () => {
            isCancelled = true;
            if (renderTask) {
                renderTask.cancel();
            }
        };
    }, [pdfDoc, pageNumber]);

    if (pdfDoc) {
        return (
            <canvas
                ref={canvasRef}
                className="w-[80px] h-[113px] object-cover bg-white rounded-[2px] shadow-md border border-black/10"
            />
        );
    }

    if (imageUrl) {
        return (
            <img
                src={imageUrl}
                alt={`Page ${pageNumber}`}
                className="w-[80px] h-[113px] object-cover bg-white rounded-[2px] shadow-md border border-black/10"
            />
        );
    }

    /* Skeleton Fallback */
    return (
        <div className="w-[80px] h-[113px] bg-white rounded-[2px] shadow-md flex flex-col justify-between p-2 overflow-hidden border border-black/10">
            <div className="space-y-1">
                <div className="w-1/2 h-1 bg-black/15 rounded" />
                <div className="w-full h-1 bg-black/10 rounded" />
                <div className="w-full h-1 bg-black/10 rounded" />
                <div className="w-3/4 h-1 bg-black/10 rounded" />
            </div>
            <div className="w-full text-center text-[7px] text-black/20 font-sans border-t border-black/5 pt-1">
                {pageNumber}
            </div>
        </div>
    );
};

export const PageThumbnailSidebar: React.FC<PageThumbnailSidebarProps> = ({
    file,
    currentPage,
    totalPages = 1,
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
            if (file.endsWith(".pdf") || file.includes("application/pdf")) {
                pdfjs.getDocument(file).promise.then(setPdfDoc).catch(console.error);
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
                    const doc = await pdfjs.getDocument({ data: typedArray }).promise;
                    setPdfDoc(doc);
                } catch (err) {
                    console.error("Sidebar PDF load error:", err);
                }
            };
            reader.readAsArrayBuffer(file);
        }
    }, [file]);

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <aside className="w-[180px] h-full bg-[#1A1A1A] border-r border-[#373737] p-4 flex flex-col gap-4 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#373737] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#505050]">
            <h2 className="font-sans font-medium text-xs text-white/70 uppercase tracking-wider mb-1">
                Pages ({totalPages})
            </h2>

            <div className="flex flex-col gap-3">
                {pages.map((page) => {
                    const isActive = page === currentPage;

                    return (
                        <button
                            key={page}
                            onClick={() => onSelectPage(page)}
                            className={`
                group relative flex flex-col items-center gap-1.5 p-2 rounded-[12px] transition-all duration-150 cursor-pointer
                ${isActive
                                    ? "bg-[#3C70F2]/10 ring-2 ring-[#3C70F2]"
                                    : "hover:bg-white/5 opacity-70 hover:opacity-100"
                                }
              `}
                        >
                            <ThumbnailCard
                                pdfDoc={pdfDoc}
                                imageUrl={imageUrl}
                                pageNumber={page}
                            />

                            <span
                                className={`font-sans text-xs ${isActive ? "text-[#3C70F2] font-semibold" : "text-white/60"
                                    }`}
                            >
                                {page}
                            </span>
                        </button>
                    );
                })}
            </div>
        </aside>
    );
};