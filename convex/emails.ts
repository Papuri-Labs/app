"use node";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import nodemailer from "nodemailer";

export const sendEmail = internalAction({
    args: {
        to: v.union(v.string(), v.array(v.string())),
        subject: v.string(),
        html: v.string(),
    },
    handler: async (ctx, args) => {
        const email = process.env.GMAIL_EMAIL;
        const password = process.env.GMAIL_APP_PASSWORD;
        
        if (!email || !password) {
            console.warn(`[Nodemailer] Missing GMAIL_EMAIL or GMAIL_APP_PASSWORD configurations. Email skipped: "${args.subject}"`);
            return;
        }

        const recipientList = Array.isArray(args.to) ? args.to : [args.to];
        
        if (recipientList.length === 0) {
             console.warn(`[Nodemailer] No recipients provided. Email skipped: "${args.subject}"`);
             return;
        }

        try {
            // Initiate the SMTP Relay Transport strictly inside the Node execution context
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: email,
                    pass: password,
                },
            });

            console.log(`[Nodemailer] Hooking directly into Google SMTP. Dispatching to: ${recipientList.join(", ")} | Subject: "${args.subject}"`);
            
            // Blast the payload directly to the inboxes!
            await transporter.sendMail({
                from: `"Papuri App" <${email}>`, // It will look like it came officially from Papuri
                to: recipientList.join(", "),
                subject: args.subject,
                html: args.html,
            });

            console.log(`[Nodemailer] Google accepted the package! Successfully delivered.`);
        } catch (error) {
            console.error(`[Nodemailer] Fatal network error securely delivering the email payload:`, error);
        }
    },
});
