"use client";

import React, { useState } from "react";
import { LandingPage } from "@/components/landing/LandingPage";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  return (
    <main className="w-screen h-screen overflow-hidden bg-[#202020]">
      {!selectedFile ? (
        <LandingPage
          onFileSelect={(file) => {
            console.log("PDF File Loaded:", file.name);
            setSelectedFile(file);
          }}
          onLearnMore={() => console.log("Learn More Triggered")}
          onImportUrl={() => console.log("Import URL Triggered")}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-white font-sans gap-4 bg-[#202020]">
          <h2 className="text-xl font-semibold">Studio Canvas View</h2>
          <p className="text-sm text-white/60">Active Document: {selectedFile.name}</p>
          <button
            onClick={() => setSelectedFile(null)}
            className="px-4 py-2 rounded-full bg-[#1D1D1D] border-[0.5px] border-[#373737] text-xs hover:bg-[#252525] transition-colors"
          >
            ← Back to Landing
          </button>
        </div>
      )}
    </main>
  );
}