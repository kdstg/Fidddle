import React from "react";

interface PageThumbnailSidebarProps {
    totalPages?: number;
    currentPage: number;
    onSelectPage: (page: number) => void;
}

export const PageThumbnailSidebar: React.FC<PageThumbnailSidebarProps> = ({
    totalPages = 2,
    currentPage,
    onSelectPage,
}) => {
    return (
        <aside className="w-[242.4px] h-full bg-[#1D1D1D] border-r border-[#373737] flex flex-col p-6 shrink-0 select-none">
            <h2 className="font-sans font-normal text-[20px] text-white mb-6">Pages</h2>

            <div className="flex flex-col gap-6 items-center overflow-y-auto">
                {Array.from({ length: totalPages }, (_, idx) => {
                    const pageNum = idx + 1;
                    const isActive = currentPage === pageNum;

                    return (
                        <div
                            key={pageNum}
                            onClick={() => onSelectPage(pageNum)}
                            className="flex flex-col items-center gap-2 cursor-pointer group"
                        >
                            <div
                                className={`
                  w-[80px] h-[107px] bg-[#2A2A2A] rounded-[4px] overflow-hidden
                  transition-all duration-150 flex items-center justify-center text-xs text-white/40
                  ${isActive
                                        ? "border-[4px] border-[#3A8CFF] shadow-md shadow-[#3A8CFF]/20"
                                        : "border border-white/10 group-hover:border-white/30"
                                    }
                `}
                            >
                                {/* PDF Page Thumbnail Placeholder */}
                                <div className="w-full h-full bg-white p-1.5 flex flex-col gap-1">
                                    <div className="w-2/3 h-1 bg-black/30 rounded-xs" />
                                    <div className="w-full h-1 bg-black/15 rounded-xs" />
                                    <div className="w-4/5 h-1 bg-black/15 rounded-xs" />
                                    <div className="w-full h-10 bg-black/5 rounded-xs mt-1" />
                                </div>
                            </div>

                            <span className="font-sans font-normal text-[20px] text-white/80">
                                {pageNum}
                            </span>
                        </div>
                    );
                })}
            </div>
        </aside>
    );
};