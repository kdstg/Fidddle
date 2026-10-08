"use client";

import React, { useState } from "react";
import { LandingPage } from "@/components/landing/LandingPage";
import { RecipientWorkspace } from "@/components/editor/RecipientWorkspace";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);

  const handleClose = () => {
    setFile(null);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#202020]">
      <LandingPage
        onFileSelect={(selectedFile) => setFile(selectedFile)}
        onLearnMore={() => console.log("Learn More clicked")}
      />

      {file && (
        <RecipientWorkspace
          documentName={file.name}
          onClose={handleClose}
          onConfirm={handleClose}
        />
      )}
    </main>
  );
}