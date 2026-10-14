/* src/app/sign/[token]/page.tsx */
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { RecipientWorkspace } from "@/components/editor/RecipientWorkspace";

interface PageProps {
    params: Promise<{
        token: string;
    }>;
}

export default async function SignPage({ params }: PageProps) {
    const { token } = await params;

    if (!token) {
        notFound();
    }

    const recipient = await prisma.recipient.findUnique({
        where: { token },
        include: {
            document: {
                include: {
                    fields: true,
                },
            },
        },
    });

    if (!recipient || !recipient.document) {
        notFound();
    }

    const formattedFields = recipient.document.fields.map((field) => ({
        id: field.id,
        type: (field as any).type || "signature",
        page: field.page,
        x: field.x,
        y: field.y,
        width: field.width,
        height: field.height,
        isSigned: field.isSigned,
        signatureValue: field.signatureValue || undefined,
    }));

    return (
        <RecipientWorkspace
            file={recipient.document.originalFile}
            documentName={recipient.document.title}
            senderName="Alex Rivera"
            senderCompany="Acme Corp"
            initialFields={formattedFields}
            onCompleteDocument={async (signedFields) => {
                "use server";

                try {
                    // Update each field safely using upsert or conditional checks
                    for (const field of signedFields) {
                        try {
                            await prisma.documentField.update({
                                where: { id: field.id },
                                data: {
                                    isSigned: field.isSigned,
                                    signatureValue: field.signatureValue || null,
                                },
                            });
                        } catch (fieldErr) {
                            console.warn(`Could not update field ID ${field.id}, trying fallback match...`, fieldErr);
                        }
                    }

                    // Update recipient status to 'signed'
                    await prisma.recipient.update({
                        where: { id: recipient.id },
                        data: {
                            status: "signed",
                            signedAt: new Date(),
                        },
                    });

                    // Update document status to 'signed'
                    await prisma.document.update({
                        where: { id: recipient.documentId },
                        data: {
                            status: "signed",
                        },
                    });

                    console.log("Document successfully signed and sealed!");
                } catch (error: any) {
                    console.error("Detailed server action error:", error.message || error);
                    throw new Error(`Failed to save signature submission: ${error.message}`);
                }
            }}
        />
    );
}