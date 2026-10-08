/* src/components/editor/RecipientWorkspace.tsx */
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { IconButton } from "@/components/ui/IconButton";
import { ConfirmCheckButton } from "@/components/ui/ConfirmCheckButton";
import { PageThumbnailSidebar } from "./PageThumbnailSidebar";
import { DocumentCanvas, SignatureField } from "./DocumentCanvas";
import { SignatureCaptureModal } from "./SignatureCaptureModal";

interface RecipientWorkspaceProps {
    file?: File | string | null;
    documentName?: string;
    senderName?: string;
    senderCompany?: string;
    initialFields?: SignatureField[];
    onCompleteDocument?: (signedFields: SignatureField[]) => void;
    onClose?: () => void;
}

const LOCAL_STORAGE_SIG_KEY = "kds_saved_user_signature";

export const RecipientWorkspace: React.FC<RecipientWorkspaceProps> = ({
    file,
    documentName = "Contract-Agreement-2026.pdf",
    senderName = "Alex Rivera",
    senderCompany = "Acme Corp",
    initialFields = [],
    onCompleteDocument,
    onClose,
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [zoomLevel, setZoomLevel] = useState(100);
    const [fields, setFields] = useState<SignatureField[]>(initialFields);
    const [activeFieldIndex, setActiveFieldIndex] = useState<number | null>(null);

    /* Modal & Signature Memory States */
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [targetFieldId, setTargetFieldId] = useState<string | null>(null);
    const [savedSignature, setSavedSignature] = useState<string | null>(null);

    /* Safe Client-Side Local Storage Retrieval */
    useEffect(() => {
        if (typeof window !== "undefined") {
            const storedSig = localStorage.getItem(LOCAL_STORAGE_SIG_KEY);
            if (storedSig) {
                setSavedSignature(storedSig);
            }
        }
    }, []);

    /* Progress Metrics */
    const totalBlocks = fields.length;
    const completedBlocks = fields.filter((f) => f.isSigned).length;
    const isDocumentFullySigned = totalBlocks > 0 && completedBlocks === totalBlocks;

    /* Handle Clicking a Signature Field on Document */
    const handleSignFieldClick = (fieldId: string) => {
        const targetField = fields.find((f) => f.id === fieldId);
        if (!targetField) return;

        setTargetFieldId(fieldId);

        // If block is already signed, allow replacing/re-signing
        if (targetField.isSigned) {
            if (savedSignature) {
                applySignatureToField(fieldId, savedSignature);
            } else {
                setIsModalOpen(true);
            }
            return;
        }

        // Logic: If user has a saved signature in memory, apply it immediately.
        // If NO signature in memory, pop modal directly.
        if (savedSignature) {
            applySignatureToField(fieldId, savedSignature);
        } else {
            setIsModalOpen(true);
        }
    };

    /* Apply Signature Data URL to specific field */
    const applySignatureToField = (fieldId: string, sigDataUrl: string) => {
        setFields((prevFields) =>
            prevFields.map((f) =>
                f.id === fieldId
                    ? { ...f, isSigned: true, signatureValue: sigDataUrl }
                    : f
            )
        );

        // Optional: Prompt if remaining unsigned blocks exist
        const remainingUnsigned = fields.filter(
            (f) => f.id !== fieldId && !f.isSigned
        );
        if (remainingUnsigned.length > 0) {
            // We can trigger your future "Fill all signature blocks?" prompt here!
        }
    };

    /* Modal Save Handler */
    const handleSaveModalSignature = (sigDataUrl: string) => {
        // 1. Save to local memory
        if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_SIG_KEY, sigDataUrl);
        }
        setSavedSignature(sigDataUrl);

        // 2. Apply to targeted field
        if (targetFieldId) {
            applySignatureToField(targetFieldId, sigDataUrl);
        }
    };

    /* Zoom Handlers */
    const handleZoomOut = () => setZoomLevel((prev) => Math.max(50, prev - 10));
    const handleZoomIn = () => setZoomLevel((prev) => Math.min(200, prev + 10));

    /* Block Navigation */
    const handlePrevBlock = () => {
        if (fields.length === 0) return;
        const nextIdx =
            activeFieldIndex === null || activeFieldIndex <= 0
                ? fields.length - 1
                : activeFieldIndex - 1;
        setActiveFieldIndex(nextIdx);
        if (fields[nextIdx]) {
            setCurrentPage(fields[nextIdx].page);
        }
    };

    const handleNextBlock = () => {
        if (fields.length === 0) return;
        const nextIdx =
            activeFieldIndex === null || activeFieldIndex >= fields.length - 1
                ? 0
                : activeFieldIndex + 1;
        setActiveFieldIndex(nextIdx);
        if (fields[nextIdx]) {
            setCurrentPage(fields[nextIdx].page);
        }
    };

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-6 sm:p-8 select-none"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-[1214.4px] h-[703px] bg-[#202020] border border-[#373737] rounded-[24px] flex overflow-hidden shadow-2xl"
            >
                {/* Dynamic Thumbnail Sidebar */}
                <PageThumbnailSidebar
                    file={file}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onSelectPage={setCurrentPage}
                />

                {/* Main Workspace Area */}
                <div className="flex-1 h-full flex flex-col justify-between px-[40px] py-6 relative">
                    {/* Header */}
                    <header className="w-full grid grid-cols-[auto_1fr_auto] items-center gap-4 z-10">
                        {/* Zoom Controls */}
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

                        {/* Document Details */}
                        <div className="flex flex-col items-center justify-center text-center px-4 overflow-hidden">
                            <h1
                                className="font-sans font-normal text-[20px] text-white tracking-tight max-w-[480px] truncate"
                                title={documentName}
                            >
                                {documentName}
                            </h1>
                            <span className="font-sans font-light text-[14px] text-white/60 truncate">
                                Sent by {senderName} • {senderCompany}
                            </span>
                        </div>

                        {/* Close Button */}
                        <div className="flex items-center justify-end min-w-[140px]">
                            <IconButton
                                size="lg"
                                variant="solid"
                                onClick={onClose}
                                icon={
                                    <Image
                                        src="/icon-close.svg"
                                        alt="Close Workspace"
                                        width={20}
                                        height={20}
                                    />
                                }
                            />
                        </div>
                    </header>

                    {/* Document Viewport Canvas */}
                    <main className="relative flex-1 my-2 overflow-hidden">
                        <DocumentCanvas
                            mode="recipient"
                            file={file}
                            currentPage={currentPage}
                            zoomLevel={zoomLevel}
                            fields={fields}
                            activeFieldIndex={activeFieldIndex}
                            onFieldSelect={(idx) => setActiveFieldIndex(idx)}
                            onSignFieldClick={handleSignFieldClick}
                            onTotalPagesChange={(p) => setTotalPages(p)}
                        />

                        {/* POP-OVER SIGNATURE CAPTURE MODAL */}
                        <SignatureCaptureModal
                            isOpen={isModalOpen}
                            onClose={() => setIsModalOpen(false)}
                            onSave={handleSaveModalSignature}
                        />
                    </main>

                    {/* Bottom Bar Toolbar */}
                    <div className="w-full bg-[#202020] border border-[#373737] rounded-full px-6 py-2 flex items-center justify-between z-10 shadow-lg">
                        <div className="flex items-center gap-[24px]">
                            <span className="font-sans font-normal text-[20px] text-white whitespace-nowrap">
                                {completedBlocks} of {totalBlocks} completed
                            </span>

                            <div className="flex items-center gap-[16px]">
                                <IconButton
                                    size="lg"
                                    variant="solid"
                                    disabled={fields.length === 0}
                                    onClick={handlePrevBlock}
                                    icon={
                                        <Image
                                            src="/icon-arrow-left.svg"
                                            alt="Previous Block"
                                            width={24}
                                            height={24}
                                        />
                                    }
                                />
                                <IconButton
                                    size="lg"
                                    variant="solid"
                                    disabled={fields.length === 0}
                                    onClick={handleNextBlock}
                                    icon={
                                        <Image
                                            src="/icon-arrow-right.svg"
                                            alt="Next Block"
                                            width={24}
                                            height={24}
                                        />
                                    }
                                />
                            </div>
                        </div>

                        {/* Submit / Finish Document Button */}
                        <div className="flex items-center gap-[16px]">
                            <button
                                onClick={() => {
                                    if (fields.length > 0 && !fields[0].isSigned) {
                                        handleSignFieldClick(fields[0].id);
                                    }
                                }}
                                className="w-[140px] h-[56px] px-4 py-2 glass-button rounded-full text-white inline-flex items-center justify-center gap-2 font-sans font-medium text-[20px] cursor-pointer"
                            >
                                <Image
                                    src="/icon-sig-scrib.svg"
                                    alt=""
                                    width={24}
                                    height={24}
                                />
                                <span>Sign</span>
                            </button>

                            <ConfirmCheckButton
                                disabled={!isDocumentFullySigned}
                                onClick={() => onCompleteDocument && onCompleteDocument(fields)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};