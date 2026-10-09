/* src/components/editor/DemoRunner.tsx */
import React, { useState, useRef } from "react";
import Image from "next/image";
import { SenderWorkspace } from "./SenderWorkspace";
import { RecipientWorkspace } from "./RecipientWorkspace";
import { SignatureField } from "./DocumentCanvas";

type DemoStep = "upload" | "sender" | "recipient" | "completed";

export const DemoRunner: React.FC = () => {
    const [step, setStep] = useState<DemoStep>("upload");
    const [docFile, setDocFile] = useState<File | string | null>(null);
    const [docName, setDocName] = useState<string>("Contract-Agreement-2026.pdf");
    const [placedFields, setPlacedFields] = useState<SignatureField[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (file: File) => {
        setDocFile(file);
        setDocName(file.name);
        setStep("sender");
    };

    const handleUseSampleDoc = () => {
        setDocFile(null);
        setDocName("Sample-Document.pdf");
        setStep("sender");
    };

    const handleSenderConfirm = (fields: SignatureField[]) => {
        if (fields.length === 0) {
            alert("Please add at least one signature block before confirming.");
            return;
        }
        setPlacedFields(fields);
        setStep("recipient");
    };

    const handleRecipientComplete = (signedFields: SignatureField[]) => {
        setPlacedFields(signedFields);
        setStep("completed");
    };

    const handleClearSignatureMemory = () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("kds_saved_user_signature");
            alert("Cleared saved signature from localStorage!");
        }
    };

    return (
        <div className="w-full h-screen bg-[#141414] text-white flex flex-col items-center justify-center relative overflow-hidden select-none font-sans">
            {/* Top Bar Controls */}
            <div className="absolute top-4 left-6 z-50 flex items-center gap-3 bg-[#202020]/90 border border-[#373737] backdrop-blur-md px-4 py-2 rounded-full shadow-lg">
                <span className="text-xs font-mono text-white/50 uppercase tracking-widest">
                    Mode:
                </span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setStep("upload")}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer ${step === "upload"
                            ? "bg-[#3C70F2] text-white"
                            : "bg-white/10 text-white/60 hover:text-white"
                            }`}
                    >
                        0. Select Doc
                    </button>
                    <button
                        onClick={() => docFile && setStep("sender")}
                        disabled={!docFile && step === "upload"}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${step === "sender"
                            ? "bg-[#3C70F2] text-white"
                            : "bg-white/10 text-white/60 disabled:opacity-30 disabled:cursor-not-allowed"
                            }`}
                    >
                        1. Sender
                    </button>
                    <button
                        onClick={() => placedFields.length > 0 && setStep("recipient")}
                        disabled={placedFields.length === 0}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${step === "recipient"
                            ? "bg-[#3C70F2] text-white"
                            : "bg-white/10 text-white/60 disabled:opacity-30 disabled:cursor-not-allowed"
                            }`}
                    >
                        2. Recipient
                    </button>
                </div>

                <div className="h-4 w-[1px] bg-[#373737] mx-1" />

                <button
                    onClick={handleClearSignatureMemory}
                    className="text-xs text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                    Clear Sig Storage
                </button>
            </div>

            {/* Dropzone Upload */}
            {step === "upload" && (
                <div className="relative w-[520px] bg-[#1D1D1D] border border-[#373737] rounded-[24px] p-8 flex flex-col items-center text-center shadow-2xl space-y-6">
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="application/pdf, image/png, image/jpeg, image/webp"
                        className="hidden"
                        onChange={(e) => {
                            if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
                        }}
                    />

                    <div className="space-y-2">
                        <h2 className="font-sans font-medium text-[22px] text-white tracking-tight">
                            Start Demo Run
                        </h2>
                        <p className="font-sans font-light text-[14px] text-white/60">
                            Upload a document to test field placement and signature execution.
                        </p>
                    </div>

                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            if (e.dataTransfer.files?.[0]) {
                                handleFileChange(e.dataTransfer.files[0]);
                            }
                        }}
                        className="w-full h-[180px] border-2 border-dashed border-[#373737] hover:border-[#3C70F2] rounded-[16px] bg-[#202020] flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors p-6 group"
                    >
                        <div className="w-12 h-12 rounded-full bg-[#1D1D1D] border border-[#373737] flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Image
                                src="/icon-upload.svg"
                                alt="Upload"
                                width={20}
                                height={20}
                                className="opacity-70 group-hover:opacity-100"
                            />
                        </div>
                        <div className="space-y-1">
                            <span className="font-sans font-medium text-[15px] text-white block">
                                Click or drag & drop a file
                            </span>
                            <span className="font-sans font-light text-[12px] text-white/40 block">
                                Supports PDF, PNG, JPG, or WebP
                            </span>
                        </div>
                    </div>

                    <div className="w-full flex items-center gap-3">
                        <div className="h-[1px] flex-1 bg-[#373737]/60" />
                        <span className="text-xs text-white/40 uppercase tracking-widest font-mono">
                            or
                        </span>
                        <div className="h-[1px] flex-1 bg-[#373737]/60" />
                    </div>

                    <button
                        onClick={handleUseSampleDoc}
                        className="w-full h-[48px] bg-[#252525] border border-[#373737] hover:bg-[#303030] rounded-full text-white font-sans font-medium text-[15px] transition-all cursor-pointer active:scale-95"
                    >
                        Use Sample Blank Canvas
                    </button>
                </div>
            )}

            {/* Step 1: Sender Workspace */}
            {step === "sender" && (
                <SenderWorkspace
                    file={docFile}
                    documentName={docName}
                    initialFields={placedFields}
                    onConfirm={handleSenderConfirm}
                    onClose={() => setStep("upload")}
                />
            )}

            {/* Step 2: Recipient Workspace */}
            {step === "recipient" && (
                <RecipientWorkspace
                    file={docFile}
                    documentName={docName}
                    senderName="Alex Rivera"
                    senderCompany="Acme Corp"
                    initialFields={placedFields}
                    onCompleteDocument={handleRecipientComplete}
                    onClose={() => setStep("sender")}
                />
            )}

            {/* Step 3: Completed Screen */}
            {step === "completed" && (
                <div className="relative w-[480px] bg-[#1D1D1D] border border-[#373737] rounded-[24px] p-8 flex flex-col items-center text-center shadow-2xl space-y-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
                        <Image src="/icon-tick.svg" alt="Success" width={28} height={28} />
                    </div>

                    <div className="space-y-2">
                        <h2 className="font-sans font-medium text-[22px] text-white tracking-tight">
                            Document Fully Executed!
                        </h2>
                        <p className="font-sans font-light text-[14px] text-white/60">
                            All signature blocks have been captured and saved.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full pt-2">
                        <button
                            onClick={() => setStep("upload")}
                            className="flex-1 h-[48px] bg-[#252525] border border-[#373737] hover:bg-[#303030] rounded-full text-white font-sans font-medium text-[15px] transition-all cursor-pointer active:scale-95"
                        >
                            Upload New Doc
                        </button>
                        <button
                            onClick={() => setStep("recipient")}
                            className="flex-1 h-[48px] bg-[#3C70F2] hover:bg-[#3C70F2]/90 rounded-full text-white font-sans font-medium text-[15px] transition-all cursor-pointer active:scale-95"
                        >
                            Back to Recipient
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};