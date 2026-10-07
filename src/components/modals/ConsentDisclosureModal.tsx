import React, { useState } from "react";
import { GlassContainer } from "@/components/ui/GlassContainer";
import { Button } from "@/components/ui/Button";
import {
    ShieldCheckIcon,
    Download01Icon,
    Cancel01Icon,
    ArrowRight01Icon,
    Tick02Icon,
    LockIcon,
} from "hugeicons-react";

interface ConsentDisclosureModalProps {
    isOpen: boolean;
    senderName?: string;
    senderCompany?: string;
    documentHash?: string;
    onProceed: () => void;
    onSaveOffline: () => void;
    onDecline: () => void;
}

export const ConsentDisclosureModal: React.FC<ConsentDisclosureModalProps> = ({
    isOpen,
    senderName = "Alex Rivera",
    senderCompany = "Acme Corp",
    documentHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    onProceed,
    onSaveOffline,
    onDecline,
}) => {
    const [hasConsented, setHasConsented] = useState(false);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in-0 duration-200">
            <GlassContainer
                variant="modal"
                className="w-full max-w-[540px] p-6 sm:p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-[#3C70F2]">
                        <ShieldCheckIcon size={20} />
                        <span className="text-xs font-sans font-semibold tracking-wider uppercase">
                            Legal Disclosure
                        </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-sans font-semibold text-white tracking-tight">
                        Electronic Signature & Record Consent
                    </h2>
                    <p className="text-xs sm:text-sm font-sans text-white/60">
                        Sent by <span className="text-white font-medium">{senderName}</span>{" "}
                        • {senderCompany}
                    </p>
                </div>

                {/* Legal Body & Consent Checkbox Box */}
                <div className="flex flex-col gap-4">
                    <p className="text-xs sm:text-sm font-sans text-white/80 leading-relaxed">
                        By proceeding, you agree to execute this document electronically under
                        the ESIGN Act and eIDAS regulations. Your signature, IP address, and
                        device metadata will be cryptographically bound to the audit log.
                    </p>

                    {/* Interactive Consent Toggle Card */}
                    <label
                        onClick={() => setHasConsented(!hasConsented)}
                        className={`
              flex items-start gap-3.5 p-4 rounded-[16px]
              border-[0.5px] cursor-pointer select-none transition-all duration-150
              ${hasConsented
                                ? "bg-[#3C70F2]/10 border-[#3C70F2] shadow-sm shadow-[#3C70F2]/20"
                                : "bg-black/20 border-[#373737] hover:border-white/30"
                            }
            `}
                    >
                        <div
                            className={`
                mt-0.5 w-5 h-5 rounded-[6px] shrink-0
                flex items-center justify-center
                border-[1.5px] transition-colors duration-150
                ${hasConsented
                                    ? "bg-[#3C70F2] border-[#3C70F2] text-white"
                                    : "border-white/40 bg-transparent"
                                }
              `}
                        >
                            {hasConsented && <Tick02Icon size={14} className="stroke-[3]" />}
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs sm:text-sm font-sans font-medium text-white">
                                I agree to use electronic records and signatures
                            </span>
                            <span className="text-[11px] font-sans text-white/50 leading-normal">
                                I understand that my digital consent is legally binding and
                                recorded in a tamper-evident audit log.
                            </span>
                        </div>
                    </label>
                </div>

                {/* Cryptographic SHA-256 Hash Identifier */}
                <div className="flex items-center gap-2 p-2.5 rounded-[10px] bg-black/30 border-[0.5px] border-[#373737]">
                    <LockIcon size={14} className="text-white/40 shrink-0" />
                    <span className="text-[11px] font-sans font-mono text-white/40 truncate">
                        SHA-256: {documentHash}
                    </span>
                </div>

                {/* Footer Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    {/* Left Action Group */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                        <Button
                            variant="cancel"
                            size="sm"
                            icon={<Cancel01Icon size={15} />}
                            onClick={onDecline}
                        >
                            Decline
                        </Button>
                        <Button
                            variant="glass"
                            size="sm"
                            icon={<Download01Icon size={15} />}
                            onClick={onSaveOffline}
                        >
                            Save Offline
                        </Button>
                    </div>

                    {/* Primary Proceed Action */}
                    <Button
                        variant="primary"
                        size="md"
                        disabled={!hasConsented}
                        icon={<ArrowRight01Icon size={16} />}
                        onClick={onProceed}
                        className="w-full sm:w-auto"
                    >
                        Proceed to Sign
                    </Button>
                </div>
            </GlassContainer>
        </div>
    );
};