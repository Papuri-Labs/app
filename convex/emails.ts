import { internalAction } from "./_generated/server";
import { v } from "convex/values";

export const sendEmail = internalAction({
    args: {
        to: v.union(v.string(), v.array(v.string())),
        subject: v.string(),
        html: v.string(),
    },
    handler: async (ctx, args) => {
        const apiKey = process.env.RESEND_API_KEY;
        const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"; // Default Resend test domain
        
        if (!apiKey) {
            console.warn(`[Resend] Missing RESEND_API_KEY. Email skipped: "${args.subject}"`);
            return;
        }

        // Resend works best when multiple emails are passed as an array
        const recipientList = Array.isArray(args.to) ? args.to : [args.to];
        
        if (recipientList.length === 0) {
             console.warn(`[Resend] No recipients provided. Email skipped: "${args.subject}"`);
             return;
        }

        try {
            console.log(`[Resend] Dispatching email to ${recipientList.join(", ")}: "${args.subject}"`);
            
            const response = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    from: fromEmail,
                    to: recipientList,
                    subject: args.subject,
                    html: args.html,
                }),
            });

            if (!response.ok) {
                const text = await response.text();
                console.error(`[Resend] API rejected the request (Status ${response.status}): ${text}`);
            } else {
                const data = await response.json();
                console.log(`[Resend] Email successfully sent! ID: ${data.id}`);
            }
        } catch (error) {
            console.error(`[Resend] Network error when attempting to deliver email:`, error);
        }
    },
});
