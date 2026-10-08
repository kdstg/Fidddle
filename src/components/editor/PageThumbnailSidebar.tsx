/* src/components/editor/PageThumbnailSidebar.tsx */
import React from "react";

interface PageThumbnailSidebarProps {
    currentPage: number;
    totalPages?: number;
    onSelectPage: (page: number) => void;
}

export const PageThumbnailSidebar: React.FC<PageThumbnailSidebarProps> = ({
    currentPage,
    totalPages = 1,
    onSelectPage,
}) => {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <aside className="w-[180px] h-full bg-[#1A1A1A] border-r border-[#373737] p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
            <h2 className="font-sans font-medium text-sm text-white/70 uppercase tracking-wider mb-2">
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
                            {/* Paper Thumbnail Box */}
                            <div className="w-[80px] h-[113px] bg-white rounded-[2px] shadow-md flex flex-col justify-between p-2 overflow-hidden border border-black/10">
                                <div className="space-y-1">
                                    <div className="w-1/2 h-1 bg-black/15 rounded" />
                                    <div className="w-full h-1 bg-black/10 rounded" />
                                    <div className="w-full h-1 bg-black/10 rounded" />
                                    <div className="w-3/4 h-1 bg-black/10 rounded" />
                                </div>
                                <div className="w-full text-center text-[7px] text-black/20 font-sans border-t border-black/5 pt-1">
                                    {page}
                                </div>
                            </div>

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