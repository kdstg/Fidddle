/* src/app/api/documents/route.ts */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, originalFileUrl, recipientName, recipientEmail, fields } = body;

        if (!originalFileUrl || !recipientEmail) {
            return NextResponse.json(
                { error: "Missing required fields (originalFileUrl, recipientEmail)" },
                { status: 400 }
            );
        }

        const newDocument = await prisma.document.create({
            data: {
                title: title || "Untitled Document",
                originalFile: originalFileUrl,
                status: "PENDING",
                recipients: {
                    create: {
                        name: recipientName || "Signer",
                        email: recipientEmail,
                    },
                },
            },
            include: {
                recipients: true,
            },
        });

        const recipient = newDocument.recipients[0];

        /* Save signature field placement coordinates */
        if (fields && Array.isArray(fields)) {
            await prisma.signatureField.createMany({
                data: fields.map((f: any) => ({
                    documentId: newDocument.id,
                    recipientId: recipient.id,
                    page: f.page,
                    x: f.x,
                    y: f.y,
                    width: f.width,
                    height: f.height,
                    label: f.label || "Signature Line",
                })),
            });
        }

        return NextResponse.json({
            success: true,
            documentId: newDocument.id,
            signingToken: recipient.token,
            signingUrl: `/sign/${recipient.token}`,
        });
    } catch (error) {
        console.error("Failed to create document:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}