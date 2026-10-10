/* src/app/api/documents/sign/[token]/route.ts */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* GET: Fetch document & field layout using recipient token */
export async function GET(
    req: Request,
    { params }: { params: { token: string } }
) {
    try {
        const recipient = await prisma.recipient.findUnique({
            where: { token: params.token },
            include: {
                document: {
                    include: {
                        fields: true,
                    },
                },
            },
        });

        if (!recipient) {
            return NextResponse.json(
                { error: "Invalid or expired signing link" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            documentName: recipient.document.title,
            fileUrl: recipient.document.completedFile || recipient.document.originalFile,
            isCompleted: recipient.document.status === "COMPLETED",
            recipient: {
                name: recipient.name,
                email: recipient.email,
                status: recipient.status,
            },
            fields: recipient.document.fields,
        });
    } catch (error) {
        console.error("Error fetching signing payload:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/* POST: Save captured signatures & mark document as COMPLETED */
export async function POST(
    req: Request,
    { params }: { params: { token: string } }
) {
    try {
        const body = await req.json();
        const { signedFields, completedFileUrl } = body;

        const recipient = await prisma.recipient.findUnique({
            where: { token: params.token },
        });

        if (!recipient) {
            return NextResponse.json({ error: "Invalid recipient token" }, { status: 404 });
        }

        /* Update each signed field record */
        if (signedFields && Array.isArray(signedFields)) {
            for (const field of signedFields) {
                if (field.isSigned && field.signatureValue) {
                    await prisma.signatureField.update({
                        where: { id: field.id },
                        data: {
                            isSigned: true,
                            signatureValue: field.signatureValue,
                        },
                    });
                }
            }
        }

        /* Update Recipient status */
        await prisma.recipient.update({
            where: { id: recipient.id },
            data: {
                status: "SIGNED",
                signedAt: new Date(),
            },
        });

        /* Mark Document as COMPLETED */
        await prisma.document.update({
            where: { id: recipient.documentId },
            data: {
                status: "COMPLETED",
                completedFile: completedFileUrl || undefined,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Document successfully signed and updated.",
        });
    } catch (error) {
        console.error("Error submitting signatures:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}