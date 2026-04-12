declare const process: {
    env: Record<string, string | undefined>;
};

const clerkIssuerDomain =
    process.env.CLERK_JWT_ISSUER_DOMAIN ?? process.env.CLERK_FRONTEND_API_URL;

if (!clerkIssuerDomain) {
    throw new Error(
        "Missing Clerk issuer domain. Set CLERK_JWT_ISSUER_DOMAIN (or CLERK_FRONTEND_API_URL)."
    );
}

export default {
    providers: [
        {
            domain: clerkIssuerDomain,
            applicationID: "convex",
        },
    ],
};
