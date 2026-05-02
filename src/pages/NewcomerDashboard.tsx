import { useState } from "react";
import { Layout } from "@/components/Layout";
import { DashboardCard } from "@/components/DashboardCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Church, Calendar, Heart, BookOpen, Users, CheckCircle2, Image as ImageIcon, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ComingSoonDialog } from "@/components/ComingSoonDialog";
import { GivingDialog } from "@/components/GivingDialog";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { useParams } from "react-router-dom";

export default function NewcomerDashboard() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { user } = useAuth();
  const [selectedGiving, setSelectedGiving] = useState<any>(null);
  
  const settings = useQuery(api.settings.get, { orgSlug });
  const onboardingSteps = useQuery(api.onboarding.listSteps, { orgSlug }) || [];
  const userProgress = useQuery(api.onboarding.getUserProgress) || [];
  const services = useQuery(api.services.list, { orgSlug }) || [];
  const givingOptions = useQuery(api.giving_options.list, { orgSlug }) || [];
  const recentPhotos = useQuery(api.media.getRecentPhotos, { limit: 4, orgSlug }) || [];
  const completeStepMutation = useMutation(api.onboarding.completeStep);

  const completedStepIds = new Set(userProgress.map((p: any) => p.stepId));
  const stepsWithStatus = onboardingSteps.map((step: any, index: number) => {
    const done = completedStepIds.has(step._id);
    const canComplete = index === 0 || completedStepIds.has(onboardingSteps[index - 1]._id);
    return { ...step, done, canComplete, number: index + 1 };
  });

  const completedCount = stepsWithStatus.filter(s => s.done).length;
  const progress = onboardingSteps.length ? (completedCount / onboardingSteps.length) * 100 : 0;

  const handleCompleteStep = (stepId: any, canComplete: boolean) => {
    if (!user || !canComplete) return;
    completeStepMutation({ stepId }).catch(err => console.error("Failed to complete step:", err));
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in pb-20">
        {/* Welcome Header */}
        <div className="gradient-newcomer glass rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-accent/10 -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <h1 className="text-2xl font-bold mb-1 relative">{settings?.welcomeTitle || "Welcome to MAGI Church! 🙏"}</h1>
          <p className="text-muted-foreground relative">{settings?.welcomeMessage || "We're so glad you're here. Let's help you get connected."}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Onboarding Card */}
          <DashboardCard title="Your Onboarding Journey" description={`${completedCount} of ${onboardingSteps.length} steps completed`} icon={<Heart className="h-5 w-5 text-accent" />} gradient="gradient-newcomer">
            <Progress value={progress} className="mb-4 h-2" />
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
              {stepsWithStatus.length === 0 ? (
                <p className="text-sm text-muted-foreground">No onboarding steps yet.</p>
              ) : (
                stepsWithStatus.map((step: any) => (
                  <div
                    key={step._id}
                    className={`flex items-start gap-3 group p-2 rounded-xl transition-colors hover:bg-white/5 ${step.canComplete ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                    onClick={() => handleCompleteStep(step._id, step.canComplete)}
                  >
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-medium text-muted-foreground min-w-[2rem]">Step {step.number}</span>
                      <CheckCircle2 className={`h-5 w-5 transition-colors ${step.done ? "text-success" : step.canComplete ? "text-primary group-hover:text-primary" : "text-muted-foreground/30"}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${step.done ? "line-through text-muted-foreground" : ""}`}>{step.title}</p>
                      <p className="text-[10px] leading-tight text-muted-foreground line-clamp-2">{step.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {stepsWithStatus.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <Link to={`/${orgSlug}/onboarding`}>
                  <Button variant="ghost" size="sm" className="w-full gap-2 text-primary hover:text-primary hover:bg-primary/10">
                    View Full Journey <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </DashboardCard>

          {/* Service Schedule */}
          <DashboardCard title="Service Schedule" description="Join us for worship" icon={<Calendar className="h-5 w-5 text-primary" />} gradient="gradient-newcomer">
            <div className="space-y-3">
              {services.length === 0 ? (
                <p className="text-sm text-muted-foreground">No services listed yet.</p>
              ) : (
                services.map((s: any) => (
                  <div key={s._id} className="flex items-center justify-between p-3 rounded-xl glass-subtle">
                    <div>
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.day} @ {s.location}</p>
                    </div>
                    <span className="text-sm font-medium text-primary">{s.time}</span>
                  </div>
                ))
              )}
            </div>
          </DashboardCard>

          {/* About / Vision */}
          <DashboardCard title="About Us" icon={<Church className="h-5 w-5 text-primary" />} gradient="gradient-newcomer">
            <div className="space-y-4">
              {settings?.vision && (
                <div>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Our Vision</h4>
                  <p className="text-sm text-foreground/90 leading-relaxed">{settings.vision}</p>
                </div>
              )}
              {settings?.mission && (
                <div>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Our Mission</h4>
                  <p className="text-sm text-foreground/90 leading-relaxed">{settings.mission}</p>
                </div>
              )}
              {!settings?.vision && !settings?.mission && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {settings?.aboutChurch || "MAGI Church exists to glorify God by making disciples who love God, love people, and serve the world."}
                </p>
              )}
            </div>
          </DashboardCard>

          {/* Giving */}
          <DashboardCard title="Giving" description="Support our ministry" icon={<Heart className="h-5 w-5 text-destructive" />} gradient="gradient-newcomer">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-2">Thank you for your generosity. Your giving supports the mission and ministries of our church.</p>
              <div className="grid grid-cols-1 gap-2">
                {givingOptions.map((option: any) => (
                  <Button
                    key={option._id}
                    variant="outline"
                    className="w-full justify-start gap-2 h-auto py-2"
                    onClick={() => setSelectedGiving(option)}
                  >
                    <Heart className="h-4 w-4 text-destructive" />
                    <div className="text-left">
                      <p className="text-sm font-medium">{option.label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{option.description}</p>
                    </div>
                  </Button>
                ))}
                {givingOptions.length === 0 && <p className="text-xs text-muted-foreground italic">No giving options configured.</p>}
              </div>
            </div>
          </DashboardCard>

          {/* Connect */}
          <DashboardCard title="Connect with Us" icon={<Users className="h-5 w-5 text-primary" />} gradient="gradient-newcomer">
            <p className="text-sm text-muted-foreground mb-4">
              We'd love to help you find your place in our church family.
            </p>
            <div className="flex gap-2">
              <ComingSoonDialog>
                <Button size="sm">Join a Small Group</Button>
              </ComingSoonDialog>
              <ComingSoonDialog>
                <Button variant="outline" size="sm">Contact a Pastor</Button>
              </ComingSoonDialog>
            </div>
          </DashboardCard>

          {/* Recent Memories */}
          <DashboardCard title="Recent Memories" description="Life at MAGI Church" icon={<ImageIcon className="h-5 w-5 text-primary" />} gradient="gradient-newcomer">
            <div className="grid grid-cols-2 gap-2">
              {recentPhotos.length === 0 ? (
                <div className="col-span-2 py-8 text-center glass-subtle rounded-xl border border-dashed border-accent/20">
                  <p className="text-xs text-muted-foreground">No memories shared yet.</p>
                </div>
              ) : (
                recentPhotos.map((photo: any) => (
                  <Link key={photo._id} to={`/${orgSlug}/gallery`} className="aspect-square rounded-lg overflow-hidden border border-white/10 hover:opacity-80 transition-opacity">
                    <img src={photo.url} alt="Memory" className="w-full h-full object-cover" />
                  </Link>
                ))
              )}
            </div>
            <Link to={`/${orgSlug}/gallery`}>
              <Button variant="outline" size="sm" className="mt-3 w-full">Open Gallery</Button>
            </Link>
          </DashboardCard>
        </div>

        {/* Dialogs */}
        {selectedGiving && <GivingDialog selectedGiving={selectedGiving} onClose={() => setSelectedGiving(null)} />}
      </div>
    </Layout>
  );
}
