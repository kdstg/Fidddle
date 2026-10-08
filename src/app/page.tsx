"use client";

import React, { useState } from "react";
import { LandingPage } from "@/components/landing/LandingPage";
import { SenderWorkspace } from "@/components/editor/SenderWorkspace";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);

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
          onConfirm={(fields) => {
            console.log("Document ready with fields:", fields);
            alert("Document prepared successfully!");
          }}
        />
      )}
    </main>
  );
}