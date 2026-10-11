import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function POST(req: Request) {
    try {
        const { email, signingUrl, documentName } = await req.json();

        if (!email || !signingUrl) {
            return NextResponse.json(
                { success: false, error: "Missing email or signing URL" },
                { status: 400 }
            );
        }

        const sender = process.env.SENDGRID_VERIFIED_SENDER;

        if (!sender) {
            return NextResponse.json(
                { success: false, error: "SENDGRID_VERIFIED_SENDER is missing in .env.local" },
                { status: 500 }
            );
        }

        const msg = {
            to: email,
            from: sender,
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
        };

        await sgMail.send(msg);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        // Detailed logging to terminal console
        console.error("--- SendGrid Error Details ---");
        if (err.response) {
            console.error("Status:", err.response.statusCode);
            console.error("Body Errors:", JSON.stringify(err.response.body, null, 2));
        } else {
            console.error("Error Message:", err.message);
        }

        const detailedError = err.response?.body?.errors?.[0]?.message || err.message || "Failed to send email";
        return NextResponse.json(
            { success: false, error: detailedError },
            { status: 500 }
        );
    }
}