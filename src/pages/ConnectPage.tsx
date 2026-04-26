import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquareHeart, UserPlus, Sparkles, Church, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { PrayerRequestDialog } from "@/components/PrayerRequestDialog";
import { FirstTimerDialog } from "@/components/FirstTimerDialog";
import { PageHeader } from "./RolePages";

export default function ConnectPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const navigate = useNavigate();
  const [isPrayerDialogOpen, setIsPrayerDialogOpen] = useState(false);
  const [isFirstTimerDialogOpen, setIsFirstTimerDialogOpen] = useState(false);

  const settings = useQuery(api.settings.getPublicBySlug, { slug: orgSlug || "my-church" });
  const organization = useQuery(api.organizations.getPublic, { slug: orgSlug || "my-church" });

  if (settings === undefined || organization === undefined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground animate-pulse">Connecting to church...</p>
      </div>
    );
  }

  if (settings && settings.connectPageEnabled === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center space-y-4">
        <Church className="h-16 w-16 text-muted-foreground opacity-20" />
        <h1 className="text-2xl font-bold">Page Not Available</h1>
        <p className="text-muted-foreground max-w-md">
          This connection page is currently disabled by the church administration.
        </p>
        <Button onClick={() => navigate(`/${orgSlug}`)} variant="outline">
          Return to Home
        </Button>
      </div>
    );
  }

  const primaryColor = settings?.primaryColor || "#6366f1";

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 animate-fade-in overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 transition-colors duration-1000"
          style={{ backgroundColor: primaryColor }}
        />
        <div 
          className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-10"
          style={{ backgroundColor: settings?.accentColor || "#f59e0b" }}
        />
      </div>

      <div className="relative max-w-md mx-auto px-6 py-12 md:py-24 flex flex-col items-center min-h-screen justify-center space-y-12">
        {/* Logo/Church Info */}
        <div className="text-center space-y-4">
          {settings?.logoUrl ? (
            <div className="relative group mx-auto mb-6">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 scale-90" />
              <img 
                src={settings.logoUrl} 
                alt={organization?.name} 
                className="relative h-20 w-20 object-contain rounded-2xl shadow-2xl border border-white/10"
              />
            </div>
          ) : (
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 border border-primary/20 shadow-inner">
              <Church className="h-10 w-10 text-primary" />
            </div>
          )}
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {organization?.name || "Our Church"}
          </h1>
          <p className="text-muted-foreground text-lg font-medium opacity-80">
            {settings?.welcomeTitle || "Welcome! We're glad you're here."}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full grid grid-cols-1 gap-6">
          {/* Prayer Request Button */}
          <button 
            onClick={() => setIsPrayerDialogOpen(true)}
            className="group relative w-full text-left focus:outline-none"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300" />
            <Card className="relative overflow-hidden border-white/10 bg-white/5 backdrop-blur-md rounded-3xl hover:bg-white/10 transition-all duration-300 group-hover:border-primary/30 group-hover:-translate-y-1 shadow-lg">
              <CardContent className="p-8 flex items-center gap-6">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <MessageSquareHeart className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">Prayer Request</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    How can we pray for you today? Share your request with us.
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </CardContent>
              {/* Subtle accent line */}
              <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-primary group-hover:w-full transition-all duration-500" />
            </Card>
          </button>

          {/* First Timer Button */}
          <button 
            onClick={() => setIsFirstTimerDialogOpen(true)}
            className="group relative w-full text-left focus:outline-none"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-accent/5 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300" />
            <Card className="relative overflow-hidden border-white/10 bg-white/5 backdrop-blur-md rounded-3xl hover:bg-white/10 transition-all duration-300 group-hover:border-accent/30 group-hover:-translate-y-1 shadow-lg">
              <CardContent className="p-8 flex items-center gap-6">
                <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <UserPlus className="h-7 w-7 text-accent" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-xl font-bold group-hover:text-accent transition-colors">First Timer</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    New to our church? Let us know so we can welcome you properly.
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-accent group-hover:translate-x-1 transition-all" />
              </CardContent>
              {/* Subtle accent line */}
              <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-accent group-hover:w-full transition-all duration-500" />
            </Card>
          </button>
        </div>

        {/* Footer/Contact */}
        <div className="text-center space-y-6 pt-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
            Connected Community
          </p>
          <div className="flex items-center gap-2 justify-center py-3 px-6 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-sm font-medium">Powered by Papuri</span>
          </div>
        </div>
      </div>

      <PrayerRequestDialog 
        isOpen={isPrayerDialogOpen} 
        onClose={() => setIsPrayerDialogOpen(false)} 
        isGlobal={true}
      />
      <FirstTimerDialog 
        isOpen={isFirstTimerDialogOpen} 
        onClose={() => setIsFirstTimerDialogOpen(false)} 
      />
    </div>
  );
}
