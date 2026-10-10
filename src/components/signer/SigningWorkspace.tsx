"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SigningWorkspace({ document, recipient, isAlreadySigned }: any) {
    const router = useRouter();
    const [signed, setSigned] = useState(isAlreadySigned);
    const [signatureData, setSignatureData] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSign = async () => {
        if (!signatureData) {
            alert("Please draw your signature before submitting.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/sign/${recipient.token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ signatureValue: signatureData }),
            });

            const data = await res.json();
            if (data.success) {
                setSigned(true);
                alert("Document successfully signed!");
                router.refresh();
            } else {
                alert(data.error || "Failed to submit signature");
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred during submission.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl flex flex-col gap-6">
            <div className="flex items-center justify-between bg-neutral-950 p-4 rounded-lg border border-neutral-800">
                <div>
                    <h2 className="text-lg font-semibold text-white">Review & Sign Agreement</h2>
                    <p className="text-sm text-neutral-400">Please review the document fields and provide your authorized signature.</p>
                </div>
                <div>
                    {signed ? (
                        <span className="px-3 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-sm font-medium">
                            Signed ✓
                        </span>
                    ) : (
                        <span className="px-3 py-1 rounded bg-amber-950 text-amber-400 border border-amber-800 text-sm font-medium">
                            Awaiting Signature
                        </span>
                    )}
                </div>
            </div>

            {/* Document Preview Box / Fields */}
            <div className="relative border border-neutral-800 bg-neutral-950 rounded-lg h-[400px] flex items-center justify-center overflow-hidden">
                <p className="text-neutral-500 text-sm">📄 Document Preview: {document.originalFile}</p>

                {/* Render Signature Field Overlays */}
                {document.fields.map((field: any) => (
                    <div
                        key={field.id}
                        style={{
                            left: `${field.x}%`,
                            top: `${field.y}%`,
                            width: `${field.width}%`,
                            height: `${field.height}%`,
                        }}
                        className="absolute border-2 border-dashed border-indigo-500 bg-indigo-500/10 rounded flex items-center justify-center text-xs text-indigo-300 font-semibold pointer-events-none"
                    >
                        {field.label} {field.isSigned && " (Signed)"}
                    </div>
                ))}
            </div>

            {/* Signature Input Action Area */}
            {!signed ? (
                <div className="flex flex-col gap-4">
                    <label className="text-sm font-medium text-neutral-300">Draw Your Signature (Base64 / Initial Pad):</label>
                    <input
                        type="text"
                        placeholder="Type your signature name or base64 data..."
                        value={signatureData}
                        onChange={(e) => setSignatureData(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                    <button
                        onClick={handleSign}
                        disabled={isSubmitting}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-lg transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                    >
                        {isSubmitting ? "Submitting Signature..." : "Submit & Sign Document"}
                    </button>
                </div>
            ) : (
                <div className="text-center py-4 text-neutral-400 text-sm">
                    You have already completed your signature for this document. You may close this tab.
                </div>
            )}
        </div>
    );
}