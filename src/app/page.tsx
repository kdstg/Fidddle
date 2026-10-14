"use client";

import React, { useState } from "react";
import { LandingPage } from "@/components/landing/LandingPage";
import { SenderWorkspace } from "@/components/editor/SenderWorkspace";
import { SignLinkModal } from "@/components/modals/SignLinkModal";
import { DocumentDetailModal } from "@/components/modals/DocumentDetailModal";
import { DocumentLog } from "@/types/document";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const [documents, setDocuments] = useState<DocumentLog[]>([]);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentLog | null>(null);

  const handleConfirmDocument = async (fields: any[]) => {
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) throw new Error(uploadData.error || "Failed to upload file");

      const fileUrl = uploadData.fileUrl || uploadData.document?.originalFile;

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

      const newLog: DocumentLog = {
        id: docData.documentId || crypto.randomUUID(),
        title: file.name,
        signingUrl: docData.signingUrl,
        status: "pending",
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " • " + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      };

      setDocuments((prev) => [newLog, ...prev]);
      setGeneratedUrl(docData.signingUrl);
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleRevokeDoc = (docId: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: "revoked" } : d))
    );
    setSelectedDoc(null);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#202020]">
      <LandingPage
        onFileSelect={(selectedFile) => setFile(selectedFile)}
        onLearnMore={() => console.log("Learn More clicked")}
        documents={documents}
        isActivityOpen={isActivityOpen}
        onToggleActivity={() => setIsActivityOpen(!isActivityOpen)}
        onSelectDoc={(doc) => {
          setSelectedDoc(doc);
          setIsActivityOpen(false);
        }}
      />

      {file && !generatedUrl && (
        <SenderWorkspace
          file={file}
          documentName={file.name}
          onClose={() => setFile(null)}
          onConfirm={handleConfirmDocument}
        />
      )}

      <SignLinkModal
        isOpen={!!generatedUrl}
        signingUrl={generatedUrl || ""}
        onClose={() => {
          setGeneratedUrl(null);
          setFile(null);
        }}
      />

      <DocumentDetailModal
        isOpen={!!selectedDoc}
        doc={selectedDoc}
        onClose={() => setSelectedDoc(null)}
        onRevoke={handleRevokeDoc}
        onPreview={(doc) => alert(`Previewing document: ${doc.title}`)}
        onDownload={(doc) => alert(`Downloading document: ${doc.title}`)}
      />
    </main>
  );
}