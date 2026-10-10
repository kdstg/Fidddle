"use client";

import React, { useState } from "react";
import { LandingPage } from "@/components/landing/LandingPage";
import { SenderWorkspace } from "@/components/editor/SenderWorkspace";
import { SignLinkModal } from "@/components/modals/SignLinkModal";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const handleConfirmDocument = async (fields: any[]) => {
    if (!file) return;

    try {
      // 1. Upload the physical file to the server first
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) throw new Error(uploadData.error || "Failed to upload file");

      const fileUrl = uploadData.fileUrl || uploadData.document?.originalFile;

      // 2. Save the document and fields with the real permanent file URL
      const docRes = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: file.name,
          originalFileUrl: fileUrl,
          recipientName: "Test Recipient",
          recipientEmail: "test@example.com",
          fields: fields,
        }),
      });

      const docData = await docRes.json();
      if (!docRes.ok) throw new Error(docData.error || "Failed to save document");

      // Instead of alert, open our custom generated link modal!
      setGeneratedUrl(docData.signingUrl);
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#202020]">
      <LandingPage
        onFileSelect={(selectedFile) => setFile(selectedFile)}
        onLearnMore={() => console.log("Learn More clicked")}
      />

      {file && !generatedUrl && (
        <SenderWorkspace
          file={file}
          documentName={file.name}
          onClose={() => setFile(null)}
          onConfirm={handleConfirmDocument}
        />
      )}

      {/* Generated Link Modal */}
      <SignLinkModal
        isOpen={!!generatedUrl}
        signingUrl={generatedUrl || ""}
        onClose={() => {
          setGeneratedUrl(null);
          setFile(null);
        }}
      />
    </main>
  );
}