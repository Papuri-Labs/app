declare const process: {
    env: Record<string, string | undefined>;
};

const clerkIssuerDomains =
    process.env.CLERK_JWT_ISSUER_DOMAINS?.split(",")
        .map((domain) => domain.trim())
        .filter(Boolean) ?? [
        process.env.CLERK_JWT_ISSUER_DOMAIN ?? process.env.CLERK_FRONTEND_API_URL,
    ].filter((domain): domain is string => Boolean(domain));

if (clerkIssuerDomains.length === 0) {
    throw new Error(
        "Missing Clerk issuer domain. Set CLERK_JWT_ISSUER_DOMAINS, or CLERK_JWT_ISSUER_DOMAIN / CLERK_FRONTEND_API_URL."
    );
}

export default {
    providers: clerkIssuerDomains.map((domain) => ({
        domain,
        applicationID: "convex",
    })),
};
