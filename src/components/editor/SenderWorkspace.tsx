import React, { useState } from "react";
import Image from "next/image";
import { IconButton } from "@/components/ui/IconButton";
import { ConfirmCheckButton } from "@/components/ui/ConfirmCheckButton";
import { PageThumbnailSidebar } from "./PageThumbnailSidebar";
import { DocumentCanvas, SignatureField } from "./DocumentCanvas";

interface Collaborator {
    id: string;
    name: string;
    avatarUrl?: string;
}

interface SenderWorkspaceProps {
    documentName?: string;
    collaborators?: Collaborator[];
    initialFields?: SignatureField[];
    onConfirm?: (fields: SignatureField[]) => void;
    onClose?: () => void;
}

export const SenderWorkspace: React.FC<SenderWorkspaceProps> = ({
    documentName = "Contract-Agreement-2026.pdf",
    collaborators = [],
    initialFields = [],
    onConfirm,
    onClose,
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [zoomLevel, setZoomLevel] = useState(100);
    const [fields, setFields] = useState<SignatureField[]>(initialFields);
    const [activeFieldIndex, setActiveFieldIndex] = useState<number | null>(null);

    /* Zoom Handlers */
    const handleZoomOut = () => setZoomLevel((prev) => Math.max(50, prev - 10));
    const handleZoomIn = () => setZoomLevel((prev) => Math.min(200, prev + 10));

    /* Block Placement & Navigation */
    const handleAddBlock = () => {
        const newField: SignatureField = {
            id: `field-${Date.now()}`,
            page: currentPage,
            x: 32,
            y: 65,
            label: `Signature ${fields.length + 1}`,
            isSigned: false,
        };

        const nextFields = [...fields, newField];
        setFields(nextFields);
        setActiveFieldIndex(nextFields.length - 1);
    };

    const handlePrevBlock = () => {
        if (fields.length === 0) return;
        setActiveFieldIndex((prev) =>
            prev === null || prev <= 0 ? fields.length - 1 : prev - 1
        );
    };

    const handleNextBlock = () => {
        if (fields.length === 0) return;
        setActiveFieldIndex((prev) =>
            prev === null || prev >= fields.length - 1 ? 0 : prev + 1
        );
    };

    /* Sync current canvas page with selected block */
    const handleSelectField = (index: number) => {
        setActiveFieldIndex(index);
        if (fields[index]) {
            setCurrentPage(fields[index].page);
        }
    };

    /* Backdrop Dismiss */
    const handleBackdropPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && onClose) {
            e.stopPropagation();
            e.preventDefault();
            onClose();
        }
    };

    return (
        <div
            onPointerDown={handleBackdropPointerDown}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-6 sm:p-8 select-none cursor-pointer"
        >
            <div
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="relative w-[1214.4px] h-[703px] bg-[#202020] border border-[#373737] rounded-[24px] flex overflow-hidden shadow-2xl cursor-default"
            >
                <PageThumbnailSidebar
                    currentPage={currentPage}
                    onSelectPage={setCurrentPage}
                />

                <div className="flex-1 h-full flex flex-col justify-between px-[40px] py-6 relative">
                    {/* Header */}
                    <header className="w-full grid grid-cols-[auto_1fr_auto] items-center gap-4 z-10">
                        <div className="flex items-center gap-3 shrink-0">
                            <IconButton
                                size="lg"
                                variant="solid"
                                onClick={handleZoomOut}
                                icon={
                                    <Image
                                        src="/icon-minus.svg"
                                        alt="Zoom Out"
                                        width={24}
                                        height={24}
                                    />
                                }
                            />
                            <span className="font-sans font-normal text-[20px] text-white min-w-[55px] text-center">
                                {zoomLevel}%
                            </span>
                            <IconButton
                                size="lg"
                                variant="solid"
                                onClick={handleZoomIn}
                                icon={
                                    <Image
                                        src="/icon-plus.svg"
                                        alt="Zoom In"
                                        width={24}
                                        height={24}
                                    />
                                }
                            />
                        </div>

                        <div className="flex flex-col items-center justify-center text-center px-4 overflow-hidden">
                            <h1
                                className="font-sans font-normal text-[20px] text-white tracking-tight max-w-[480px] truncate"
                                title={documentName}
                            >
                                {documentName}
                            </h1>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 justify-end min-w-[140px]">
                            {collaborators.length > 0 && (
                                <div className="flex items-center -space-x-2">
                                    {collaborators.slice(0, 3).map((collab) => (
                                        <div
                                            key={collab.id}
                                            className="w-[40px] h-[40px] rounded-full border-2 border-[#202020] bg-blue-600 overflow-hidden flex items-center justify-center font-sans text-xs text-white"
                                        >
                                            {collab.name.charAt(0)}
                                        </div>
                                    ))}
                                    {collaborators.length > 3 && (
                                        <span className="pl-3 font-sans font-normal text-[20px] text-white/80">
                                            +{collaborators.length - 3}
                                        </span>
                                    )}
                                </div>
                            )}

                            <IconButton
                                size="lg"
                                variant="solid"
                                icon={
                                    <Image
                                        src="/icon-share.svg"
                                        alt="Share"
                                        width={24}
                                        height={24}
                                    />
                                }
                            />
                        </div>
                    </header>

                    {/* Canvas Viewport */}
                    <main className="relative flex-1 my-2 overflow-hidden">
                        <DocumentCanvas
                            mode="sender"
                            currentPage={currentPage}
                            zoomLevel={zoomLevel}
                            fields={fields}
                            activeFieldIndex={activeFieldIndex}
                            onFieldSelect={handleSelectField}
                            onFieldsChange={(updated) => setFields(updated)}
                        />
                    </main>

                    {/* Bottom Toolbar */}
                    <div className="w-full bg-[#202020] border border-[#373737] rounded-full px-4 py-2 flex items-center justify-between z-10 shadow-lg">
                        <div className="flex items-center gap-[24px]">
                            <span className="font-sans font-normal text-[20px] text-white whitespace-nowrap">
                                {fields.length} block{fields.length === 1 ? "" : "s"} added
                            </span>

                            <div className="flex items-center gap-[16px]">
                                <IconButton
                                    size="lg"
                                    variant="solid"
                                    disabled={fields.length === 0}
                                    icon={
                                        <Image
                                            src="/icon-arrow-left.svg"
                                            alt="Previous Block"
                                            width={24}
                                            height={24}
                                            className={fields.length === 0 ? "opacity-30" : "opacity-100"}
                                        />
                                    }
                                    onClick={handlePrevBlock}
                                />
                                <IconButton
                                    size="lg"
                                    variant="solid"
                                    disabled={fields.length === 0}
                                    icon={
                                        <Image
                                            src="/icon-arrow-right.svg"
                                            alt="Next Block"
                                            width={24}
                                            height={24}
                                            className={fields.length === 0 ? "opacity-30" : "opacity-100"}
                                        />
                                    }
                                    onClick={handleNextBlock}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-[16px]">
                            <button
                                onClick={handleAddBlock}
                                className="
                  glass-button
                  w-[259px] h-[56px] px-4 py-2
                  inline-flex items-center justify-center gap-3
                  rounded-full text-white
                  font-sans font-medium text-[20px] tracking-tight
                  active:scale-[0.98] cursor-pointer
                "
                            >
                                <Image
                                    src="/icon-sig-scrib.svg"
                                    alt=""
                                    width={24}
                                    height={24}
                                />
                                <span>Add Signature Block</span>
                            </button>

                            <ConfirmCheckButton onClick={() => onConfirm && onConfirm(fields)} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};