import { useState, ReactNode, useEffect, createContext, useContext } from "react";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth, RESERVED_ROUTE_KEYWORDS } from "@/contexts/AuthContext";
import { useViewMode } from "@/contexts/ViewModeContext";
import { NotificationBell } from "./NotificationBell";
import { Button } from "@/components/ui/button";
import { MessageSquareHeart, Loader2 } from "lucide-react";
import { PrayerRequestDialog } from "./PrayerRequestDialog";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getTracing } from "@/lib/tracing";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";

export const LayoutContext = createContext<boolean>(false);

function SidebarLoggingTrigger() {
  const { toggleSidebar, state } = useSidebar();
  const logUIEvent = useMutation(api.logs.logUIEvent);

  const handleToggle = () => {
    const newState = state === "expanded" ? "collapsed" : "expanded";
    logUIEvent({
      action: "SIDEBAR_TOGGLE",
      details: `User toggled sidebar to ${newState}`,
      metadata: { state: newState },
      tracing: getTracing(),
    });
  };

  return <SidebarTrigger onClick={handleToggle} />;
}

export function Layout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const { viewMode } = useViewMode();
  const { orgSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const logUIEvent = useMutation(api.logs.logUIEvent);
  const [isPrayerDialogOpen, setIsPrayerDialogOpen] = useState(false);
  const isNested = useContext(LayoutContext);

  if (isNested) {
    return <>{children}</>;
  }

  // Home-Church Enforcement: Redirect to home slug if mismatch or missing
  useEffect(() => {
    if (import.meta.env.VITE_IS_MULTI_TENANT === "N") return;
    
    if (user) {
      const parts = location.pathname.split("/");
      const currentSlug = parts[1];
      const isReserved = RESERVED_ROUTE_KEYWORDS.includes(currentSlug);
      
      // Ensure we have a valid destination slug (not reserved)
      const homeSlug = (user.organizationSlug && !RESERVED_ROUTE_KEYWORDS.includes(user.organizationSlug))
        ? user.organizationSlug
        : "my-church";

      // If no slug or mismatching slug, redirect to the home slug
      if (!currentSlug || isReserved || (currentSlug !== homeSlug)) {
        console.warn(`[Layout] Access enforcement: Redirecting from "${currentSlug}" to home slug "${homeSlug}"`);
        
        // Determine the sub-page route (e.g. dashboard, profile, schedule)
        // If we are at /dashboard, subPage is "dashboard". If at /magi/dashboard, subPage is "dashboard".
        const subPage = (isReserved && !parts[2]) ? currentSlug : (parts[2] || "dashboard");
        
        navigate(`/${homeSlug}/${subPage}`, { replace: true });
      }
    }
  }, [user, location.pathname, navigate]);

  const handleOpenPrayer = () => {
    logUIEvent({
      action: "PRAYER_DIALOG_OPEN",
      details: "User opened prayer request dialog",
      tracing: getTracing(),
    });
    setIsPrayerDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Establishing secure connection...</p>
        </div>
      </div>
    );
  }

  return (
    <LayoutContext.Provider value={true}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full gradient-mesh">
          <AppSidebar />
          <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
            <header className="h-12 sm:h-14 flex shrink-0 items-center border-b px-3 sm:px-4 gap-2 sm:gap-3 glass-strong sticky top-0 z-10">
              <SidebarLoggingTrigger />
              <div className="flex-1" />
              {user?.role !== "admin" && (viewMode === "member" || viewMode === "newcomer") && <NotificationBell />}
              {user?.role !== "admin" && (viewMode === "member" || viewMode === "newcomer") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 hidden sm:flex"
                  onClick={handleOpenPrayer}
                >
                  <MessageSquareHeart className="h-4 w-4" />
                  <span className="hidden md:inline">Prayer</span>
                </Button>
              )}
              {/* Mobile Icon Only */}
              {user?.role !== "admin" && (viewMode === "member" || viewMode === "newcomer") && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="sm:hidden"
                  onClick={handleOpenPrayer}
                >
                  <MessageSquareHeart className="h-4 w-4" />
                </Button>
              )}

              {user ? (
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Welcome back, <span className="font-medium text-foreground">{user.name.split(" ")[0]}</span>
                </p>
              ) : (
                <div className="flex items-center gap-3">
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    Browsing as <span className="font-medium text-foreground">Guest</span>
                  </p>
                  <Button asChild variant="outline" size="sm" className="h-8">
                    <Link to="/login">Sign In</Link>
                  </Button>
                </div>
              )}
            </header>
            <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto">
              <div className="mx-auto w-full max-w-7xl pb-16">
                {children}
              </div>
            </div>
            <PrayerRequestDialog isOpen={isPrayerDialogOpen} onClose={() => setIsPrayerDialogOpen(false)} />
          </main>
        </div>
      </SidebarProvider>
    </LayoutContext.Provider>
  );
}
