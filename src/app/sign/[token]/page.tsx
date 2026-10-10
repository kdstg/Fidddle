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

    // 1. Look up the recipient and include their document and fields
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

    // 2. Map database fields to the format expected by RecipientWorkspace
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
            file={recipient.document.originalFile} // <-- FIXED: Use originalFile from DB
            documentName={recipient.document.title}
            senderName="Alex Rivera"
            senderCompany="Acme Corp"
            initialFields={formattedFields}
            onCompleteDocument={async (signedFields) => {
                "use server";
                // Handle completing document submission and updating DB status
            }}
        />
    );
}