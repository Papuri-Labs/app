import { useState, ReactNode } from "react";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useViewMode } from "@/contexts/ViewModeContext";
import { NotificationBell } from "./NotificationBell";
import { Button } from "@/components/ui/button";
import { MessageSquareHeart } from "lucide-react";
import { PrayerRequestDialog } from "./PrayerRequestDialog";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getTracing } from "@/lib/tracing";
import { Link, Outlet } from "react-router-dom";

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
  const { user } = useAuth();
  const { viewMode } = useViewMode();
  const logUIEvent = useMutation(api.logs.logUIEvent);
  const [isPrayerDialogOpen, setIsPrayerDialogOpen] = useState(false);

  const handleOpenPrayer = () => {
    logUIEvent({
      action: "PRAYER_DIALOG_OPEN",
      details: "User opened prayer request dialog",
      tracing: getTracing(),
    });
    setIsPrayerDialogOpen(true);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 flex flex-col min-w-0 w-full min-h-screen gradient-mesh">
        <header className="h-12 sm:h-14 flex items-center border-b px-3 sm:px-4 gap-2 sm:gap-3 glass-strong sticky top-0 z-10">
          <SidebarLoggingTrigger />
          <div className="flex-1" />
          {user?.role !== "admin" && <NotificationBell />}
          {(viewMode === "member" || viewMode === "newcomer") && (
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
          {(viewMode === "member" || viewMode === "newcomer") && (
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
        <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
          {children}
        </div>
        <PrayerRequestDialog isOpen={isPrayerDialogOpen} onClose={() => setIsPrayerDialogOpen(false)} />
      </main>
    </SidebarProvider>
  );
}

/**
 * Route wrapper that renders the persistent Layout with an Outlet for nested routes.
 * Used in App.tsx as the parent element for all protected routes.
 */
export function AppLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
