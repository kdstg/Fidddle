"use client";

import React, { useState } from "react";
import { LandingPage } from "@/components/landing/LandingPage";
import { DocumentWorkspace } from "@/components/editor/DocumentWorkspace";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#202020]">
      {/* Landing Page (Always active in background) */}
      <LandingPage
        onFileSelect={(selectedFile) => setFile(selectedFile)}
        onLearnMore={() => console.log("Learn More clicked")}
      />

      {/* Document Workspace (Blurred Overlay Modal) */}
      {file && (
        <DocumentWorkspace
          documentName={file.name}
          onConfirm={() => setFile(null)}
        />
      )}
    </main>
  );
}