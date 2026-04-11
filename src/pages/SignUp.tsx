import { SignUp as ClerkSignUp, useAuth } from "@clerk/clerk-react";
import { Church } from "lucide-react";
import { Navigate } from "react-router-dom";

export default function SignUp() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 gradient-mesh relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/3 pointer-events-none" />
      <div className="w-full max-w-md relative flex flex-col items-center">

        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="h-10 w-10 rounded-lg gradient-header flex items-center justify-center shadow-md">
            <Church className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold">MAGI Church</h2>
            <p className="text-xs text-muted-foreground">Join our community</p>
          </div>
        </div>

        <ClerkSignUp />
      </div>
    </div>
  );
}
