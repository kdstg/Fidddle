/* src/app/sign/[token]/page.tsx */
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SigningWorkspace from "@/components/SigningWorkspace";

interface PageProps {
    params: {
        token: string;
    };
}

export default async function SignPage({ params }: PageProps) {
    const { token } = params;

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

    // 2. If token is invalid or document doesn't exist, show 404
    if (!recipient || !recipient.document) {
        notFound();
    }

    // 3. Check if already signed
    const isAlreadySigned = recipient.status === "SIGNED";

    return (
        <main className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-between p-6">
            <header className="w-full max-w-5xl flex items-center justify-between border-b border-neutral-800 pb-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white">Fidddle Workspace</h1>
                    <p className="text-sm text-neutral-400">Document: {recipient.document.title}</p>
                </div>
                <div className="text-right">
                    <span className="text-xs uppercase tracking-wider px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-300 font-medium">
                        Recipient: {recipient.name}
                    </span>
                </div>
            </header>

            {/* Main Interactive Signing Canvas Component */}
            <div className="w-full max-w-5xl flex-1 flex flex-col items-center justify-center">
                <SigningWorkspace
                    document={recipient.document}
                    recipient={recipient}
                    isAlreadySigned={isAlreadySigned}
                />
            </div>

            <footer className="w-full max-w-5xl text-center border-t border-neutral-800 pt-4 mt-6 text-xs text-neutral-500">
                Secured & Powered by Fidddle e-Signature Engine
            </footer>
        </main>
    );
}