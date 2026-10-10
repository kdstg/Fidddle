import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, originalFileUrl, recipientName, recipientEmail, fields } = body;

        // Validate incoming data
        if (!title || !recipientEmail || !fields) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Create document, recipient token, and signature fields in a transaction
        const document = await prisma.document.create({
            data: {
                title,
                originalFile: originalFileUrl || "/demo-sample.pdf",
                status: "PENDING",
                recipients: {
                    create: {
                        name: recipientName || "Recipient",
                        email: recipientEmail,
                        status: "WAITING",
                    },
                },
                fields: {
                    create: fields.map((f: any) => ({
                        page: f.page,
                        x: f.x,
                        y: f.y,
                        width: f.width,
                        height: f.height,
                        label: f.label || "Signature Line",
                        isSigned: false,
                    })),
                },
            },
            include: {
                recipients: true,
                fields: true,
            },
        });

        const recipient = document.recipients[0];

        return NextResponse.json({
            success: true,
            documentId: document.id,
            signingToken: recipient.token,
            signingUrl: `/sign/${recipient.token}`,
        });
    } catch (error: any) {
        console.error("Error creating document:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}