"use client";

import React, { useState } from "react";
import { LandingPage } from "@/components/landing/LandingPage";
import { SenderWorkspace } from "@/components/editor/SenderWorkspace";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);

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

      // Support both property names to prevent any mismatch bugs
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

      alert(`Success! Real signing link generated:\nlocalhost:3000${docData.signingUrl}`);
      window.location.href = docData.signingUrl;
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

      {file && (
        <SenderWorkspace
          file={file}
          documentName={file.name}
          onClose={() => setFile(null)}
          onConfirm={handleConfirmDocument}
        />
      )}
    </main>
  );
}