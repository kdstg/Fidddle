"use client";

import React, { useState } from "react";
import { LandingPage } from "@/components/landing/LandingPage";
import { SenderWorkspace } from "@/components/editor/SenderWorkspace";
import { RecipientWorkspace } from "@/components/editor/RecipientWorkspace";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#202020]">
      <LandingPage
        onFileSelect={(selectedFile) => setFile(selectedFile)}
        onLearnMore={() => console.log("Learn More clicked")}
      />

      {file && (
        <RecipientWorkspace
          file={file} // <-- Passes the actual uploaded PDF/image file
          documentName={file.name}
          senderName="Alex Rivera"
          senderCompany="Acme Corp"
          fields={[
            { id: "sig-1", page: 1, x: 25, y: 65, isSigned: false },
            { id: "sig-2", page: 1, x: 55, y: 65, isSigned: false },
          ]}
          onClose={() => setFile(null)}
          onConfirm={() => {
            alert("Document submitted!");
            setFile(null);
          }}
        />
      )}
    </main>
  );
}