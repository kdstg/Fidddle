import React, { useState } from "react";
import Image from "next/image";
import { SenderWorkspace } from "./SenderWorkspace";
import { RecipientWorkspace } from "./RecipientWorkspace";
import { SignatureField } from "./DocumentCanvas";

type DemoStep = "sender" | "recipient" | "completed";

export const DemoRunner: React.FC = () => {
    const [step, setStep] = useState<DemoStep>("sender");
    const [docFile, setDocFile] = useState<File | string | null>(
        "/sample-contract.pdf" // Default fallback or null
    );
    const [placedFields, setPlacedFields] = useState<SignatureField[]>([]);

    /* Step 1 -> Step 2 Handoff */
    const handleSenderConfirm = (fields: SignatureField[]) => {
        if (fields.length === 0) {
            alert("Please add at least one signature block before confirming.");
            return;
        }
        setPlacedFields(fields);
        setStep("recipient");
    };

    /* Step 2 -> Step 3 Completion */
    const handleRecipientComplete = (signedFields: SignatureField[]) => {
        setPlacedFields(signedFields);
        setStep("completed");
    };

    /* Reset local state for fresh testing */
    const handleRestartDemo = () => {
        setPlacedFields([]);
        setStep("sender");
    };

    const handleClearSignatureMemory = () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("kds_saved_user_signature");
            alert("Cleared saved signature from localStorage!");
        }
    };

    return (
        <div className="w-full h-screen bg-[#141414] text-white flex flex-col items-center justify-center relative overflow-hidden select-none font-sans">
            {/* Top Testing Controls Bar */}
            <div className="absolute top-4 left-6 z-50 flex items-center gap-3 bg-[#202020]/90 border border-[#373737] backdrop-blur-md px-4 py-2 rounded-full shadow-lg">
                <span className="text-xs font-mono text-white/50 uppercase tracking-widest">
                    Mode:
                </span>
                <div className="flex items-center gap-2">
                    <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${step === "sender"
                                ? "bg-[#3C70F2] text-white"
                                : "bg-white/10 text-white/60"
                            }`}
                    >
                        1. Sender
                    </span>
                    <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${step === "recipient"
                                ? "bg-[#3C70F2] text-white"
                                : "bg-white/10 text-white/60"
                            }`}
                    >
                        2. Recipient
                    </span>
                    <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${step === "completed"
                                ? "bg-emerald-500 text-white"
                                : "bg-white/10 text-white/60"
                            }`}
                    >
                        3. Completed
                    </span>
                </div>

                <div className="h-4 w-[1px] bg-[#373737] mx-1" />

                <button
                    onClick={handleClearSignatureMemory}
                    className="text-xs text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                    Clear local storage sig
                </button>
            </div>

            {/* STEP 1: SENDER WORKSPACE */}
            {step === "sender" && (
                <SenderWorkspace
                    file={docFile}
                    documentName="Contract-Agreement-2026.pdf"
                    initialFields={placedFields}
                    onConfirm={handleSenderConfirm}
                    onClose={() => console.log("Close sender mode")}
                />
            )}

            {/* STEP 2: RECIPIENT WORKSPACE */}
            {step === "recipient" && (
                <RecipientWorkspace
                    file={docFile}
                    documentName="Contract-Agreement-2026.pdf"
                    senderName="Alex Rivera"
                    senderCompany="Acme Corp"
                    initialFields={placedFields}
                    onCompleteDocument={handleRecipientComplete}
                    onClose={() => setStep("sender")}
                />
            )}

            {/* STEP 3: COMPLETED SUCCESS SCREEN */}
            {step === "completed" && (
                <div className="relative w-[480px] bg-[#1D1D1D] border border-[#373737] rounded-[24px] p-8 flex flex-col items-center text-center shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
                        <Image
                            src="/icon-tick.svg"
                            alt="Success"
                            width={28}
                            height={28}
                        />
                    </div>

                    <div className="space-y-2">
                        <h2 className="font-sans font-medium text-[22px] text-white tracking-tight">
                            Document Fully Executed!
                        </h2>
                        <p className="font-sans font-light text-[14px] text-white/60">
                            All required signature blocks have been placed, captured, and verified.
                        </p>
                    </div>

                    <div className="w-full bg-[#202020] border border-[#373737] rounded-[16px] p-4 text-left space-y-2">
                        <div className="flex items-center justify-between text-xs text-white/60">
                            <span>Total Fields Signed:</span>
                            <span className="font-mono text-white font-medium">
                                {placedFields.length}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-white/60">
                            <span>Storage Key:</span>
                            <span className="font-mono text-emerald-400">
                                kds_saved_user_signature
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full pt-2">
                        <button
                            onClick={handleRestartDemo}
                            className="flex-1 h-[48px] bg-[#252525] border border-[#373737] hover:bg-[#303030] rounded-full text-white font-sans font-medium text-[15px] transition-all cursor-pointer active:scale-95"
                        >
                            Test Flow Again
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