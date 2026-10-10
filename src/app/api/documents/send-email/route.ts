import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    try {
        const { email, signingUrl, documentName } = await req.json();

        if (!email || !signingUrl) {
            return NextResponse.json(
                { success: false, error: "Missing email or signing URL" },
                { status: 400 }
            );
        }

        const { data, error } = await resend.emails.send({
            from: "KSTribe <onboarding@resend.dev>", // Use onboarding@resend.dev for free testing
            to: [email],
            subject: `Action Required: Please sign ${documentName || "your document"}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #181818; color: #ffffff; border-radius: 16px;">
                    <h2 style="color: #ffffff; font-size: 20px; margin-bottom: 12px;">Document Signing Request</h2>
                    <p style="color: #A1A1A0; font-size: 16px; line-height: 1.5;">
                        You have been invited to review and sign <strong>${documentName || "a document"}</strong>.
                    </p>
                    <div style="margin: 32px 0;">
                        <a href="http://${signingUrl}" style="background: #3C70F2; color: white; padding: 14px 28px; text-decoration: none; border-radius: 100px; font-weight: 600; display: inline-block; font-size: 16px;">
                            Review & Sign Document
                        </a>
                    </div>
                    <p style="color: #71717A; font-size: 14px;">Or copy and paste this secure link into your browser:</p>
                    <p style="color: #6792FF; word-break: break-all; font-size: 14px;">http://${signingUrl}</p>
                </div>
            `,
        });

        if (error) {
            console.error("Resend error:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, data });
    } catch (err: any) {
        console.error("Email API error:", err);
        return NextResponse.json({ success: false, error: err.message || "Failed to send email" }, { status: 500 });
    }
}