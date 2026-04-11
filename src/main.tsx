import { createRoot } from "react-dom/client";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import App from "./App.tsx";
import { convex } from "./convexClient";
import "./index.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
	throw new Error("Missing Publishable Key");
}

createRoot(document.getElementById("root")!).render(
	<ClerkProvider
		publishableKey={PUBLISHABLE_KEY}
		signInUrl="/login"
		signUpUrl="/signup"
		afterSignOutUrl="/login"
		signInFallbackRedirectUrl="/my-church/dashboard"
		signUpFallbackRedirectUrl="/my-church/dashboard"
	>
		<ConvexProviderWithClerk client={convex} useAuth={useAuth}>
			<App />
		</ConvexProviderWithClerk>
	</ClerkProvider>
);
