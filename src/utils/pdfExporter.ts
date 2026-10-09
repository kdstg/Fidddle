/* src/utils/pdfExporter.ts */
import { PDFDocument } from "pdf-lib";
import { SignatureField } from "@/components/editor/DocumentCanvas";

export async function exportSignedPdf(
    file: File | string | null,
    fields: SignatureField[],
    outputFilename: string = "Executed-Document.pdf"
): Promise<Uint8Array | null> {
    if (!file) {
        alert("No document file available to export.");
        return null;
    }

    try {
        let pdfBytes: ArrayBuffer;

        if (typeof file === "string") {
            const response = await fetch(file);
            pdfBytes = await response.arrayBuffer();
        } else {
            pdfBytes = await file.arrayBuffer();
        }

        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();

        for (const field of fields) {
            if (!field.isSigned || !field.signatureValue) continue;

            const pageIndex = field.page - 1;
            if (pageIndex < 0 || pageIndex >= pages.length) continue;

            const page = pages[pageIndex];
            const { width: pageW, height: pageH } = page.getSize();

            /* Convert percentage math to PDF native points */
            const imgWidth = (field.width / 100) * pageW;
            const imgHeight = (field.height / 100) * pageH;
            const imgX = (field.x / 100) * pageW;
            /* Invert Y coordinate for PDF bottom-left origin */
            const imgY = pageH - (field.y / 100) * pageH - imgHeight;

            /* Embed transparent PNG signature onto PDF canvas */
            const pngImage = await pdfDoc.embedPng(field.signatureValue);
            page.drawImage(pngImage, {
                x: imgX,
                y: imgY,
                width: imgWidth,
                height: imgHeight,
            });
        }

        const modifiedPdfBytes = await pdfDoc.save();

        /* Trigger browser download link */
        const blob = new Blob([modifiedPdfBytes], { type: "application/pdf" });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = outputFilename.toLowerCase().endsWith(".pdf")
            ? outputFilename
            : `${outputFilename}.pdf`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);

        return modifiedPdfBytes;
    } catch (err) {
        console.error("PDF Export Error:", err);
        alert("Failed to export signed PDF. Check console for details.");
        return null;
    }
}