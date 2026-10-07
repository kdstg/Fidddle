"use client";

import React, { useState } from "react";
import { LandingPage } from "@/components/landing/LandingPage";
import { DocumentWorkspace } from "@/components/editor/DocumentWorkspace";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
  };

  if (!file) {
    return (
      <LandingPage
        onFileSelect={handleFileSelect}
        onLearnMore={() => console.log("Learn More Clicked")}
      />
    );
  }

  return (
    <DocumentWorkspace
      documentName={file.name}
      onAddSignatureBlock={() => {
        console.log("Add signature block clicked");
      }}
      onConfirm={() => {
        // Clear file to return to landing page
        setFile(null);
      }}
    />
  );
}