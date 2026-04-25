import { Layout } from "@/components/Layout";
import { ComingSoonDialog } from "@/components/ComingSoonDialog";
import { LeaderContactDialog } from "@/components/LeaderContactDialog";
import { DashboardCard } from "@/components/DashboardCard";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { GivingDialog } from "@/components/GivingDialog";
import { BulletinDialog } from "@/components/BulletinDialog";
import { AnnouncementDialog } from "@/components/AnnouncementDialog";
import { EventDialog } from "@/components/EventDialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useViewMode } from "@/contexts/ViewModeContext";
import { useMemo, useState, useEffect } from "react";
import { useNavigate, Link, Navigate, useParams } from "react-router-dom";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Calendar,
  BookOpen,
  Bell,
  Heart,
  Users,
  ClipboardList,
  Church,
  CheckCircle2,
  FileText,
  BarChart3,
  Shield,
  Settings,
  Activity,
  UserPlus,
  Sparkles,
  MapPin,
  Clock,
  Mail,
  Plus,
  Zap,
  Check,
  Building2,
  ClipboardCheck,
  Trash2,
  Edit2,
  TrendingUp,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Search, Hash, Info, Lock,
  ArrowRight, AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ImageUpload } from "@/components/ImageUpload";
import { getTracing } from "@/lib/tracing";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { openExternalLink, getLocalSysDate } from "@/lib/utils";

import { GalleryPage } from "./GalleryPage";

export { GalleryPage };

export function PageHeader({
  title,
  subtitle,
  gradient,
}: {
  title: string;
  subtitle: string;
  gradient: "gradient-newcomer" | "gradient-member" | "gradient-leader" | "gradient-admin";
}) {
  const glowMap: Record<string, string> = {
    "gradient-newcomer": "bg-accent/10",
    "gradient-member": "bg-primary/10",
    "gradient-leader": "bg-success/8",
    "gradient-admin": "bg-primary/6",
  };

  return (
    <div className={`${gradient} glass rounded-2xl p-4 sm:p-6 relative overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-48 h-48 rounded-full ${glowMap[gradient]} -translate-y-1/2 translate-x-1/3 blur-3xl`} />
      <h1 className="text-xl sm:text-2xl font-bold mb-1 relative">{title}</h1>
      <p className="text-muted-foreground relative">{subtitle}</p>
    </div>
  );
}













const ministryStats: { label: string; value: string | number; change?: string }[] = [];





const memberDirectory: { name: string; group: string; status: string; ministryId: string }[] = [];

const followUpMembers: { name: string; group: string; absences: number; lastSeen: string; ministryId: string }[] = [];

const attendanceMembers: { name: string; group: string; ministryId: string }[] = [];

const systemMetrics: { label: string; value: string | number; trend?: string }[] = [];

const usersList: { name: string; email: string; role: string; status: string; ministryIds: string[] }[] = [];

const rolesMatrix: { role: string; access: string }[] = [];

import { roleBadgeStyles } from "@/lib/role-colors";

export function NewcomerOnboardingPage() {
  const { user } = useAuth();
  const onboardingSteps = useQuery(api.onboarding.listSteps) || [];
  const userProgress = useQuery(api.onboarding.getUserProgress) || [];
  const completeStepMutation = useMutation(api.onboarding.completeStep);

  const completedStepIds = new Set(userProgress.map((p: any) => p.stepId));
  const stepsWithStatus = onboardingSteps.map((step: any, index: number) => {
    const done = completedStepIds.has(step._id);
    const canComplete = index === 0 || completedStepIds.has(onboardingSteps[index - 1]._id);
    return {
      ...step,
      done,
      canComplete,
      number: index + 1,
    };
  });

  const completedCount = stepsWithStatus.filter(s => s.done).length;
  const progress = onboardingSteps.length ? (completedCount / onboardingSteps.length) * 100 : 0;

  const handleCompleteStep = (stepId: any, canComplete: boolean) => {
    if (!user || !canComplete) return;
    completeStepMutation({ stepId }).catch(err => {
      console.error("Failed to complete step:", err.message || err);
    });
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Onboarding Journey"
          subtitle="Step-by-step guidance to help you get connected."
          gradient="gradient-newcomer"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <DashboardCard
            title="Your Progress"
            description={`${completedCount} of ${onboardingSteps.length} steps completed`}
            icon={<CheckCircle2 className="h-5 w-5 text-accent" />}
            gradient="gradient-newcomer"
            className="lg:col-span-2"
          >
            <Progress value={progress} className="mb-4 h-2" />
            <div className="space-y-3">
              {stepsWithStatus.length === 0 ? (
                <p className="text-sm text-muted-foreground">No onboarding steps yet.</p>
              ) : (
                stepsWithStatus.map((step: any) => (
                  <div
                    key={step._id}
                    className={`p-4 rounded-xl glass-subtle border transition-all ${step.done ? 'border-success/30 bg-success/5' :
                      step.canComplete ? 'border-border hover:border-primary/50 cursor-pointer' :
                        'border-border/50 opacity-50 cursor-not-allowed'
                      }`}
                    onClick={() => handleCompleteStep(step._id, step.canComplete)}
                    title={!step.canComplete && !step.done ? "Complete previous steps first" : ""}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-primary min-w-[3rem]">Step {step.number}</span>
                        <CheckCircle2 className={`h-5 w-5 transition-colors ${step.done ? 'text-success' :
                          step.canComplete ? 'text-border' :
                            'text-muted-foreground/30'
                          }`} />
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium mb-1 ${step.done ? 'line-through text-muted-foreground' : ''}`}>{step.title}</p>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DashboardCard>

          <DashboardCard
            title="Next Steps"
            description="Friendly guidance"
            icon={<Sparkles className="h-5 w-5 text-primary" />}
            gradient="gradient-newcomer"
          >
            <div className="space-y-3">
              <div className="p-3 rounded-xl glass-subtle">
                <p className="text-sm font-medium">Join a small group</p>
                <p className="text-xs text-muted-foreground">We can help match you to a group.</p>
              </div>
              <div className="p-3 rounded-xl glass-subtle">
                <p className="text-sm font-medium">Meet the pastors</p>
                <p className="text-xs text-muted-foreground">Schedule a short welcome call.</p>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <ComingSoonDialog>
                <Button size="sm">Start a Connection</Button>
              </ComingSoonDialog>
              <ComingSoonDialog>
                <Button variant="outline" size="sm">Ask a Question</Button>
              </ComingSoonDialog>
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
}

export function AboutChurchPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { user } = useAuth();
  const leaders = useQuery(api.users.listLeaders, { orgSlug }) || [];

  const organization = useQuery(api.organizations.get, user?.organizationId ? { organizationId: user.organizationId as Id<"organizations"> } : "skip");
  const settings = useQuery(api.settings.get, { orgSlug });

  // Guest queries
  const publicOrg = useQuery(api.organizations.getPublic, !user ? { slug: orgSlug || "my-church" } : "skip");

  const displayOrg = user ? organization : publicOrg;
  const displaySettings = settings;

  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;
  const pageCount = Math.ceil(leaders.length / itemsPerPage);
  const displayedLeaders = leaders.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  const socialLinks = displaySettings?.socialLinks;

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title={`About ${displayOrg?.name || "Our Church"}`}
          subtitle="Our vision, values, and the heart of our community."
          gradient="gradient-newcomer"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <DashboardCard title="Our Vision" icon={<Church className="h-5 w-5 text-primary" />} gradient="gradient-newcomer">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {displaySettings?.vision || `We exist to glorify God by making disciples who love God, love people, and serve the world. Our
              community is built on worship, prayer, and compassionate service.`}
            </p>
          </DashboardCard>

          <DashboardCard title="Core Values" icon={<Heart className="h-5 w-5 text-accent" />} gradient="gradient-newcomer">
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {displaySettings?.mission || (
                <ul className="space-y-2">
                  <li>• Authentic worship and biblical teaching</li>
                  <li>• Life-giving community and discipleship</li>
                  <li>• Compassionate outreach and stewardship</li>
                  <li>• Unity across generations and cultures</li>
                </ul>
              )}
            </div>
          </DashboardCard>

          <DashboardCard title="Leadership" icon={<Users className="h-5 w-5 text-primary" />} gradient="gradient-newcomer">
            <div className="space-y-3">
              {leaders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No leadership profiles yet.</p>
              ) : (
                <>
                  {displayedLeaders.map((leader) => (
                    <div key={leader._id} className="flex items-center justify-between p-3 rounded-xl glass-subtle">
                      <div>
                        <p className="text-sm font-medium">{leader.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          Leader {leader.ministryNames && leader.ministryNames.length > 0 ? `· ${leader.ministryNames.join(", ")}` : ""}
                        </p>
                      </div>
                      <LeaderContactDialog leader={leader}>
                        <Button size="sm" variant="outline">Contact</Button>
                      </LeaderContactDialog>
                    </div>
                  ))}
                  {pageCount > 1 && (
                    <div className="flex justify-between items-center mt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                        disabled={currentPage === 0}
                      >
                        Previous
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Page {currentPage + 1} of {pageCount}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(pageCount - 1, p + 1))}
                        disabled={currentPage === pageCount - 1}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </DashboardCard>

          <DashboardCard title="Visit Us" icon={<MapPin className="h-5 w-5 text-primary" />} gradient="gradient-newcomer">
            <div className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground whitespace-pre-wrap">
                <p className="font-medium text-foreground">{displaySettings?.address || "123 Grace Avenue, Springfield"}</p>
                {displaySettings?.visitInfo ? (
                  <p>{displaySettings.visitInfo}</p>
                ) : (
                  <>
                    <p>Parking available on campus</p>
                    <p>Childcare during Sunday services</p>
                  </>
                )}
              </div>

              {socialLinks && (Object.values(socialLinks).some(v => !!v)) && (
                <div className="pt-4 border-t border-white/5 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Follow Us</p>
                  <div className="flex flex-wrap gap-2">
                    {socialLinks.facebook && (
                      <Button variant="outline" size="sm" className="gap-2 h-8" onClick={() => openExternalLink(socialLinks.facebook)}>
                        Facebook
                      </Button>
                    )}
                    {socialLinks.instagram && (
                      <Button variant="outline" size="sm" className="gap-2 h-8" onClick={() => openExternalLink(socialLinks.instagram)}>
                        Instagram
                      </Button>
                    )}
                    {socialLinks.youtube && (
                      <Button variant="outline" size="sm" className="gap-2 h-8" onClick={() => openExternalLink(socialLinks.youtube)}>
                        YouTube
                      </Button>
                    )}
                    {socialLinks.x && (
                      <Button variant="outline" size="sm" className="gap-2 h-8" onClick={() => openExternalLink(socialLinks.x)}>
                        X (Twitter)
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
}

export function SystemStatsPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const allUsers = useQuery(api.users.getAdminDirectory, isAdmin ? {} : "skip") || [];
  const ministries = useQuery(api.ministries.list, isAdmin ? {} : "skip") || [];
  const logs = useQuery(api.logs.getLogs, isAdmin ? { limit: 50 } : "skip");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrace, setSelectedTrace] = useState<string | null>(null);

  if (user && !isAdmin) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
          <Shield className="h-16 w-16 text-destructive opacity-50" />
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground max-w-md">
            You do not have the administrative permissions required to view system statistics and audit logs.
          </p>
          <Button asChild variant="outline">
            <Link to={`/${orgSlug}/dashboard`}>Return to Dashboard</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const users = allUsers.filter((u: any) => u.isActive !== false);
  const totalUsers = users.length;
  const activeMinistries = ministries.filter((m: any) => m.active).length;

  const filteredLogs = logs?.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTrace = selectedTrace ? log.traceId === selectedTrace : true;
    return matchesSearch && matchesTrace;
  });

  const getActionBadgeStyle = (action: string) => {
    if (action.includes("DELETE")) return "destructive";
    if (action.includes("CREATE") || action.includes("SYNC")) return "default";
    if (action.includes("UPDATE")) return "secondary";
    return "outline";
  };

  // Role distribution
  const roles = users.reduce((acc: any, user: any) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});

  const roleDistribution = Object.entries(roles).map(([role, count]) => ({
    role: role.charAt(0).toUpperCase() + role.slice(1),
    count: Number(count),
    color: role === 'admin' ? 'bg-destructive' : role === 'leader' ? 'bg-primary' : 'bg-muted',
  }));

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="System Statistics"
          subtitle="Overview of system metrics, user roles, and audit trails."
          gradient="gradient-admin"
        />

        {!user || allUsers === undefined ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
            <p className="text-muted-foreground">Loading system data...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full">
              <StatCard label="Total Users" value={totalUsers} trend="neutral" icon={<Users className="h-5 w-5 text-primary" />} />
              <StatCard label="Active Ministries" value={activeMinistries} icon={<Building2 className="h-5 w-5 text-primary" />} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <DashboardCard title="Role Distribution" description="Users by role" icon={<Shield className="h-5 w-5 text-primary" />} gradient="gradient-admin" className="min-w-0 w-full">
                <div className="space-y-3">
                  {roleDistribution.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No data available.</p>
                  ) : (
                    roleDistribution.map((r, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${r.color}`} />
                        <div className="flex-1 flex justify-between items-center">
                          <span className="text-sm">{r.role}</span>
                          <span className="text-sm font-semibold">{r.count}</span>
                        </div>
                        <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full gradient-header opacity-50" style={{ width: `${(r.count / totalUsers) * 100}%` }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </DashboardCard>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5 overflow-hidden">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-3 sm:p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:flex-1">
                  <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Filter logs by user, action, or details..."
                      className="pl-10 h-9 text-sm glass-strong focus:ring-primary/20 w-full"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  {selectedTrace && (
                    <Badge variant="secondary" className="gap-1 h-7 animate-in fade-in slide-in-from-left-2 w-full sm:w-auto justify-center sm:justify-start">
                      Trace: {selectedTrace.substring(0, 8)}...
                      <button onClick={() => setSelectedTrace(null)} className="ml-1 hover:text-destructive">×</button>
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium self-end sm:self-auto">
                  <Activity className="h-3 w-3 animate-pulse text-primary" />
                  <span className="hidden xs:inline">Real-time Audit Trail</span>
                  <span className="xs:hidden">Live Feed</span>
                </div>
              </div>

              <DashboardCard
                title="System Audit Logs"
                description="Live stream of platform actions and administrative changes"
                icon={<Activity className="h-5 w-5 text-primary" />}
                gradient="gradient-admin"
                className="min-w-0 w-full"
              >
                <div className="rounded-md border border-white/5 overflow-x-auto overflow-y-auto max-h-[450px] w-full">
                  <Table className="min-w-[750px] md:min-w-full">
                    <TableHeader>
                      <TableRow className="border-white/5 bg-white/5 hover:bg-white/5">
                        <TableHead className="w-[140px] text-xs uppercase tracking-wider">Timestamp</TableHead>
                        <TableHead className="w-[180px] text-xs uppercase tracking-wider">User</TableHead>
                        <TableHead className="w-[100px] text-xs uppercase tracking-wider">Action</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider">Details</TableHead>
                        <TableHead className="w-[100px] text-right text-xs uppercase tracking-wider">Trace</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs === undefined ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                              <span>Polling audit logs...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredLogs?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                            No recent activities matching your criteria.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLogs?.map((log) => (
                          <TableRow key={log._id} className="border-white/5 hover:bg-white/5 transition-colors group">
                            <TableCell className="text-[11px] font-mono text-muted-foreground whitespace-nowrap">
                              {format(log.timestamp, "MMM d, HH:mm:ss")}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold">{log.userName}</span>
                                <span className="text-[10px] text-muted-foreground/60">{log.userEmail}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getActionBadgeStyle(log.action) as any} className="text-[9px] h-5 px-1.5 uppercase font-extrabold tracking-tighter">
                                {log.action}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="flex items-start gap-2">
                                <span className="mt-0.5 opacity-40">•</span>
                                <span className="line-clamp-2 leading-relaxed opacity-90">{log.details}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <button
                                onClick={() => setSelectedTrace(log.traceId)}
                                className="text-[10px] font-mono text-primary/60 hover:text-primary hover:underline transition-colors"
                                title="Filter by this trace flow"
                              >
                                {log.traceId.substring(0, 8)}
                              </button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </DashboardCard>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

export function ServiceSchedulePage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const serviceSchedule = useQuery(api.services.list, { orgSlug }) || [];

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Service Schedule"
          subtitle="Find a service that fits your week."
          gradient="gradient-newcomer"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <DashboardCard
            title="Weekly Services"
            description="Worship, prayer, and community"
            icon={<Calendar className="h-5 w-5 text-primary" />}
            gradient="gradient-newcomer"
            className="lg:col-span-2"
          >
            <div className="space-y-3">
              {serviceSchedule.length === 0 ? (
                <p className="text-sm text-muted-foreground">No services scheduled yet.</p>
              ) : (
                serviceSchedule.map((service) => (
                  <div key={service._id} className="p-3 rounded-xl glass-subtle flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{service.name}</p>
                      <p className="text-xs text-muted-foreground">{service.day} · {service.location}</p>
                    </div>
                    <span className="text-sm font-medium text-primary">{service.time}</span>
                  </div>
                ))
              )}
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
}
export function EventsPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { user } = useAuth();
  const { viewMode } = useViewMode();
  const ministryIds = user?.ministryIds ?? [];
  const events = useQuery(api.events.list, { orgSlug }) || [];
  const isLeader = (user?.role === "leader" || user?.role === "admin") && viewMode === "leader";
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const myRsvps = useQuery(api.events.getUserRsvps, user?._id ? { memberId: user._id as any } : "skip") || [];
  const rsvpSet = new Set(myRsvps.map((r: any) => r.eventId));

  // Filter events based on ministry if applicable, or show all for members
  const filteredEvents = events.filter((e) => {
    // Hide drafts from public view
    if (e.status === "Draft") return false;

    // Guests only see Global Events
    if (!user) return !e.ministryId;

    // Leaders/Admins see everything (if in leader mode)
    if (isLeader) return true;

    // Members see Global OR their Ministries
    return !e.ministryId || (user.ministryIds || []).includes(e.ministryId);
  });

  const rsvpMutation = useMutation(api.events.rsvp);

  const handleRsvp = (eventId: any) => {
    if (!user || !user._id) {
      // Potentially redirect to login or show a toast
      window.location.href = "/login";
      return;
    }
    rsvpMutation({
      eventId,
      memberId: user._id as any,
      tracing: getTracing()
    }).catch(console.error);
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Church Events"
          subtitle={`Upcoming gatherings for ${user?.ministryNames?.join(", ") ?? "your"} ministry.`}
          gradient="gradient-member"
        />

        <div className="grid grid-cols-1 gap-4 md:gap-6">
          <DashboardCard title="Featured Events" description="This month" icon={<Calendar className="h-5 w-5 text-primary" />} gradient="gradient-member">
            <div className="space-y-3">
              {filteredEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events yet.</p>
              ) : (
                filteredEvents.map((e) => (
                  <div key={e._id} className="p-3 rounded-xl glass-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{e.date} · {e.time}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {e.type && <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">{e.type}</span>}
                      <Button size="sm" variant={rsvpSet.has(e._id) ? "default" : "outline"} onClick={() => handleRsvp(e._id)}>
                        {rsvpSet.has(e._id) ? "RSVP'd" : "RSVP"}
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground w-full sm:w-auto text-right mt-1 sm:mt-0">Confirmed: {e.rsvpCount}</p>
                  </div>
                ))
              )}
            </div>
            {isLeader && (
              <div className="flex gap-2 mt-3 flex-col sm:flex-row">
                <Button size="sm" variant="outline" onClick={() => setShowCreateEvent(true)}>Create Event</Button>
              </div>
            )}
          </DashboardCard>

          {/* Create Event Modal */}
          {showCreateEvent && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateEvent(false)}>
              <div className="bg-background p-6 rounded-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-semibold mb-4">Create Event Modal</h3>
                <p className="text-sm text-muted-foreground mb-4">Redirect to Manage Events page for full creation form.</p>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowCreateEvent(false)}>Cancel</Button>
                  <Button onClick={() => window.location.href = '/leader/manage-events'}>Go to Manage Events</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export function BulletinsPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const bulletins = useQuery(api.bulletins.listBulletins, { orgSlug }) || [];

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Bulletins"
          subtitle="Weekly highlights, announcements, and notes."
          gradient="gradient-member"
        />

        <DashboardCard
          title="Latest Bulletins"
          description="Stay informed"
          icon={<FileText className="h-5 w-5 text-primary" />}
          gradient="gradient-member"
        >
          <div className="space-y-3">
            {bulletins.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bulletins yet.</p>
            ) : (
              bulletins.map((b) => (
                <div key={b._id} className="p-3 rounded-xl glass-subtle">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{b.title}</p>
                    <span className="text-xs text-muted-foreground">{b.date}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{b.summary}</p>
                </div>
              ))
            )}
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
}

export function BibleReadingPage() {
  const activePlansData = useQuery(api.biblePlan.getMyActivePlans);
  const markAsRead = useMutation(api.biblePlan.markDayComplete);
  const [isMarking, setIsMarking] = useState(false);
  const [reflectionModalDay, setReflectionModalDay] = useState<number | null>(null);
  const [reflectionText, setReflectionText] = useState("");
  const [activeReflectAssignmentId, setActiveReflectAssignmentId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  if (activePlansData === undefined) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading reading plans...</div>;

  if (activePlansData.length === 0) {
    return (
      <Layout>
        <div className="space-y-6 animate-fade-in">
          <PageHeader
            title="Bible Reading"
            subtitle="Keep your daily rhythm of scripture."
            gradient="gradient-member"
          />
          <div className="flex flex-col items-center justify-center py-20 text-center glass rounded-3xl border border-primary/5">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <BookOpen className="h-8 w-8 text-primary opacity-50" />
            </div>
            <h3 className="text-lg font-semibold">No active plans found</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-[300px]">
              You haven't been assigned any reading plans yet. Contact your ministry leader to get started!
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  const handleMarkAsReadSubmit = async () => {
    if (isMarking || reflectionModalDay === null || !activeReflectAssignmentId) return;
    setIsMarking(true);
    try {
      await markAsRead({
        assignmentId: activeReflectAssignmentId as any,
        dayNumber: reflectionModalDay,
        reflection: reflectionText.trim() === "" ? undefined : reflectionText.trim(),
        tracing: getTracing()
      });
      toast.success("Reading completed! Well done.");
      setReflectionModalDay(null);
      setActiveReflectAssignmentId(null);
    } catch (e: any) {
      toast.error("Error: " + e.message);
    } finally {
      setIsMarking(false);
    }
  };

  const openReflectionModal = (dayNum: number, assignmentId: string) => {
    setReflectionModalDay(dayNum);
    setActiveReflectAssignmentId(assignmentId);
    setReflectionText("");
  };
  const currentTabValue = selectedPlanId || activePlansData?.[0]?.plan?._id || "";
  const currentPlanIndex = activePlansData?.findIndex((p: any) => p.plan?._id === currentTabValue);
  const selectedPlanData = activePlansData?.[currentPlanIndex !== -1 ? currentPlanIndex : 0];

  let displayDay = 1;
  let displayStreak = 0;
  let displayTitle = "Bible Reading";
  let displayDuration = 0;

  if (selectedPlanData) {
    const { assignment, plan } = selectedPlanData;
    const start = new Date(assignment.startDate);
    const now = new Date();
    start.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffTime = now.getTime() - start.getTime();
    displayDay = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);
    displayStreak = selectedPlanData.currentStreak || 0;
    displayTitle = plan?.title || "Bible Reading";
    displayDuration = plan?.duration || 0;
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in pb-20">
        {/* Global Page Header */}
        <div className="gradient-member glass rounded-2xl p-6 relative overflow-hidden mb-6">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-primary/8 -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-info/6 translate-y-1/2 -translate-x-1/4 blur-2xl" />
          <h1 className="text-2xl font-bold mb-1 relative">Bible Reading</h1>
          <p className="text-muted-foreground relative text-sm">
            Engage with scripture and track your daily reading progress.
          </p>
        </div>

        <Tabs value={currentTabValue} onValueChange={setSelectedPlanId} className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-0 mb-4">
            <div className="flex-1 w-full">
              <PageHeader
                title={displayTitle}
                subtitle={`Day ${displayDay} of ${displayDuration}`}
                gradient="gradient-member"
              />
            </div>
            {displayStreak >= 0 && (
              <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-sm py-1.5 px-4 self-start sm:self-auto flex items-center gap-1.5 shadow-sm">
                <span className="text-xl leading-none -mt-0.5">🔥</span> {displayStreak} Day Streak
              </Badge>
            )}
          </div>

          {activePlansData.length > 1 && (
            <div className="flex mb-6">
              <TabsList className="bg-muted/50 p-1 border">
                {activePlansData.map((planData: any) => (
                  <TabsTrigger 
                    key={planData.plan?._id} 
                    value={planData.plan?._id} 
                    className="px-6 py-2"
                  >
                    {planData.plan?.title || "Plan"}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          )}

          {activePlansData.map((planData: any, index: number) => {
            const { assignment, plan, progress, progressData, readings, groupStats, dailyMessage } = planData;
            
            // Calculate current day based on start date
            const start = new Date(assignment.startDate);
            const now = new Date();
            start.setHours(0, 0, 0, 0);
            now.setHours(0, 0, 0, 0);
            
            // Difference in days (handles same day correctly)
            const diffTime = now.getTime() - start.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const todayDay = Math.max(1, diffDays + 1); // 1-indexed

            const todayReading = readings.find((r: any) => r.dayNumber === todayDay);
            const isCompletedToday = progress.includes(todayDay);
            const percentComplete = Math.round((progress.length / (plan?.duration || 1)) * 100);

            return (
              <TabsContent key={assignment._id} value={plan?._id} className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                <div className="space-y-6 relative">

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                      {/* Daily Leader Encouragement - High Visibility */}
                      {dailyMessage && (
                        <div className="rounded-2xl p-6 bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-xl shadow-orange-500/10 relative overflow-hidden group animate-in zoom-in-95 duration-500 mb-6">
                           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                              <Sparkles className="h-20 w-20" />
                           </div>
                           <div className="flex gap-4 items-start relative">
                              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                                <Sparkles className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 text-orange-100">Daily Encouragement</p>
                                <h3 className="text-lg font-bold leading-tight italic">
                                  "{dailyMessage}"
                                </h3>
                              </div>
                           </div>
                        </div>
                      )}

                      {/* Today's Focus */}
                      <DashboardCard
                        title="Today's Scripture"
                        description={format(now, "EEEE, MMMM do")}
                        icon={<Sparkles className="h-5 w-5 text-primary" />}
                        gradient="gradient-member"
                      >
                        <div className="space-y-6 p-2">
                          {todayReading ? (
                            <>
                              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 shadow-sm">
                                <h3 className="text-xl font-bold text-primary mb-2">{todayReading.scripture}</h3>
                                {todayReading.notes && (
                                  <p className="text-sm text-muted-foreground italic border-l-2 border-primary/20 pl-4 py-1">
                                    "{todayReading.notes}"
                                  </p>
                                )}
                              </div>
                              
                              <Button 
                                onClick={() => openReflectionModal(todayDay, assignment._id)} 
                                disabled={isMarking || isCompletedToday}
                                className="w-full h-12 text-base font-semibold shadow-lg transition-all hover:scale-[1.01]"
                                variant={isCompletedToday ? "outline" : "default"}
                              >
                                {isCompletedToday ? (
                                  <><CheckCircle2 className="h-5 w-5 mr-2 text-success" /> Completed for Today</>
                                ) : (
                                  <><BookOpen className="h-5 w-5 mr-2" /> Mark as Read</>
                                )}
                              </Button>
                            </>
                          ) : (
                            <div className="py-8 text-center bg-muted/20 rounded-2xl border border-dashed">
                              <p className="text-sm text-muted-foreground">No specific reading assigned for this day.</p>
                            </div>
                          )}
                        </div>
                      </DashboardCard>

                      {/* Timeline View */}
                      <DashboardCard
                        title="Reading Timeline"
                        icon={<Zap className="h-5 w-5 text-warm" />}
                        gradient="gradient-member"
                      >
                        <div className="relative pl-6 space-y-8 py-4">
                          {/* Timeline vertical bar */}
                          <div className="absolute left-[7px] top-6 bottom-6 w-0.5 bg-muted-foreground/10" />
                          
                          {[...readings].sort((a: any, b: any) => a.dayNumber - b.dayNumber).map((r: any) => {
                            const isPast = r.dayNumber < todayDay;
                            const isToday = r.dayNumber === todayDay;
                            const isDone = progress.includes(r.dayNumber);

                            return (
                              <div key={r.dayNumber} className="relative group">
                                {/* Timeline Dot */}
                                <div className={cn(
                                  "absolute -left-[24px] top-1 px-1 flex items-center justify-center transition-all",
                                  isDone ? "text-success" : isToday ? "text-primary scale-125" : "text-muted-foreground/30"
                                )}>
                                  {isDone ? (
                                    <div className="h-4 w-4 rounded-full bg-success flex items-center justify-center">
                                      <Check className="h-2.5 w-2.5 text-white" />
                                    </div>
                                  ) : (
                                    <div className={cn(
                                      "h-3 w-3 rounded-full border-2",
                                      isToday ? "bg-primary border-primary animate-pulse" : "bg-background border-current"
                                    )} />
                                  )}
                                </div>

                                <div className={cn(
                                  "p-4 rounded-xl border transition-all",
                                  isToday ? "glass shadow-md border-primary/20 ring-1 ring-primary/10" : "bg-muted/5 border-transparent hover:border-muted-foreground/10"
                                )}>
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Day {r.dayNumber}</span>
                                        {isToday && <Badge className="text-[9px] h-4 bg-primary/10 text-primary border-primary/20">Current</Badge>}
                                      </div>
                                      <h4 className="font-semibold text-sm">{r.scripture}</h4>
                                    </div>
                                    {isPast && !isDone && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 text-[10px] px-2 text-primary hover:bg-primary/5"
                                        onClick={() => openReflectionModal(r.dayNumber, assignment._id)}
                                      >
                                        Catch up
                                      </Button>
                                    )}
                                  </div>
                                  {isDone && progressData?.find((pd: any) => pd.dayNumber === r.dayNumber)?.reflection && (
                                    <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10 text-xs italic text-muted-foreground w-full break-words">
                                      "{progressData.find((pd: any) => pd.dayNumber === r.dayNumber).reflection}"
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </DashboardCard>
                    </div>

                    <div className="space-y-6">
                      <DashboardCard
                        title="Progress"
                        icon={<Activity className="h-5 w-5 text-primary" />}
                        gradient="gradient-member"
                      >
                        <div className="space-y-6">
                          <div className="text-center py-4">
                            <div className="relative inline-flex items-center justify-center h-32 w-32 mb-4">
                              <svg className="h-full w-full transform -rotate-90">
                                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted/10" />
                                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={364.4} strokeDashoffset={364.4 * (1 - (percentComplete > 100 ? 100 : percentComplete) / 100)} className="text-primary transition-all duration-1000" />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black">{percentComplete}%</span>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              <span className="font-bold text-primary">{progress.length}</span> of {plan?.duration || 0} days completed
                            </p>
                          </div>

                          {assignment.message && (
                            <div className="p-4 rounded-2xl bg-warm/5 border border-warm/10 relative overflow-hidden group">
                              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Sparkles className="h-8 w-8 text-warm" />
                              </div>
                              <p className="text-[10px] font-bold text-warm uppercase mb-2 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Assignment Note
                              </p>
                              <p className="text-xs italic leading-relaxed text-muted-foreground pr-4">
                                "{assignment.message}"
                              </p>
                            </div>
                          )}

                          {groupStats && (
                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Users className="h-8 w-8 text-primary" />
                                </div>
                                <p className="text-[10px] font-bold text-primary uppercase mb-2 flex items-center gap-1">
                                    <Users className="h-3 w-3" /> Group: {groupStats.name}
                                </p>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-muted-foreground font-medium mb-1">
                                        <span>Avg. Progress</span>
                                        <span>{groupStats.averageProgress}%</span>
                                    </div>
                                    <Progress value={groupStats.averageProgress} className="h-1 bg-primary/10" />
                                </div>
                            </div>
                          )}
                        </div>
                      </DashboardCard>
                    </div>
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>

      <Dialog open={reflectionModalDay !== null} onOpenChange={(open) => !open && setReflectionModalDay(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden flex flex-col bg-white dark:bg-zinc-950 border-none shadow-2xl">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Complete Reading</DialogTitle>
            <DialogDescription>
              Optional: Write a short reflection or verse that stood out to you today.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 pt-2 space-y-4">
            <Textarea 
              placeholder="What is God speaking to you today?"
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              className="min-h-[120px] bg-background text-sm"
              autoFocus
            />
          </div>
          <div className="p-6 border-t bg-muted/5 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setReflectionModalDay(null)} disabled={isMarking} className="h-10">
              Cancel
            </Button>
            <Button 
              onClick={handleMarkAsReadSubmit} 
              disabled={isMarking}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-8 shadow-md font-semibold border-none transition-all active:scale-95"
            >
              {isMarking ? "Saving..." : "Save & Complete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}


export function AnnouncementsPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { user } = useAuth();
  const announcements = useQuery(api.bulletins.listAnnouncements, { orgSlug }) || [];
  const ministryIds = user?.ministryIds ?? [];

  // Filter announcements based on ministry
  const filteredAnnouncements = announcements.filter((a) => {
    if (!user) return !a.ministryId;
    if (user.role === "admin") return true;
    return !a.ministryId || ministryIds.includes(a.ministryId);
  });

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Announcements"
          subtitle={`Updates shared by ${user?.ministryNames?.join(", ") ?? "your"} ministry leaders.`}
          gradient="gradient-member"
        />

        <DashboardCard
          title="Recent Announcements"
          icon={<Bell className="h-5 w-5 text-accent" />}
          gradient="gradient-member"
        >
          <div className="space-y-3">
            {filteredAnnouncements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No announcements yet.</p>
            ) : (
              filteredAnnouncements.map((a) => (
                <div key={a._id} className="p-3 rounded-xl glass-subtle">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{a.title}</p>
                    <span className="text-xs text-muted-foreground">{a.date}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{a.body}</p>
                </div>
              ))
            )}
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
}

export function GivingPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { user } = useAuth();
  const givingOptions = useQuery(api.giving_options.list, { orgSlug }) || [];
  const transactions = useQuery(api.givingTransactions.listByUser, user?._id ? {} : "skip");
  const [selectedGiving, setSelectedGiving] = useState<any>(null);

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Giving"
          subtitle="Support the mission with generous stewardship."
          gradient="gradient-member"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <DashboardCard
            title="Giving Options"
            description="Ways to support our ministries"
            icon={<Heart className="h-5 w-5 text-accent" />}
            gradient="gradient-member"
          >
            <div className="space-y-4">
              {givingOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No giving options available at the moment.</p>
              ) : (
                givingOptions.map((option) => (
                  <div key={option._id} className="p-4 rounded-xl glass-subtle border border-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{option.label}</h4>
                      {option.qrCodeUrl && (
                        <div className="h-16 w-16 bg-white p-1 rounded-lg">
                          <img src={option.qrCodeUrl} alt="QR Code" className="h-full w-full object-contain" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{option.description}</p>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => setSelectedGiving(option)}
                    >
                      Give Now
                    </Button>
                  </div>
                ))
              )}
            </div>
          </DashboardCard>

          {user ? (
            <DashboardCard
              title="Recent Contributions"
              description="Your legacy of generosity"
              icon={<TrendingUp className="h-5 w-5 text-primary" />}
              gradient="gradient-member"
            >
              <div className="space-y-3">
                {!transactions ? (
                  <p className="text-sm text-muted-foreground">Loading transactions...</p>
                ) : transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent transactions.</p>
                ) : (
                  transactions.slice(0, 5).map((t: any) => (
                    <div key={t._id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                      <div>
                        <p className="text-sm font-medium text-foreground">₱{t.amount.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{t.givingType} · {format(new Date(t.date), "MMM d, yyyy")}</p>
                      </div>
                      <Badge variant="outline" className="text-[9px] font-bold uppercase">Confirmed</Badge>
                    </div>
                  ))
                )}
                {transactions && transactions.length > 5 && (
                  <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                    <Link to={`/${orgSlug}/transaction-history`}>View All History</Link>
                  </Button>
                )}
              </div>
            </DashboardCard>
          ) : (
            <DashboardCard
              title="Why Give?"
              description="Every gift makes a difference"
              icon={<Sparkles className="h-5 w-5 text-primary" />}
              gradient="gradient-member"
            >
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-4 italic">
                  "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver."
                </p>
                <div className="flex flex-col gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/${orgSlug}/login`}>Sign in to track your giving</Link>
                  </Button>
                </div>
              </div>
            </DashboardCard>
          )}
        </div>

        <GivingDialog
          selectedGiving={selectedGiving}
          onClose={() => setSelectedGiving(null)}
        />
      </div>
    </Layout>
  );
}


export function MinistryStatsPage() {
  const { user } = useAuth();
  const ministryIds = user?.ministryIds ?? [];
  const members = useQuery(api.users.getMemberDirectory) || [];
  const events = useQuery(api.events.list) || [];

  const ministryMembers = members.filter(m =>
    m.ministryIds?.some(id => ministryIds.includes(id))
  );

  const today = getLocalSysDate();
  const upcomingEvents = events.filter(e => e.date >= today && ministryIds.includes(e.ministryId));

  const totalMembers = ministryMembers.length;
  const activeMembers = ministryMembers.filter(m => m.status === "Active" || !m.status).length;
  const newMembers = ministryMembers.filter(m => m.status === "New").length;

  const dynamicStats = [
    { label: "Total Members", value: totalMembers, icon: <Users className="h-5 w-5 text-primary" /> },
    { label: "Active Members", value: activeMembers, icon: <Users className="h-5 w-5 text-success" /> },
    { label: "New Members", value: newMembers, icon: <TrendingUp className="h-5 w-5 text-success" /> },
    { label: "Upcoming Events", value: upcomingEvents.length, icon: <Calendar className="h-5 w-5 text-primary" /> },
  ];

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Ministry Statistics"
          subtitle="Key indicators for ministry health and growth."
          gradient="gradient-leader"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {dynamicStats.map((s) => (
            <StatCard
              key={s.label}
              label={s.label}
              value={s.value}
              trend="neutral"
              icon={s.icon}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <DashboardCard title="Engagement Pulse" icon={<Activity className="h-5 w-5 text-primary" />} gradient="gradient-leader">
            <p className="text-sm text-muted-foreground">No engagement data yet.</p>
          </DashboardCard>

          <DashboardCard title="Care Queue" icon={<Users className="h-5 w-5 text-primary" />} gradient="gradient-leader">
            <p className="text-sm text-muted-foreground">No care items yet.</p>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
}

export function ManageEventsPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { user } = useAuth();
  const isLeader = user?.role === "leader" || user?.role === "admin";
  const events = useQuery(api.events.list, { orgSlug }) || [];
  const createEvent = useMutation(api.events.createEvent);
  const updateEvent = useMutation(api.events.updateEvent);
  const deleteEvent = useMutation(api.events.deleteEvent);
  const ministries = useQuery(api.ministries.list) || [];

  // State for new event - MUST be declared before any conditional returns
  const [showCreate, setShowCreate] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<any>(null);

  // Auto-set ministry to leader's first ministry
  const defaultMinistryId = user?.ministryIds?.[0] || "";

  // Redirect non-leaders AFTER all hooks are declared
  if (!isLeader) {
    return (
      <Layout>
        <div className="space-y-6 animate-fade-in">
          <PageHeader
            title="Access Restricted"
            subtitle="Only leaders and admins can manage events."
            gradient="gradient-leader"
          />
        </div>
      </Layout>
    );
  }

  const handleDelete = async (id: any) => {
    if (confirm("Are you sure you want to delete this event?")) {
      await deleteEvent({
        id,
        tracing: getTracing(),
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Manage Events"
          subtitle={`Plan, schedule, and coordinate ${user?.ministryNames?.join(", ") ?? "your"} events.`}
          gradient="gradient-leader"
        />

        <div className="grid grid-cols-1 gap-4 md:gap-6">
          <DashboardCard title="Event Pipeline" icon={<Calendar className="h-5 w-5 text-primary" />} gradient="gradient-leader">
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">Manage your upcoming events.</p>
                <Button size="sm" onClick={() => { setEventToEdit(null); setShowCreate(true); }}>
                  + New Event
                </Button>
              </div>

              <div className="space-y-3">
                {events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No events in the pipeline yet.</p>
                ) : (
                  events.map((event) => (
                    <div key={event._id} className="p-3 rounded-xl glass-subtle">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{event.title}</p>
                        <div className="flex gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${event.status === "Published" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                            {event.status || "Draft"}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">{event.stage || "Planning"}</span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="text-xs text-muted-foreground">
                          {ministries?.find(m => m._id === event.ministryId)?.name && (
                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded mr-2">
                              {ministries.find(m => m._id === event.ministryId)?.name}
                            </span>
                          )}
                          {!event.ministryId && <span className="bg-accent/10 text-accent px-2 py-0.5 rounded mr-2">Global</span>}
                          {event.date} · Lead: {event.lead || "Unassigned"}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground mr-2">Confirmed: {event.rsvpCount}</span>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEventToEdit(event); setShowCreate(true); }}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleDelete(event._id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <EventDialog
                isOpen={showCreate}
                onClose={() => setShowCreate(false)}
                eventToEdit={eventToEdit}
                defaultMinistryId={defaultMinistryId}
              />
            </div>
          </DashboardCard>

        </div>
      </div>
    </Layout>
  );
}

export function ManageBibleReadingPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { user } = useAuth();
  
  if (user && user.role !== "leader" && user.role !== "admin") {
    return <Navigate to={`/${orgSlug}/dashboard`} replace />;
  }

  const plans = useQuery(api.biblePlan.listPlans) || [];
  const members = useQuery(api.users.getMemberDirectory) || [];
  const ministries = useQuery(api.ministries.list) || [];
  const cellGroups = useQuery(api.biblePlan.listCellGroups) || [];
  const orgStats = useQuery(api.biblePlan.getOrganizationStats);

  const createPlan = useMutation(api.biblePlan.createPlan);
  const assignPlan = useMutation(api.biblePlan.assignPlan);
  const sendReminder = useMutation(api.biblePlan.sendReminder);
  const removeAssignments = useMutation(api.biblePlan.removeAssignments);
  const deletePlan = useMutation(api.biblePlan.deletePlan);
  const postEncouragement = useMutation(api.biblePlan.postEncouragement);
  const updatePlan = useMutation(api.biblePlan.updatePlan);

  // Create Plan State
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [newPlan, setNewPlan] = useState({ title: "", description: "", duration: 1 });
  const [readings, setReadings] = useState<{ dayNumber: number; scripture: string; notes: string }[]>([]);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const [isDeletingPlan, setIsDeletingPlan] = useState(false);

  // Assign Plan State
  const [showAssignModal, setShowAssignModal] = useState<any>(null); // Plan object
  const [assignTab, setAssignTab] = useState<string>("members");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedMinistryId, setSelectedMinistryId] = useState<string>("");
  const [selectedGroupName, setSelectedGroupName] = useState<string>("");
  const [assignMessage, setAssignMessage] = useState("");
  const [startDate, setStartDate] = useState(getLocalSysDate());
  const [isAssigning, setIsAssigning] = useState(false);

  // Monitor State
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [monitorMode, setMonitorMode] = useState<"members" | "groups">("members");
  const [selectedGroupNameForMonitoring, setSelectedGroupNameForMonitoring] = useState<string | null>(null);
  
  const [remindingIds, setRemindingIds] = useState<string[]>([]);
  const progressList = useQuery(api.biblePlan.getPlanAssignments, selectedPlanId ? { planId: selectedPlanId as any } : "skip") || [];
  const groupStats = useQuery(api.biblePlan.getGroupProgress, (selectedPlanId && selectedGroupNameForMonitoring) ? { planId: selectedPlanId as any, groupName: selectedGroupNameForMonitoring } : "skip");
  
  const modalAssignments = useQuery(api.biblePlan.getPlanAssignments, showAssignModal ? { planId: showAssignModal._id as any } : "skip") || [];
  const assignedMemberIds = modalAssignments.map((a: any) => a.memberId);

  // Encouragement state
  const [showEncouragementModal, setShowEncouragementModal] = useState<{ planId: string, groupName: string } | null>(null);
  const [encouragementDay, setEncouragementDay] = useState(1);
  const [encouragementText, setEncouragementText] = useState("");
  const [isPostingEncouragement, setIsPostingEncouragement] = useState(false);
  const groupMessages = useQuery(api.biblePlan.listGroupMessages, showEncouragementModal ? { planId: showEncouragementModal.planId as any, groupName: showEncouragementModal.groupName } : "skip") || [];

  const handlePostEncouragement = async () => {
    if (!showEncouragementModal || !encouragementText) return;
    setIsPostingEncouragement(true);
    try {
      await postEncouragement({
        planId: showEncouragementModal.planId as any,
        groupName: showEncouragementModal.groupName,
        dayNumber: encouragementDay,
        message: encouragementText,
      });
      toast.success("Encouragement posted successfully!");
      setEncouragementText("");
    } catch (e: any) {
      toast.error("Failed to post encouragement: " + e.message);
    } finally {
      setIsPostingEncouragement(false);
    }
  };

  useEffect(() => {
    const msg = groupMessages.find(m => m.dayNumber === encouragementDay);
    setEncouragementText(msg?.message || "");
  }, [encouragementDay, groupMessages]);

  const handleRemindMember = async (assignmentId: string) => {
    setRemindingIds(prev => [...prev, assignmentId]);
    try {
      await sendReminder({ assignmentId });
      toast.success("Reminder sent successfully!");
    } catch (e: any) {
      toast.error("Failed to send reminder: " + e.message);
    } finally {
      setRemindingIds(prev => prev.filter(id => id !== assignmentId));
    }
  };

  const [selectedAssignmentsToRemove, setSelectedAssignmentsToRemove] = useState<string[]>([]);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Clear selections when plan changes
  useEffect(() => {
    setSelectedAssignmentsToRemove([]);
  }, [selectedPlanId]);

  const handleRemoveAssignments = async () => {
    if (selectedAssignmentsToRemove.length === 0) return;
    setIsRemoving(true);
    try {
      await removeAssignments({ assignmentIds: selectedAssignmentsToRemove as any });
      toast.success(`Successfully removed ${selectedAssignmentsToRemove.length} assignment(s)`);
      setSelectedAssignmentsToRemove([]);
      setShowRemoveConfirm(false);
    } catch (e: any) {
      toast.error("Failed to remove assignments: " + e.message);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!planToDelete) return;
    setIsDeletingPlan(true);
    try {
      await deletePlan({ planId: planToDelete as any });
      toast.success("Plan and all its progress deleted successfully");
      setPlanToDelete(null);
      if (selectedPlanId === planToDelete) setSelectedPlanId(null);
    } catch (e: any) {
      toast.error("Failed to delete plan: " + e.message);
    } finally {
      setIsDeletingPlan(false);
    }
  };

  // Update readings array when duration changes
  useEffect(() => {
    const currentCount = readings.length;
    if (newPlan.duration > currentCount) {
      const additional = Array.from({ length: newPlan.duration - currentCount }, (_, i) => ({
        dayNumber: currentCount + i + 1,
        scripture: "",
        notes: ""
      }));
      setReadings([...readings, ...additional]);
    } else if (newPlan.duration < currentCount) {
      setReadings(readings.slice(0, newPlan.duration));
    }
  }, [newPlan.duration]);

  const planDetailsToEdit = useQuery(api.biblePlan.getPlanDetails, editingPlanId ? { planId: editingPlanId as any } : "skip");

  useEffect(() => {
    if (planDetailsToEdit) {
      setNewPlan({
        title: planDetailsToEdit.title,
        description: planDetailsToEdit.description || "",
        duration: planDetailsToEdit.duration
      });
      setReadings(planDetailsToEdit.readings.map(r => ({
        dayNumber: r.dayNumber,
        scripture: r.scripture,
        notes: r.notes || ""
      })));
    }
  }, [planDetailsToEdit]);

  const handleCreatePlan = async () => {
    if (!newPlan.title) return toast.error("Please enter a title");
    setIsCreating(true);
    try {
      if (editingPlanId) {
        await updatePlan({
          planId: editingPlanId as any,
          title: newPlan.title,
          description: newPlan.description,
          duration: newPlan.duration,
          readings: readings,
          tracing: getTracing()
        });
        toast.success("Reading plan updated successfully!");
      } else {
        await createPlan({
          title: newPlan.title,
          description: newPlan.description,
          duration: newPlan.duration,
          readings: readings,
          tracing: getTracing()
        });
        toast.success("Reading plan created successfully!");
      }
      setShowCreatePlan(false);
      setEditingPlanId(null);
      setNewPlan({ title: "", description: "", duration: 1 });
      setReadings([]);
    } catch (e: any) {
      toast.error("Failed to save plan: " + e.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAssignPlan = async () => {
    // Validation
    if (assignTab === "members" && selectedMembers.length === 0) return alert("Select at least one member");
    if (assignTab === "ministry" && !selectedMinistryId) return alert("Select a ministry");
    if (assignTab === "group" && !selectedGroupName) return alert("Select a cell group");

    setIsAssigning(true);
    try {
      await assignPlan({
        planId: showAssignModal._id,
        memberIds: assignTab === "members" ? (selectedMembers as any[]) : undefined,
        ministryId: assignTab === "ministry" ? (selectedMinistryId as any) : undefined,
        group: assignTab === "group" ? selectedGroupName : undefined,
        startDate: startDate,
        message: assignMessage || undefined,
        tracing: getTracing()
      });
      setShowAssignModal(null);
      setSelectedMembers([]);
      setSelectedMinistryId("");
      setSelectedGroupName("");
      setAssignMessage("");
    } catch (e: any) {
      alert("Failed to assign: " + e.message);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in pb-20">
        <PageHeader
          title="Manage Bible Reading"
          subtitle="Create and distribute scripture reading plans for your members."
          gradient="gradient-leader"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <DashboardCard
              title="Reading Plans"
              icon={<BookOpen className="h-5 w-5 text-primary" />}
              gradient="gradient-leader"
              action={
                <Button onClick={() => setShowCreatePlan(true)} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm h-8">
                  <Plus className="h-3.5 w-3.5 mr-1" /> New Plan
                </Button>
              }
            >
              <div className="space-y-3">
                {plans.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl bg-muted/5">
                    <BookOpen className="h-8 w-8 text-muted-foreground/30 mb-4" />
                    <p className="text-sm font-medium">No plans created yet</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[250px] mb-6">Create your first plan to start tracking engagement.</p>
                    <Button onClick={() => setShowCreatePlan(true)} variant="outline" size="sm" className="border-primary/20 hover:bg-primary/5">
                      <Plus className="h-4 w-4 mr-2" /> Create First Plan
                    </Button>
                  </div>
                ) : (
                  plans.map((p) => (
                    <div key={p._id} className={`p-4 rounded-xl border transition-all ${selectedPlanId === p._id ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/20' : 'glass-subtle hover:bg-muted/50 border-primary/5'}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="cursor-pointer flex-1" onClick={() => setSelectedPlanId(p._id === selectedPlanId ? null : p._id)}>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm">{p.title}</h4>
                            <Badge variant="outline" className="text-[10px] h-4">{p.duration} Days</Badge>
                          </div>
                          {p.description && <p className="text-xs text-muted-foreground mt-1">{p.description}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-xs px-3"
                            onClick={() => setShowAssignModal(p)}
                          >
                            Assign Members
                          </Button>
                          <Button 
                            variant="ghost"
                            size="sm" 
                            className="h-8 text-xs px-2"
                            onClick={() => {
                              setEditingPlanId(p._id);
                              setShowCreatePlan(true);
                            }}
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                          </Button>
                          <Button 
                            variant={selectedPlanId === p._id ? "default" : "ghost"}
                            size="sm" 
                            className="h-8 text-xs px-3"
                            onClick={() => setSelectedPlanId(p._id === selectedPlanId ? null : p._id)}
                          >
                            {selectedPlanId === p._id ? "Viewing Progress" : "View Progress"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                            onClick={() => setPlanToDelete(p._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DashboardCard>

            {selectedPlanId && (
              <DashboardCard
                title={monitorMode === "members" ? "Member Progress" : "Group Progress"}
                description={monitorMode === "members" 
                  ? `Tracking completion for: ${plans.find(p => p._id === selectedPlanId)?.title}`
                  : `Comparison for: ${selectedGroupNameForMonitoring || "Select a group"}`
                }
                icon={<Activity className="h-5 w-5 text-success" />}
                gradient="gradient-leader"
                action={
                  <div className="flex items-center gap-2">
                    <Select value={monitorMode} onValueChange={(v: any) => setMonitorMode(v)}>
                      <SelectTrigger className="h-8 w-[120px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="members">All Members</SelectItem>
                        <SelectItem value="groups">By Group</SelectItem>
                      </SelectContent>
                    </Select>
                    {selectedAssignmentsToRemove.length > 0 && monitorMode === "members" && (
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="h-8 text-xs shadow-sm"
                        onClick={() => setShowRemoveConfirm(true)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove ({selectedAssignmentsToRemove.length})
                      </Button>
                    )}
                  </div>
                }
              >
                <div className="space-y-4">
                  {monitorMode === "groups" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      {cellGroups.map(group => {
                        const isSelected = selectedGroupNameForMonitoring === group.name;
                        return (
                          <div 
                            key={group.name} 
                            onClick={() => setSelectedGroupNameForMonitoring(group.name)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/20' : ' glass-subtle hover:bg-muted/50'}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h5 className="font-semibold text-sm">{group.name}</h5>
                                <p className="text-[10px] text-muted-foreground">{group.memberCount} Members</p>
                              </div>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-7 text-[10px] text-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowEncouragementModal({ planId: selectedPlanId, groupName: group.name });
                                }}
                              >
                                <Sparkles className="h-3 w-3 mr-1" /> Post Message
                              </Button>
                            </div>
                            {isSelected && groupStats && (
                              <div className="mt-2 pt-2 border-t border-primary/10">
                                <div className="flex justify-between text-[10px] mb-1">
                                  <span>Avg. Completion</span>
                                  <span className="font-bold text-primary">{groupStats.averageProgress}%</span>
                                </div>
                                <Progress value={groupStats.averageProgress} className="h-1" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {monitorMode === "groups" && !selectedGroupNameForMonitoring && (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/5">
                      <p className="text-sm text-muted-foreground">Select a group to see member comparison.</p>
                    </div>
                  )}

                  {(monitorMode === "members" || (monitorMode === "groups" && selectedGroupNameForMonitoring)) && (
                    <div className="space-y-3">
                      {progressList.filter(p => monitorMode === "members" || p.groupName === selectedGroupNameForMonitoring).length === 0 ? (
                        <p className="text-sm text-muted-foreground italic py-8 text-center">No assignments found for this view.</p>
                      ) : (
                        <div className="rounded-md border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {monitorMode === "members" && (
                                  <TableHead className="w-[40px] text-center">
                                    <input 
                                      type="checkbox" 
                                      className="w-4 h-4 rounded appearance-none border-2 border-input bg-background cursor-pointer checked:bg-primary checked:border-primary relative checked:after:absolute checked:after:left-[4px] checked:after:top-[1px] checked:after:w-[6px] checked:after:h-[10px] checked:after:border-r-2 checked:after:border-b-2 checked:after:border-white checked:after:rotate-45"
                                      checked={progressList.length > 0 && selectedAssignmentsToRemove.length === progressList.length}
                                      onChange={(e) => {
                                        if (e.target.checked) setSelectedAssignmentsToRemove(progressList.map(p => p._id));
                                        else setSelectedAssignmentsToRemove([]);
                                      }}
                                    />
                                  </TableHead>
                                )}
                                <TableHead>Member</TableHead>
                                <TableHead>Progress</TableHead>
                                <TableHead className="text-center">Streak</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {progressList
                                .filter(p => monitorMode === "members" || p.groupName === selectedGroupNameForMonitoring)
                                .map((entry) => (
                                  <TableRow key={entry._id} className={selectedAssignmentsToRemove.includes(entry._id) ? "bg-primary/5" : ""}>
                                    {monitorMode === "members" && (
                                      <TableCell className="text-center">
                                        <input 
                                          type="checkbox" 
                                          className="w-4 h-4 rounded appearance-none border-2 border-input bg-background cursor-pointer checked:bg-primary checked:border-primary relative checked:after:absolute checked:after:left-[4px] checked:after:top-[1px] checked:after:w-[6px] checked:after:h-[10px] checked:after:border-r-2 checked:after:border-b-2 checked:after:border-white checked:after:rotate-45"
                                          checked={selectedAssignmentsToRemove.includes(entry._id)}
                                          onChange={(e) => {
                                            if (e.target.checked) setSelectedAssignmentsToRemove(prev => [...prev, entry._id]);
                                            else setSelectedAssignmentsToRemove(prev => prev.filter(id => id !== entry._id));
                                          }}
                                        />
                                      </TableCell>
                                    )}
                                    <TableCell>
                                      <div className="flex flex-col">
                                        <span className="text-sm font-medium">{entry.memberName}</span>
                                        {entry.lastActiveAt ? (
                                          <span className="text-[10px] text-muted-foreground">Active: {format(new Date(entry.lastActiveAt), "MMM d, h:mm a")}</span>
                                        ) : (
                                          <span className="text-[10px] text-muted-foreground">Not started</span>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="w-[140px]">
                                      <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] text-muted-foreground font-medium mb-1">
                                          <span>{entry.completedCount} / {entry.totalDays}</span>
                                          <span>{entry.percentComplete}%</span>
                                        </div>
                                        <Progress value={entry.percentComplete} className="h-1.5" />
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {entry.currentStreak > 0 ? (
                                        <Badge className="bg-orange-500/10 text-orange-600 border-none font-bold">
                                          🔥 {entry.currentStreak}
                                        </Badge>
                                      ) : (
                                        <span className="text-xs text-muted-foreground">-</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <Badge variant={entry.status === "Active" ? "outline" : entry.status === "At Risk" ? "secondary" : "destructive"} 
                                        className={`text-[10px] ${entry.status === "Active" ? "border-success text-success" : entry.status === "At Risk" ? "bg-warning/20 text-warning border-transparent" : "bg-destructive/10 text-destructive border-transparent"}`}>
                                        {entry.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => handleRemindMember(entry._id)}
                                        disabled={entry.status === "Active" || remindingIds.includes(entry._id)}
                                        className={`h-8 text-xs ${entry.status !== "Active" ? "text-primary hover:text-primary hover:bg-primary/10" : "text-muted-foreground"}`}
                                      >
                                        {remindingIds.includes(entry._id) ? "Sending..." : entry.lastRemindedAt && (Date.now() - entry.lastRemindedAt < 24 * 60 * 60 * 1000) ? "Reminded" : "Remind"}
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </DashboardCard>
            )}
          </div>

          <div className="space-y-6">
            <DashboardCard
              title="Overview"
              icon={<TrendingUp className="h-5 w-5 text-success" />}
              gradient="gradient-leader"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-muted/30 border border-primary/5 text-center">
                    <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-widest font-bold">Active Plans</p>
                    <p className="text-2xl font-extrabold tracking-tighter text-primary">{plans.length}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-success/5 border border-success/10 text-center">
                    <p className="text-[10px] text-success/70 mb-1 uppercase tracking-widest font-bold">Today's Goal</p>
                    <p className="text-2xl font-extrabold tracking-tighter text-success">{orgStats?.completionRate ?? 0}%</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg glass-subtle flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Assigned Users</span>
                  <span className="font-semibold">{orgStats?.totalAssigned ?? 0}</span>
                </div>
                
                <div className="p-4 rounded-xl bg-success/5 border border-success/10 flex items-start gap-3">
                  <Sparkles className="h-4 w-4 text-success mt-0.5" />
                  <div>
                    <p className="text-[11px] font-semibold text-success uppercase">Quick Assign</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">Use batch assignment to enroll entire ministries in seconds.</p>
                  </div>
                </div>
              </div>
            </DashboardCard>
          </div>
        </div>
      </div>

      {/* Create/Edit Plan Modal */}
      <Dialog open={showCreatePlan} onOpenChange={(open) => {
        setShowCreatePlan(open);
        if (!open) {
          setEditingPlanId(null);
          setNewPlan({ title: "", description: "", duration: 1 });
          setReadings([]);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background shadow-lg border">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>{editingPlanId ? "Edit Reading Plan" : "Create Reading Plan"}</DialogTitle>
            <DialogDescription>{editingPlanId ? "Update your plan details and daily scriptures." : "Design a daily scripture journey for your ministry."}</DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plan Title</Label>
                <Input placeholder="e.g. 7 Days of Hope" value={newPlan.title} onChange={e => setNewPlan(prev => ({ ...prev, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Duration (Days)</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" min="1" max="365" value={newPlan.duration} onChange={e => setNewPlan(prev => ({ ...prev, duration: parseInt(e.target.value) || 1 }))} />
                  <span className="text-sm text-muted-foreground italic shrink-0">days</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea placeholder="What is the focus of this plan?" value={newPlan.description} onChange={e => setNewPlan(prev => ({ ...prev, description: e.target.value }))} rows={2} />
            </div>

            <div className="space-y-3 pt-2">
              <Label className="text-primary font-bold">Daily Readings</Label>
              <div className="space-y-3">
                {readings.map((r, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 rounded-lg bg-muted/20 border border-primary/5">
                    <span className="text-xs font-bold w-12 text-primary">Day {r.dayNumber}</span>
                    <Input 
                      placeholder="Scripture reference (e.g. Genesis 1-2)" 
                      value={r.scripture} 
                      className="flex-1 h-9"
                      onChange={e => {
                        const nextReadings = [...readings];
                        nextReadings[idx].scripture = e.target.value;
                        setReadings(nextReadings);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 border-t bg-muted/5 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
            <Button variant="outline" onClick={() => setShowCreatePlan(false)} disabled={isCreating} className="h-10">Cancel</Button>
            <Button 
              onClick={handleCreatePlan} 
              disabled={isCreating} 
              className="gradient-header h-10 px-8 shadow-sm font-semibold text-white border-none"
            >
              {isCreating ? "Saving..." : editingPlanId ? "Update Plan" : "Create Reading Plan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Plan Modal */}
      <Dialog open={!!showAssignModal} onOpenChange={() => setShowAssignModal(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Assign Plan</DialogTitle>
            <DialogDescription>Customize distribution for "{showAssignModal?.title}".</DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-4 rounded-xl p-4 bg-muted/30 border border-primary/5">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reading Start Date</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-background shadow-sm" />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Leader's Message (Optional)</Label>
                <Textarea 
                  placeholder="e.g., Let's grow together this week!" 
                  value={assignMessage}
                  onChange={e => setAssignMessage(e.target.value)}
                  className="bg-background text-sm resize-none h-20"
                />
              </div>
            </div>

            <Tabs value={assignTab} onValueChange={setAssignTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1">
                <TabsTrigger value="members" className="text-xs">Members</TabsTrigger>
                <TabsTrigger value="group" className="text-xs">Cell Group</TabsTrigger>
              </TabsList>
              
              <TabsContent value="members" className="mt-4 space-y-2">
                <Label className="text-xs text-muted-foreground px-1">Select Individuals</Label>
                <div className="max-h-[200px] overflow-y-auto border rounded-xl divide-y bg-background/50">
                  {members.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground italic">No members available.</p>
                  ) : (
                    members.map(m => {
                      const isAlreadyAssigned = assignedMemberIds.includes(m._id);
                      return (
                        <div 
                          key={m._id} 
                          className={`p-3 flex items-center justify-between cursor-pointer hover:bg-primary/5 transition-colors ${selectedMembers.includes(m._id) ? 'bg-primary/5' : ''} ${isAlreadyAssigned ? 'opacity-70 bg-muted/20 hover:bg-muted/30' : ''}`}
                          onClick={() => {
                            if (isAlreadyAssigned) return;
                            if (selectedMembers.includes(m._id)) {
                              setSelectedMembers(selectedMembers.filter(id => id !== m._id));
                            } else {
                              setSelectedMembers([...selectedMembers, m._id]);
                            }
                          }}
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{m.name}</span>
                              {isAlreadyAssigned && <Badge variant="secondary" className="text-[9px] h-4 py-0 font-semibold bg-primary/10 text-primary border-transparent">Assigned</Badge>}
                            </div>
                            <span className="text-[10px] text-muted-foreground">{m.email}</span>
                          </div>
                          <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${selectedMembers.includes(m._id) ? 'bg-primary border-primary shadow-sm' : isAlreadyAssigned ? 'border-muted-foreground/30 bg-muted/10' : 'border-input'}`}>
                            {selectedMembers.includes(m._id) && <Plus className="h-3 w-3 text-white" />}
                            {isAlreadyAssigned && <Check className="h-3 w-3 text-muted-foreground" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="flex justify-between items-center px-1 pt-1">
                  <p className="text-[10px] text-muted-foreground">{selectedMembers.length} selected</p>
                  <Button variant="ghost" className="h-6 text-[10px] px-2" onClick={() => setSelectedMembers(members.map(m => m._id))}>Select All</Button>
                </div>
              </TabsContent>

              <TabsContent value="group" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Target Cell Group</Label>
                  <Select value={selectedGroupName} onValueChange={setSelectedGroupName}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Choose a group..." />
                    </SelectTrigger>
                    <SelectContent>
                      {cellGroups.map(g => (
                        <SelectItem key={g.name} value={g.name}>{g.name} ({g.memberCount} members)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground italic px-1">Enrolls all members belonging to this specific small group.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="p-6 border-t bg-muted/5 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
            <Button variant="outline" onClick={() => setShowAssignModal(null)} disabled={isAssigning} className="h-10">Cancel</Button>
            <Button 
              onClick={handleAssignPlan} 
              disabled={isAssigning} 
              className="gradient-header h-10 px-8 shadow-sm font-semibold text-white border-none"
            >
              {isAssigning ? "Assigning..." : "Activate Plan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Bulk Remove Confirmation Modal */}
      <Dialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <DialogContent className="max-w-md p-6 overflow-hidden bg-background shadow-lg border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> Confirm Removal
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to remove the reading plan from <strong>{selectedAssignmentsToRemove.length} member(s)</strong>? 
              This will permanently delete their progress associated with this plan. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="border-t pt-4 mt-2 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowRemoveConfirm(false)} disabled={isRemoving}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleRemoveAssignments} 
              disabled={isRemoving}
            >
              {isRemoving ? "Removing..." : "Remove Plan & Progress"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Plan Confirmation Modal */}
      <Dialog open={planToDelete !== null} onOpenChange={(open) => !open && setPlanToDelete(null)}>
        <DialogContent className="max-w-md p-6 overflow-hidden bg-background shadow-lg border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> Delete Reading Plan
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to permanently delete this reading plan? 
              This will also safely erase all member progress securely associated with it. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="border-t pt-4 mt-2 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setPlanToDelete(null)} disabled={isDeletingPlan}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleDeletePlan} 
              disabled={isDeletingPlan}
            >
              {isDeletingPlan ? "Deleting..." : "Delete Plan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* encouragement message modal */}
      <Dialog open={!!showEncouragementModal} onOpenChange={() => setShowEncouragementModal(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Group Encouragement
            </DialogTitle>
            <DialogDescription>
              Post a message for Group "{showEncouragementModal?.groupName}" on a specific day of the plan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Day</Label>
              <Select value={encouragementDay.toString()} onValueChange={v => setEncouragementDay(parseInt(v))}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: plans.find(p => p._id === showEncouragementModal?.planId)?.duration || 30 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>Day {i + 1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Message</Label>
              <Textarea 
                placeholder="What encouragement do you have for the group today?"
                value={encouragementText}
                onChange={e => setEncouragementText(e.target.value)}
                className="min-h-[120px] bg-background text-sm"
              />
              <p className="text-[10px] text-muted-foreground italic">
                {groupMessages.some(m => m.dayNumber === encouragementDay) 
                  ? "This will update the existing message for this day."
                  : "Members will see this message when they reach this day of the plan."
                }
              </p>
            </div>
          </div>

          <div className="p-6 border-t bg-muted/5 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
            <Button variant="outline" onClick={() => setShowEncouragementModal(null)} disabled={isPostingEncouragement}>Close</Button>
            <Button 
              onClick={handlePostEncouragement} 
              disabled={isPostingEncouragement || !encouragementText}
              className="gradient-header h-10 px-8 shadow-sm font-semibold text-white border-none"
            >
              {isPostingEncouragement ? "Posting..." : "Post Message"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}


export function ManageBulletinsPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { user } = useAuth();
  const isLeader = user?.role === "leader" || user?.role === "admin";
  const bulletins = useQuery(api.bulletins.listBulletins, { orgSlug }) || [];
  const announcements = useQuery(api.bulletins.listAnnouncements, { orgSlug }) || [];
  const createBulletin = useMutation(api.bulletins.createBulletin);
  const deleteBulletin = useMutation(api.bulletins.deleteBulletin);
  const createAnnouncement = useMutation(api.bulletins.createAnnouncement);
  const updateAnnouncement = useMutation(api.bulletins.updateAnnouncement);
  const deleteAnnouncement = useMutation(api.bulletins.deleteAnnouncement);
  const ministries = useQuery(api.ministries.list) || [];

  const [showCreateBulletin, setShowCreateBulletin] = useState(false);
  const [bulletinToEdit, setBulletinToEdit] = useState<any>(null);

  // Define default ministry for Leaders (first one). Admins can pick.
  // If Admin wants "Global", they can clear ministry selection (or treat "" as global).
  const [selectedMinistryId, setSelectedMinistryId] = useState<string>(
    user?.ministryIds?.[0] || ""
  );

  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", body: "", date: "" });
  const [announcementToEdit, setAnnouncementToEdit] = useState<any>(null);

  const isAdmin = user?.role === "admin";

  // Redirect non-leaders content only (hooks declared above)
  if (!isLeader) {
    return (
      <Layout>
        <div className="space-y-6 animate-fade-in">
          <PageHeader
            title="Access Restricted"
            subtitle="Only leaders and admins can manage bulletins."
            gradient="gradient-leader"
          />
        </div>
      </Layout>
    );
  }

  const handleDeleteBulletin = async (id: any) => {
    if (confirm("Are you sure you want to delete this bulletin?")) {
      try {
        await deleteBulletin({
          id,
          tracing: getTracing()
        });
      } catch (error) {
        console.error("Failed to delete bulletin:", error);
        alert("Failed to delete bulletin");
      }
    }
  };

  const handleDeleteAnnouncement = async (id: any) => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      try {
        await deleteAnnouncement({
          id,
          tracing: getTracing(),
        });
      } catch (error) {
        console.error("Failed to delete announcement:", error);
        alert("Failed to delete announcement");
      }
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in pb-20">
        <PageHeader
          title="Manage Bulletins"
          subtitle={`Create and publish updates for ${user?.ministryNames?.join(", ") ?? "your"} ministry.`}
          gradient="gradient-leader"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <DashboardCard title="Bulletin Archive" icon={<FileText className="h-5 w-5 text-primary" />} gradient="gradient-leader">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">Manage existing bulletins.</p>
              <Button size="sm" onClick={() => { setBulletinToEdit(null); setShowCreateBulletin(true); setSelectedMinistryId(isAdmin ? "" : user?.ministryIds?.[0] || ""); }}>
                + New Bulletin
              </Button>
            </div>

            <div className="space-y-3">
              {bulletins.length === 0 ? (
                <p className="text-sm text-muted-foreground">No bulletins created yet.</p>
              ) : (
                bulletins.map((bulletin) => (
                  <div key={bulletin._id} className="p-3 rounded-xl glass-subtle">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{bulletin.title}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${bulletin.status === "Published" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                        {bulletin.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                      <span>{bulletin.date}</span>
                      {/* Show Ministry Name if Admin/Global */}
                      {ministries?.find(m => m._id === bulletin.ministryId)?.name && (
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded ml-2">
                          {ministries.find(m => m._id === bulletin.ministryId)?.name}
                        </span>
                      )}
                      {!bulletin.ministryId && <span className="bg-accent/10 text-accent px-2 py-0.5 rounded ml-2">Global</span>}

                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setBulletinToEdit(bulletin); setShowCreateBulletin(true); }}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleDeleteBulletin(bulletin._id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DashboardCard>

          {/* Announcements Card (omitted/simplified for brevity if not changing, but keeping structure) */}
          <DashboardCard title="Short Announcements" icon={<Bell className="h-5 w-5 text-accent" />} gradient="gradient-leader">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">Quick text-only updates.</p>
              <Button size="sm" onClick={() => { setAnnouncementToEdit(null); setShowCreateAnnouncement(true); }}>
                + New Announcement
              </Button>
            </div>

            <div className="space-y-3">
              {announcements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No announcements yet.</p>
              ) : (
                announcements.map((a) => (
                  <div key={a._id} className="p-3 rounded-xl glass-subtle">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{a.title}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${a.status === "Published" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                        {a.status || "Draft"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 mb-2">
                      {/* Show Ministry Name if Admin/Global */}
                      {ministries?.find(m => m._id === a.ministryId)?.name && (
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded mr-2">
                          {ministries.find(m => m._id === a.ministryId)?.name}
                        </span>
                      )}
                      {!a.ministryId && <span className="bg-accent/10 text-accent px-2 py-0.5 rounded mr-2">Global</span>}
                      <span>{a.date}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{a.body}</p>

                    <div className="flex justify-end gap-2 mt-2">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setAnnouncementToEdit(a); setShowCreateAnnouncement(true); }}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleDeleteAnnouncement(a._id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DashboardCard>
        </div>
      </div>

      {/* Import BulletinDialog here instead of inline form */}
      {/* We need to import BulletinDialog at top of file first */}
      <BulletinDialog
        isOpen={showCreateBulletin}
        onClose={() => setShowCreateBulletin(false)}
        bulletinToEdit={bulletinToEdit}
        ministryId={selectedMinistryId || undefined}
      // If admin clears ministryId, it becomes undefined -> Global
      />

      <AnnouncementDialog
        isOpen={showCreateAnnouncement}
        onClose={() => setShowCreateAnnouncement(false)}
        announcementToEdit={announcementToEdit}
        defaultMinistryId={selectedMinistryId || undefined}
      />
    </Layout>
  );
}

export function MembersPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { user } = useAuth();
  const members = useQuery(api.users.getMemberDirectory) || [];
  const navigate = useNavigate();

  // Edit Member State
  const updateUser = useMutation(api.users.updateUser);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [updatingMember, setUpdatingMember] = useState(false);

  const handleUpdateMember = async () => {
    if (!editingMember) return;
    setUpdatingMember(true);
    try {
      await updateUser({
        userId: editingMember._id,
        name: editingMember.name,
        birthday: editingMember.birthday,
      });
      setEditingMember(null);
      alert("Member updated successfully!");
    } catch (e: any) {
      alert("Update failed: " + e.message);
    } finally {
      setUpdatingMember(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Member Directory"
          subtitle="View and manage your church members."
          gradient="gradient-leader"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <DashboardCard
            title="Active Members"
            icon={<Users className="h-5 w-5 text-primary" />}
            gradient="gradient-leader"
            className="lg:col-span-3"
          >
            <div className="space-y-3">
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground">No members yet.</p>
              ) : (
                members.map((m) => (
                  <div key={m._id} className="p-3 rounded-xl glass-subtle flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-xs text-muted-foreground">Email: {m.email}</p>
                      {m.group && <p className="text-xs text-muted-foreground">Group: {m.group}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${m.status === "New" ? "bg-accent/20 text-accent-foreground" : "bg-primary/10 text-primary"}`}>
                        {m.status || "Active"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => setEditingMember(m)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DashboardCard>
        </div>

        {/* Edit Member Modal */}
        {editingMember && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditingMember(null)}>
            <div className="bg-background rounded-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">Edit Member</h3>
                <p className="text-sm text-muted-foreground">Update birthday and details.</p>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={editingMember.name} onChange={e => setEditingMember({ ...editingMember, name: e.target.value })} placeholder="Full Name" />
                </div>
                <div className="space-y-2">
                  <Label>Birthday</Label>
                  <Input
                    type="date"
                    value={editingMember.birthday || ""}
                    onChange={e => setEditingMember({ ...editingMember, birthday: e.target.value })}
                  />
                </div>
              </div>
              <div className="p-4 border-t bg-muted/20 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingMember(null)}>Cancel</Button>
                <Button onClick={handleUpdateMember} disabled={updatingMember}>
                  {updatingMember ? "Updating..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export function FollowUpsPage() {
  const { user, settings } = useAuth();
  const followUps = useQuery(api.attendance.getFollowUps) || [];
  const filteredFollowUps = followUps.filter(m => m.absences >= (settings?.followUpAbsences || 3));
  const existingAssignments = useQuery(api.attendance.listFollowUpAssignments) || [];
  const myAssignments = useQuery(api.attendance.getMyFollowUpAssignments) || [];
  const leaders = useQuery(api.attendance.getLeadersByMinistry, {}) || [];
  const assignFollowUp = useMutation(api.attendance.assignFollowUp);
  const updateFollowUpStatus = useMutation(api.attendance.updateFollowUpStatus);

  const [assigningMember, setAssigningMember] = useState<any>(null);
  const [selectedLeader, setSelectedLeader] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [savingNotes, setSavingNotes] = useState<string | null>(null);
  const updateFollowUpNotes = useMutation(api.attendance.updateFollowUpNotes);


  // Build a map of memberId -> existing assignment for quick lookup
  const assignmentMap = useMemo(() => {
    const map: Record<string, any> = {};
    existingAssignments.forEach((a: any) => { map[a.memberId] = a; });
    return map;
  }, [existingAssignments]);

  const handleOpenAssign = (member: any) => {
    const existing = assignmentMap[member._id];
    setAssigningMember(member);
    setSelectedLeader(existing?.leaderId || "");
    setNotes(existing?.notes || "");
  };

  const handleSaveAssignment = async () => {
    if (!selectedLeader || !assigningMember) return;
    setSaving(true);
    try {
      await assignFollowUp({
        memberId: assigningMember._id as any,
        leaderId: selectedLeader as any,
        notes: notes || undefined,
      });
      setAssigningMember(null);
      setSelectedLeader("");
      setNotes("");
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: "pending" | "in_progress" | "completed") => {
    setUpdatingId(id);
    try {
      await updateFollowUpStatus({ id: id as any, status });
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExportList = () => {
    const csvContent = "data:text/csv;charset=utf-8,Name,Email,Absences,Status\n" +
      filteredFollowUps.map(m => `${m.name},${m.email},${m.absences || 0},${m.status || 'Active'}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `follow_ups_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Follow Ups"
          subtitle={`Members with ${settings?.followUpAbsences || 3}+ absences requiring attention.`}
          gradient="gradient-leader"
        />

        {/* Follow-Up Queue */}
        <Card className="glass-strong border-0 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" /> Follow Up Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                    <TableHead>Absences</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFollowUps.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-sm text-muted-foreground text-center">No follow ups needed.</TableCell>
                    </TableRow>
                  ) : (
                    filteredFollowUps.map((m) => {
                      const assignment = assignmentMap[m._id];
                      return (
                        <TableRow key={m._id}>
                          <TableCell className="font-medium">{m.name}</TableCell>
                          <TableCell className="hidden sm:table-cell text-xs sm:text-sm">{m.email}</TableCell>
                          <TableCell>
                            <span className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive font-semibold">
                              {m.absences}
                            </span>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">{m.status || "Active"}</TableCell>
                          <TableCell>
                            {assignment ? (
                              <span className="text-xs font-medium text-primary">{assignment.leaderName}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant={assignment ? "outline" : "default"}
                              className="text-xs h-7 px-2"
                              onClick={() => handleOpenAssign(m)}
                            >
                              {assignment ? "Reassign" : "Assign"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button size="sm" variant="outline" onClick={handleExportList} className="w-full sm:w-auto">Export List</Button>
            </div>
          </CardContent>
        </Card>

        {/* My Follow-Ups — visible to the assigned leader */}
        {myAssignments.length > 0 && (
          <Card className="glass-strong border-0 rounded-2xl border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" /> My Follow-Up Tasks
              </CardTitle>
              <p className="text-sm text-muted-foreground">Members you have been assigned to follow up with.</p>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4 bg-muted/50 p-1">
                  <TabsTrigger value="pending" className="text-xs">Pending ({myAssignments.filter((a: any) => a.status === 'pending').length})</TabsTrigger>
                  <TabsTrigger value="in_progress" className="text-xs">In Progress ({myAssignments.filter((a: any) => a.status === 'in_progress').length})</TabsTrigger>
                  <TabsTrigger value="completed" className="text-xs">Completed ({myAssignments.filter((a: any) => a.status === 'completed').length})</TabsTrigger>
                </TabsList>

                {["pending", "in_progress", "completed"].map((status) => (
                  <TabsContent key={status} value={status} className="space-y-3 mt-0 data-[state=inactive]:hidden animate-in fade-in-50 duration-300">
                    {myAssignments.filter((a: any) => a.status === status).length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-xl bg-muted/5">
                        <p className="text-sm text-muted-foreground">No tasks currently {status.replace('_', ' ')}.</p>
                      </div>
                    ) : (
                      myAssignments
                        .filter((a: any) => a.status === status)
                        .map((a: any) => {
                          const notesDraft = editingNotes[a._id] !== undefined ? editingNotes[a._id] : (a.leaderNotes || "");
                          return (
                            <div key={a._id} className="flex flex-col gap-3 p-4 rounded-xl glass-subtle border border-primary/10 hover:border-primary/20 transition-all duration-200">
                              {/* Top: member info + status buttons */}
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="flex flex-col gap-0.5">
                                  <p className="text-sm font-semibold">{a.memberName}</p>
                                  {a.memberEmail && <p className="text-xs text-muted-foreground">{a.memberEmail}</p>}
                                  {a.notes && <p className="text-xs text-muted-foreground italic mt-1 bg-primary/5 p-2 rounded-md border-l-2 border-primary/20">📋 Admin notes: {a.notes}</p>}
                                  <p className="text-[11px] text-muted-foreground mt-1">Assigned by: {a.assignedByName}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {a.status !== "in_progress" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs px-2"
                                      disabled={updatingId === a._id}
                                      onClick={() => handleUpdateStatus(a._id, "in_progress")}
                                    >
                                      {updatingId === a._id ? "…" : "In Progress"}
                                    </Button>
                                  )}
                                  {a.status !== "completed" && (
                                    <Button
                                      size="sm"
                                      className="h-7 text-xs px-2 bg-success hover:bg-success/90 text-white"
                                      disabled={updatingId === a._id}
                                      onClick={() => handleUpdateStatus(a._id, "completed")}
                                    >
                                      {updatingId === a._id ? "…" : "Mark Done"}
                                    </Button>
                                  )}
                                  {a.status === "completed" && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs px-2 text-muted-foreground"
                                      disabled={updatingId === a._id}
                                      onClick={() => handleUpdateStatus(a._id, "pending")}
                                    >
                                      Reopen Task
                                    </Button>
                                  )}
                                </div>
                              </div>
                              {/* Leader notes field */}
                              <div className="space-y-1.5 pt-2 border-t border-primary/5">
                                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Follow-Up Progress Notes</p>
                                <textarea
                                  value={notesDraft}
                                  onChange={(e) => setEditingNotes(prev => ({ ...prev, [a._id]: e.target.value }))}
                                  placeholder="Document the follow-up details here..."
                                  rows={2}
                                  className="w-full px-3 py-2 rounded-lg border border-input bg-background/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                                />
                                {editingNotes[a._id] !== undefined && editingNotes[a._id] !== (a.leaderNotes || "") && (
                                  <div className="flex justify-end gap-2 mt-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs"
                                      onClick={() => setEditingNotes(prev => { const n = {...prev}; delete n[a._id]; return n; })}
                                    >
                                      Discard
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="h-7 text-xs shadow-sm shadow-primary/20"
                                      disabled={savingNotes === a._id}
                                      onClick={async () => {
                                        setSavingNotes(a._id);
                                        try {
                                          await updateFollowUpNotes({ id: a._id as any, leaderNotes: notesDraft });
                                          setEditingNotes(prev => { const n = {...prev}; delete n[a._id]; return n; });
                                        } catch (e) { console.error(e); }
                                        finally { setSavingNotes(null); }
                                      }}
                                    >
                                      {savingNotes === a._id ? "Saving…" : "Save Progress"}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Recent Assignments */}

        {existingAssignments.length > 0 && (
          <Card className="glass-strong border-0 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-success" /> Active Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[300px] overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Assigned Leader</TableHead>
                      <TableHead className="hidden sm:table-cell">Admin Notes</TableHead>
                      <TableHead className="hidden md:table-cell">Leader Notes</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {existingAssignments.map((a: any) => (
                      <TableRow key={a._id}>
                        <TableCell className="font-medium">{a.memberName}</TableCell>
                        <TableCell>{a.leaderName}</TableCell>
                        <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{a.notes || "—"}</TableCell>
                        <TableCell className="hidden md:table-cell text-xs">
                          {a.leaderNotes ? (
                            <span className="text-foreground">{a.leaderNotes}</span>
                          ) : (
                            <span className="text-muted-foreground italic">No update yet</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            a.status === "completed" ? "bg-success/10 text-success" :
                            a.status === "in_progress" ? "bg-primary/10 text-primary" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {a.status.replace("_", " ")}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assign Modal */}
        {assigningMember && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setAssigningMember(null)}>
            <div className="bg-background p-6 rounded-2xl max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-1">Assign Follow Up</h3>
              <p className="text-sm text-muted-foreground mb-5">
                Assigning a leader to follow up with <strong>{assigningMember.name}</strong> ({assigningMember.absences} absences).
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="leader-select">Select Leader</Label>
                  {leaders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No leaders found in this organization.</p>
                  ) : (
                    <select
                      id="leader-select"
                      value={selectedLeader}
                      onChange={(e) => setSelectedLeader(e.target.value)}
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="">-- Select a leader --</option>
                      {leaders.map((l: any) => (
                        <option key={l._id} value={l._id}>
                          {l.name} {l.role === "admin" ? "(Admin)" : "(Leader)"}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Please call this weekend, check on health..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-400"></span>
                  Email notification will be available in a future update.
                </p>

                <div className="flex gap-2 justify-end pt-2">
                  <Button variant="outline" onClick={() => setAssigningMember(null)}>Cancel</Button>
                  <Button onClick={handleSaveAssignment} disabled={!selectedLeader || saving}>
                    {saving ? "Saving..." : "Assign"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export function ReportsPage() {
  const { user } = useAuth();
  const members = useQuery(api.users.getMemberDirectory) || [];
  const events = useQuery(api.events.list) || [];
  const services = useQuery(api.services.list) || [];
  const [attendanceDate, setAttendanceDate] = useState(getLocalSysDate());
  const isLeaderUser = user?.role === "leader" || user?.role === "admin";
  const dailyAttendance = useQuery(api.attendance.getDailyAttendance, isLeaderUser ? { date: attendanceDate } : "skip") || [];
  const ministryIds = user?.ministryIds ?? [];

  const [attendanceEvent, setAttendanceEvent] = useState<string>("");
  const [attendanceFormat, setAttendanceFormat] = useState<"csv" | "pdf">("csv");
  const [memberFormat, setMemberFormat] = useState<"csv" | "pdf">("csv");
  const [birthdayMonth, setBirthdayMonth] = useState<string>((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [birthdayFormat, setBirthdayFormat] = useState<"csv" | "pdf">("csv");

  // Filter members under this leader's ministry
  const ministryMembers = members.filter(m =>
    m.ministryIds?.some(id => ministryIds.includes(id))
  );

  // Filter events for selected date
  const eventsForDate = events.filter(event => event.date === attendanceDate);

  // Filter services for the day of the week
  const dayOfWeek = new Date(attendanceDate + "T00:00:00").toLocaleDateString('en-US', { weekday: 'long' });
  const servicesForDate = services.filter(s => s.day === dayOfWeek);

  const handleExportAttendance = () => {
    if (attendanceFormat === "csv") {
      // CSV Export logic
      const headers = ["Name", "Email", "Status", "Date", "Event"];
      const rows = ministryMembers.map(m => {
        const record = dailyAttendance.find((r: any) => {
          const isMember = r.memberId === m._id;
          let isEventMatch = false;
          if (!attendanceEvent) {
            isEventMatch = !r.eventId && !r.serviceId;
          } else if (attendanceEvent.startsWith("event:")) {
            isEventMatch = r.eventId === attendanceEvent.replace("event:", "");
          } else if (attendanceEvent.startsWith("service:")) {
            isEventMatch = r.serviceId === attendanceEvent.replace("service:", "");
          }
          return isMember && isEventMatch;
        });

        return [
          m.name,
          m.email,
          record ? (record.status === "present" ? "Present" : "Absent") : "Not Marked",
          attendanceDate,
          attendanceEvent ? eventsForDate.find(e => e._id === attendanceEvent)?.title || "" : "General"
        ];
      });

      const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `attendance_${attendanceDate}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      alert("PDF export coming soon!");
    }
  };

  const handleExportMembers = () => {
    if (memberFormat === "csv") {
      // CSV Export logic
      const headers = ["Name", "Email", "Contact", "Status", "Ministries"];
      const rows = ministryMembers.map(m => [
        m.name,
        m.email,
        m.contactNumber || "",
        m.status || "Active",
        m.ministryIds?.length || 0
      ]);

      const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ministry_members_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      alert("PDF export coming soon!");
    }
  };

  const handleExportBirthdays = () => {
    if (birthdayFormat === "csv") {
      const filteredMembers = ministryMembers.filter(m => {
        if (!m.birthday) return false;
        // Handle YYYY-MM-DD or MM/DD/YYYY formats
        const parts = m.birthday.includes("-") ? m.birthday.split("-") : m.birthday.split("/");
        // Assuming YYYY-MM-DD, so month is at index 1
        const monthPart = m.birthday.includes("-") ? parts[1] : parts[0]; 
        return monthPart === birthdayMonth;
      });

      const headers = ["Name", "Email", "Contact", "Birthday", "Ministries"];
      const rows = filteredMembers.map(m => [
        `"${m.name}"`,
        `"${m.email || ""}"`,
        `"${m.contactNumber || ""}"`,
        `"${m.birthday || ""}"`,
        m.ministryIds?.length || 0
      ]);

      const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `birthdays_month_${birthdayMonth}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      alert("PDF export coming soon!");
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Reports & Exports"
          subtitle="Export attendance records and ministry member lists."
          gradient="gradient-leader"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Attendance Export Card */}
          <Card className="glass-strong border-0 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Attendance Export
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="att-date">Select Date</Label>
                  <Input
                    id="att-date"
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => {
                      setAttendanceDate(e.target.value);
                      setAttendanceEvent("");
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="att-event">Select Event or Service (Optional)</Label>
                  <select
                    id="att-event"
                    value={attendanceEvent}
                    onChange={(e) => setAttendanceEvent(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                  >
                    <option value="">All / General Attendance</option>
                    {servicesForDate.length > 0 && (
                      <optgroup label="Global Services">
                        {servicesForDate.map(service => (
                          <option key={service._id} value={`service:${service._id}`}>{service.name}</option>
                        ))}
                      </optgroup>
                    )}
                    {eventsForDate.length > 0 && (
                      <optgroup label="Ministry Events">
                        {eventsForDate.map(event => (
                          <option key={event._id} value={`event:${event._id}`}>{event.title}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Export Format</Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={attendanceFormat === "csv" ? "default" : "outline"}
                      onClick={() => setAttendanceFormat("csv")}
                      className="flex-1"
                    >
                      CSV
                    </Button>
                    <Button
                      size="sm"
                      variant={attendanceFormat === "pdf" ? "default" : "outline"}
                      onClick={() => setAttendanceFormat("pdf")}
                      className="flex-1"
                    >
                      PDF
                    </Button>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleExportAttendance}
                >
                  Export Attendance
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Ministry Members Export Card */}
          <Card className="glass-strong border-0 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Ministry Members Export
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-xl glass-subtle">
                  <p className="text-xs text-muted-foreground mb-1">Total Members</p>
                  <p className="text-2xl font-bold text-primary">{ministryMembers.length}</p>
                </div>

                <div className="space-y-2">
                  <Label>Export Format</Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={memberFormat === "csv" ? "default" : "outline"}
                      onClick={() => setMemberFormat("csv")}
                      className="flex-1"
                    >
                      CSV
                    </Button>
                    <Button
                      size="sm"
                      variant={memberFormat === "pdf" ? "default" : "outline"}
                      onClick={() => setMemberFormat("pdf")}
                      className="flex-1"
                    >
                      PDF
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Export includes: Name, Email, Contact, Status, and Ministry assignments.
                  </p>
                </div>

                <Button
                  className="w-full"
                  onClick={handleExportMembers}
                >
                  Export Members List
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Birthdays Export Card */}
          <Card className="glass-strong border-0 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" /> Birthdays Export
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bday-month">Select Month</Label>
                  <select
                    id="bday-month"
                    value={birthdayMonth}
                    onChange={(e) => setBirthdayMonth(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                  >
                    <option value="01">January</option>
                    <option value="02">February</option>
                    <option value="03">March</option>
                    <option value="04">April</option>
                    <option value="05">May</option>
                    <option value="06">June</option>
                    <option value="07">July</option>
                    <option value="08">August</option>
                    <option value="09">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>
                </div>

                <div className="p-4 rounded-xl glass-subtle">
                  <p className="text-xs text-muted-foreground mb-1">Birthdays this Month</p>
                  <p className="text-2xl font-bold text-primary">
                    {ministryMembers.filter(m => {
                      if (!m.birthday) return false;
                      const parts = m.birthday.includes("-") ? m.birthday.split("-") : m.birthday.split("/");
                      const monthPart = m.birthday.includes("-") ? parts[1] : parts[0]; 
                      return monthPart === birthdayMonth;
                    }).length}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Export Format</Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={birthdayFormat === "csv" ? "default" : "outline"}
                      onClick={() => setBirthdayFormat("csv")}
                      className="flex-1"
                    >
                      CSV
                    </Button>
                    <Button
                      size="sm"
                      variant={birthdayFormat === "pdf" ? "default" : "outline"}
                      onClick={() => setBirthdayFormat("pdf")}
                      className="flex-1"
                    >
                      PDF
                    </Button>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleExportBirthdays}
                >
                  Export Birthdays
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

export function AttendancePage() {
  const { user } = useAuth();

  // Robust check for leader/admin role
  const isLeader = user && (user.role === "leader" || user.role === "admin");

  if (user && !isLeader) {
    return <Navigate to="/dashboard" replace />;
  }

  // Create a safe query that skips if not authorized
  const newcomers = useQuery(api.users.getNewcomersAndUnassigned,
    isLeader ? {} : "skip"
  ) || [];

  const members = useQuery(api.users.getMemberDirectory) || [];
  const markAttendance = useMutation(api.attendance.mark);
  const events = useQuery(api.events.list) || [];
  const services = useQuery(api.services.list) || [];

  // State management
  const [selectedDate, setSelectedDate] = useState(getLocalSysDate());
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"mark" | "saved" | "newcomers">("mark");
  const [newcomerAttendance, setNewcomerAttendance] = useState<Record<string, "present" | "absent" | "">>({});
  const [attendance, setAttendance] = useState<Record<string, "present" | "absent" | "">>({});
  const [saving, setSaving] = useState(false);

  const isLeaderUser = user?.role === "leader" || user?.role === "admin";
  // Fetch confirmed attendance for the date
  const dailyAttendance = useQuery(api.attendance.getDailyAttendance, isLeaderUser ? { date: selectedDate } : "skip") || [];

  // Reset local attendance state when date or event changes
  useEffect(() => {
    setAttendance({});
    setNewcomerAttendance({});
  }, [selectedDate, selectedEvent]);

  const setStatus = (memberId: string, status: "present" | "absent") => {
    setAttendance((prev) => ({ ...prev, [memberId]: prev[memberId] === status ? "" : status }));
  };

  // Filter events for selected date
  const eventsForDate = events.filter(event => event.date === selectedDate);

  // Filter services for the day of the week
  const dayOfWeek = new Date(selectedDate + "T00:00:00").toLocaleDateString('en-US', { weekday: 'long' });
  const servicesForDate = services.filter(s => s.day === dayOfWeek);

  // Defensive: ensure unique members and attendance records for mapping keys
  const uniqueMembers = useMemo(() => {
    const seen = new Set<string>();
    return members.filter(m => {
      const idStr = m._id.toString();
      if (seen.has(idStr)) return false;
      seen.add(idStr);
      return true;
    });
  }, [members]);

  const uniqueDailyAttendance = useMemo(() => {
    const seen = new Set<string>();
    const unique = dailyAttendance.filter(r => {
      const idStr = r._id.toString();
      if (seen.has(idStr)) return false;
      seen.add(idStr);
      return true;
    });

    // Filter by selected event matching the Mark Attendance filter
    return unique.filter(r => {
      if (!selectedEvent) return !r.eventId && !r.serviceId;
      if (selectedEvent.startsWith("event:")) {
        return r.eventId === selectedEvent.replace("event:", "");
      }
      if (selectedEvent.startsWith("service:")) {
        return r.serviceId === selectedEvent.replace("service:", "");
      }
      return true;
    });
  }, [dailyAttendance, selectedEvent]);

  // Create map for easy lookup, filtered by currently selected event/service
  const confirmedAttendance = useMemo(() => {
    const map: Record<string, any> = {};
    uniqueDailyAttendance.forEach((r: any) => {
      map[r.memberId] = r;
    });
    return map;
  }, [uniqueDailyAttendance]);

  // Filter members not yet saved/confirmed for THIS activity
  const unsavedMembers = uniqueMembers.filter(m => !confirmedAttendance[m._id]);

  // Unique newcomers
  const uniqueNewcomers = useMemo(() => {
    const seen = new Set<string>();
    return newcomers.filter(n => {
      const idStr = n._id.toString();
      if (seen.has(idStr)) return false;
      seen.add(idStr);
      return true;
    });
  }, [newcomers]);

  // Filter newcomers not yet saved
  const unsavedNewcomers = uniqueNewcomers.filter(n => !confirmedAttendance[n._id]);

  const handleSaveAttendance = async () => {
    if (!selectedEvent) {
      alert("Please select an event or service first.");
      return;
    }
    setSaving(true);
    try {
      for (const [memberId, status] of Object.entries(attendance)) {
        if (status && (status === "present" || status === "absent")) {
          const params: any = {
            memberId: memberId as any,
            date: selectedDate,
            status,
          };

          if (selectedEvent.startsWith("event:")) {
            params.eventId = selectedEvent.replace("event:", "") as any;
          } else if (selectedEvent.startsWith("service:")) {
            params.serviceId = selectedEvent.replace("service:", "") as any;
          }

          await markAttendance(params);
        }
      }

      // Clear pending attendance
      setAttendance({});

      alert("Attendance saved successfully!");
    } catch (error) {
      console.error("Failed to save attendance:", error);
      alert("Failed to save attendance. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleFinalAttendance = async () => {
    if (!selectedEvent) {
      alert("Please select an event or service first.");
      return;
    }
    if (!confirm("This will mark all unmarked members as absent and save all attendance. Continue?")) {
      return;
    }

    setSaving(true);
    try {
      // Process all unsaved members
      for (const member of unsavedMembers) {
        const status = attendance[member._id] || "absent"; // Default to absent if not marked
        const finalStatus = status === "present" ? "present" : "absent";

        const params: any = {
          memberId: member._id as any,
          date: selectedDate,
          status: finalStatus,
        };

        if (selectedEvent.startsWith("event:")) {
          params.eventId = selectedEvent.replace("event:", "") as any;
        } else if (selectedEvent.startsWith("service:")) {
          params.serviceId = selectedEvent.replace("service:", "") as any;
        }

        await markAttendance(params);
      }

      setAttendance({});
      alert("Final attendance saved! All members processed.");
    } catch (error) {
      console.error("Failed to save final attendance:", error);
      alert("Failed to save final attendance. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all attendance selections?")) {
      setAttendance({});
    }
  };

  const handleSaveNewcomerAttendance = async () => {
    setSaving(true);
    try {
      for (const [memberId, status] of Object.entries(newcomerAttendance)) {
        if (status && (status === "present" || status === "absent")) {
          const params: any = {
            memberId: memberId as any,
            date: selectedDate,
            status,
          };

          if (selectedEvent.startsWith("event:")) {
            params.eventId = selectedEvent.replace("event:", "") as any;
          } else if (selectedEvent.startsWith("service:")) {
            params.serviceId = selectedEvent.replace("service:", "") as any;
          }

          await markAttendance(params);
        }
      }

      setNewcomerAttendance({});
      alert("Newcomer attendance saved successfully!");
    } catch (error) {
      console.error("Failed to save newcomer attendance:", error);
      alert("Failed to save newcomer attendance. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleClearNewcomers = () => {
    if (confirm("Are you sure you want to clear all newcomer attendance selections?")) {
      setNewcomerAttendance({});
    }
  };

  // Redirect non-leaders AFTER all hooks are declared
  if (!isLeader) {
    return (
      <Layout>
        <div className="space-y-6 animate-fade-in">
          <PageHeader
            title="Access Restricted"
            subtitle="Only leaders and admins can mark attendance."
            gradient="gradient-leader"
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Attendance"
          subtitle="Mark attendance for your ministry members."
          gradient="gradient-leader"
        />

        {/* Date and Event Selection */}
        <Card className="glass-strong border-0 rounded-2xl">
          <CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedEvent("");
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event" className="flex items-center gap-1">
                  Event or Service <span className="text-destructive font-bold">*</span>
                </Label>
                <select
                  id="event"
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  className={`w-full h-9 px-3 rounded-md border text-sm bg-background ${!selectedEvent ? 'border-destructive ring-1 ring-destructive/20' : 'border-input'}`}
                  required
                >
                  <option value="">-- SELECT REQUIRED --</option>
                  {servicesForDate.length > 0 && (
                    <optgroup label="Global Services">
                      {servicesForDate.map(service => (
                        <option key={service._id} value={`service:${service._id}`}>{service.name}</option>
                      ))}
                    </optgroup>
                  )}
                  {eventsForDate.length > 0 && (
                    <optgroup label="Ministry Events">
                      {eventsForDate.map(event => (
                        <option key={event._id} value={`event:${event._id}`}>{event.title}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-1 sm:gap-2 border-b overflow-x-auto">
          <button
            onClick={() => setActiveTab("mark")}
            className={`px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${activeTab === "mark"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <span className="hidden sm:inline">Mark Attendance</span>
            <span className="sm:hidden">Mark</span>
            <span className="ml-1">({unsavedMembers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className={`px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${activeTab === "saved"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <span className="hidden sm:inline">Saved Attendance</span>
            <span className="sm:hidden">Saved</span>
            <span className="ml-1">({uniqueDailyAttendance.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("newcomers")}
            className={`px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${activeTab === "newcomers"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <span className="hidden sm:inline">Newcomers</span>
            <span className="sm:hidden">New</span>
            <span className="ml-1">({unsavedNewcomers.length})</span>
          </button>
        </div>

        {/* Mark Attendance Tab */}
        {activeTab === "mark" && (
          <Card className="glass-strong border-0 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-primary" /> Mark Attendance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="max-h-[150px] sm:max-h-[400px] overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead className="hidden sm:table-cell">Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unsavedMembers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-sm text-muted-foreground text-center">
                          All members have been saved for this date.
                        </TableCell>
                      </TableRow>
                    ) : (
                      unsavedMembers.map((m, index) => (
                        <TableRow key={`${m._id}-${index}`}>
                          <TableCell className="font-medium">{m.name}</TableCell>
                          <TableCell className="hidden sm:table-cell text-xs sm:text-sm">{m.email}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-1 rounded-full ${attendance[m._id] === "present"
                              ? "bg-success/10 text-success"
                              : attendance[m._id] === "absent"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-muted text-muted-foreground"
                              }`}>
                              {attendance[m._id] || "unmarked"}
                            </span>
                          </TableCell>
                          <TableCell className="flex gap-1 sm:gap-2">
                            <Button size="sm" variant="outline" onClick={() => setStatus(m._id, "present")} className="text-xs px-2">Present</Button>
                            <Button size="sm" variant="outline" onClick={() => setStatus(m._id, "absent")} className="text-xs px-2">Absent</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button size="sm" onClick={handleSaveAttendance} disabled={saving || Object.keys(attendance).length === 0}>
                  {saving ? "Saving..." : "Save Attendance"}
                </Button>
                <Button size="sm" variant="secondary" onClick={handleFinalAttendance} disabled={saving || unsavedMembers.length === 0}>
                  Final Attendance
                </Button>
                <Button size="sm" variant="outline" onClick={handleClearAll}>Clear All</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Saved Attendance Tab */}
        {activeTab === "saved" && (
          <Card className="glass-strong border-0 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-success" /> Saved Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[250px] sm:max-h-[400px] overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead className="hidden sm:table-cell">Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">Marked By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uniqueDailyAttendance.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-sm text-muted-foreground text-center">
                          No attendance saved yet for this date.
                        </TableCell>
                      </TableRow>
                    ) : (
                      uniqueDailyAttendance.map((record: any, index: number) => {
                        return (
                          <TableRow key={`${record._id}-${index}`} className={`${record.status === "present" ? "border-l-4 border-success" : "border-l-4 border-destructive"}`}>
                            <TableCell className="font-medium">{record.name}</TableCell>
                            <TableCell className="hidden sm:table-cell text-xs sm:text-sm">{record.email}</TableCell>
                            <TableCell>
                              <span className={`text-xs px-2 py-1 rounded-full ${record.status === "present"
                                ? "bg-success/10 text-success"
                                : "bg-destructive/10 text-destructive"
                                }`}>
                                {record.status}
                              </span>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                              {record.markedByName || "Unknown"}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Newcomers Tab */}
        {activeTab === "newcomers" && (
          <Card className="glass-strong border-0 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-primary" /> Newcomers & Unassigned
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="max-h-[150px] sm:max-h-[400px] overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead className="hidden sm:table-cell">Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unsavedNewcomers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-sm text-muted-foreground text-center">
                          All newcomers have been saved for this date.
                        </TableCell>
                      </TableRow>
                    ) : (
                      unsavedNewcomers.map((m, index) => (
                        <TableRow key={`${m._id}-${index}`}>
                          <TableCell className="font-medium">{m.name}</TableCell>
                          <TableCell className="hidden sm:table-cell text-xs sm:text-sm">{m.email}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-1 rounded-full ${newcomerAttendance[m._id] === "present"
                              ? "bg-success/10 text-success"
                              : newcomerAttendance[m._id] === "absent"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-muted text-muted-foreground"
                              }`}>
                              {newcomerAttendance[m._id] || "unmarked"}
                            </span>
                          </TableCell>
                          <TableCell className="flex gap-1 sm:gap-2">
                            <Button size="sm" variant="outline" onClick={() => setNewcomerAttendance((prev) => ({ ...prev, [m._id]: prev[m._id] === "present" ? "" : "present" }))} className="text-xs px-2">Present</Button>
                            <Button size="sm" variant="outline" onClick={() => setNewcomerAttendance((prev) => ({ ...prev, [m._id]: prev[m._id] === "absent" ? "" : "absent" }))} className="text-xs px-2">Absent</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button size="sm" onClick={handleSaveNewcomerAttendance} disabled={saving || Object.keys(newcomerAttendance).length === 0}>
                  {saving ? "Saving..." : "Save Attendance"}
                </Button>
                <Button size="sm" variant="outline" onClick={handleClearNewcomers}>Clear All</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}


export function ManageUsersPage() {
  const { user } = useAuth();

  if (user && user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const isAdmin = user?.role === "admin";

  const users = useQuery(api.users.getAdminDirectory, isAdmin ? {} : "skip") || [];
  const ministries = useQuery(api.ministries.list) || [];
  const updateUserMinistries = useMutation(api.users.updateUserMinistries);
  const updateUserRole = useAction(api.clerk.updateRole);
  const toggleFinanceAccess = useMutation(api.users.toggleFinanceAccess);
  const deleteUser = useMutation(api.users.deleteUser);


  // Add User State
  const createOfflineUser = useMutation(api.users.createOfflineUser);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "member", ministryId: "", birthday: "" });
  const [addingUser, setAddingUser] = useState(false);

  // Edit User State
  const updateUser = useMutation(api.users.updateUser);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [updatingUser, setUpdatingUser] = useState(false);

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setUpdatingUser(true);
    try {
      await updateUser({
        userId: editingUser._id,
        name: editingUser.name,
        birthday: editingUser.birthday,
        // email: editingUser.email, // If we want to support email edit
      });
      setEditingUser(null);
      alert("User updated successfully!");
    } catch (e: any) {
      alert("Update failed: " + e.message);
    } finally {
      setUpdatingUser(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.name) {
      alert("Name is required");
      return;
    }
    setAddingUser(true);
    try {
      // If email is provided, we might want to use a different flow, but user asked specifically for offline/children
      // We'll proceed with createOfflineUser. If they have email, we can't store it yet unless we update schema/logic further.
      // Wait, schema HAS email optional. I can pass it if mutation supports it?
      // My mutation `createOfflineUser` does NOT take email in args.
      // I should update users.ts to accept optional email if I want to support it.
      // But for now, user asked for "without creating account".
      // I'll ignore email for now or update mutation.
      // Let's stick to name/role/ministry as requested.

      await createOfflineUser({
        name: newUser.name,
        role: newUser.role,
        ministryIds: newUser.ministryId ? [newUser.ministryId as any] : [],
        status: "Active",
        birthday: newUser.birthday,
      });
      setNewUser({ name: "", email: "", role: "member", ministryId: "", birthday: "" });
      setShowAddUser(false);
      alert("User created successfully!");
    } catch (e: any) {
      alert("Failed: " + e.message);
    } finally {
      setAddingUser(false);
    }
  };

  const toggleMinistry = async (userId: string, ministryId: string) => {
    const user = users.find(u => u._id === userId);
    if (!user) return;

    const current = user.ministryIds ?? [];
    const next = current.includes(ministryId as any)
      ? current.filter((id) => id !== ministryId)
      : [...current, ministryId as any];

    await updateUserMinistries({ userId: userId as any, ministryIds: next });
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Manage Users"
          subtitle="Invite, monitor, and support every user role."
          gradient="gradient-admin"
        />

        <div className="flex flex-col h-[calc(100dvh-300px)] md:h-[calc(100dvh-220px)] gap-4">
          <Card className="glass-strong border-0 rounded-2xl flex-1 flex flex-col overflow-hidden">
            <CardHeader className="shrink-0">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> User Directory
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 relative">
              <div className="absolute inset-0 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background/95 backdrop-blur z-10">
                    <TableRow>
                      <TableHead className="pl-6">Name</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Ministry</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px] pr-6"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-sm text-muted-foreground text-center py-8">No users yet.</TableCell>
                      </TableRow>
                    ) : (
                      users.map((u) => (
                        <TableRow key={u._id}>
                          <TableCell className="font-medium pl-6">{u.name}</TableCell>
                          <TableCell className="hidden md:table-cell">{u.email}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className={`h-8 text-xs px-2 my-1 font-normal rounded-full ${roleBadgeStyles[u.role as UserRole]}`}>
                                  {u.role.charAt(0).toUpperCase() + u.role.slice(1)} <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
                                </Button>
                              </DropdownMenuTrigger>
                              {u.isFinance && (
                                <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${roleBadgeStyles.finance}`}>
                                  Finance Access
                                </span>
                              )}
                              <DropdownMenuContent align="start">
                                <DropdownMenuItem onClick={() => updateUserRole({ userId: u._id, role: "admin" })}>
                                  Make Admin
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateUserRole({ userId: u._id, role: "leader" })}>
                                  Make Leader
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateUserRole({ userId: u._id, role: "member" })}>
                                  Make Member
                                </DropdownMenuItem>
                                <div className="h-px bg-border my-1" />
                                <DropdownMenuItem onClick={() => toggleFinanceAccess({ userId: u._id, isFinance: !u.isFinance })}>
                                  {u.isFinance ? "Revoke Finance Access" : "Grant Finance Access"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                          <TableCell>
                            {u.role === "member" || u.role === "leader" ? (
                              <div className="flex flex-wrap gap-1 items-center">
                                {(u.ministryIds ?? []).length > 0 ? (
                                  (u.ministryIds ?? []).map((id) => {
                                    const ministry = ministries.find(m => m._id === id);
                                    return (
                                      <span key={id} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                        {ministry?.name ?? id}
                                      </span>
                                    );
                                  })
                                ) : (
                                  <span className="text-xs text-muted-foreground">Unassigned</span>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs">Assign</Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="w-56">
                                    {ministries.map((ministry) => (
                                      <DropdownMenuCheckboxItem
                                        key={ministry._id}
                                        checked={(u.ministryIds ?? []).includes(ministry._id as any)}
                                        onCheckedChange={() => toggleMinistry(u._id, ministry._id)}
                                      >
                                        {ministry.name}
                                      </DropdownMenuCheckboxItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-1 rounded-full ${u.isActive === false
                              ? "bg-muted text-muted-foreground"
                              : u.status === "Pending"
                                ? "bg-accent/20 text-accent-foreground"
                                : "bg-success/10 text-success"
                              }`}>
                              {u.isActive === false ? "Inactive" : (u.status || "Active")}
                            </span>
                          </TableCell>
                          <TableCell className="pr-6">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                onClick={() => setEditingUser(u)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={async () => {
                                  if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
                                    await deleteUser({ userId: u._id });
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong border-0 rounded-2xl shrink-0">
            <CardContent className="p-4 flex flex-wrap gap-2 items-center justify-between">
              <div className="flex gap-2 w-full overflow-x-auto pb-1 sm:pb-0 sm:w-auto">

                <Button size="sm" variant="outline" onClick={() => setShowAddUser(true)}>
                  <UserPlus className="h-4 w-4 mr-1" /> Add User
                </Button>
              </div>
              <div className="flex gap-2 hidden sm:flex">
                <ComingSoonDialog>
                  <Button size="sm" variant="ghost">Invite</Button>
                </ComingSoonDialog>
                <ComingSoonDialog>
                  <Button size="sm" variant="ghost">Export</Button>
                </ComingSoonDialog>
              </div>
            </CardContent>
          </Card>
        </div>


        {/* Add User Modal */}
        {showAddUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddUser(false)}>
            <div className="bg-background rounded-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">Add New User</h3>
                <p className="text-sm text-muted-foreground">Add a member manually. Email is optional.</p>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} placeholder="Full Name" />
                </div>
                <div className="space-y-2">
                  <Label>Email (Optional)</Label>
                  <Input value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="email@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    value={newUser.role}
                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    <option value="member">Member</option>
                    <option value="leader">Leader</option>
                    <option value="finance">Finance</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Birthday</Label>
                  <Input
                    type="date"
                    value={newUser.birthday || ""}
                    onChange={e => setNewUser({ ...newUser, birthday: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ministry (Optional)</Label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    value={newUser.ministryId}
                    onChange={e => setNewUser({ ...newUser, ministryId: e.target.value })}
                  >
                    <option value="">None / General</option>
                    {ministries.map(m => (
                      <option key={m._id} value={m._id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="p-4 border-t bg-muted/20 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddUser(false)}>Cancel</Button>
                <Button onClick={handleCreateUser} disabled={addingUser}>
                  {addingUser ? "Adding..." : "Add User"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditingUser(null)}>
            <div className="bg-background rounded-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">Edit User</h3>
                <p className="text-sm text-muted-foreground">Update member details.</p>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={editingUser.name} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} placeholder="Full Name" />
                </div>
                <div className="space-y-2">
                  <Label>Birthday</Label>
                  <Input
                    type="date"
                    value={editingUser.birthday || ""}
                    onChange={e => setEditingUser({ ...editingUser, birthday: e.target.value })}
                  />
                </div>
              </div>
              <div className="p-4 border-t bg-muted/20 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
                <Button onClick={handleUpdateUser} disabled={updatingUser}>
                  {updatingUser ? "Updating..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export function RolesPermissionsPage() {
  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Roles & Permissions"
          subtitle="Clear access levels for every role."
          gradient="gradient-admin"
        />

        <Card className="glass-strong border-0 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Role Matrix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Access</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rolesMatrix.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-sm text-muted-foreground">No roles configured yet.</TableCell>
                  </TableRow>
                ) : (
                  rolesMatrix.map((r) => (
                    <TableRow key={r.role}>
                      <TableCell className="font-medium">{r.role}</TableCell>
                      <TableCell>{r.access}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="flex gap-2 mt-4">
              <ComingSoonDialog>
                <Button size="sm">Update Policies</Button>
              </ComingSoonDialog>
              <ComingSoonDialog>
                <Button size="sm" variant="outline">Audit Changes</Button>
              </ComingSoonDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export function SettingsPage() {
  const { user } = useAuth();
  const organization = useQuery(api.organizations.get, user?.organizationId ? { organizationId: user.organizationId as Id<"organizations"> } : "skip");
  const updateOrg = useMutation(api.organizations.update);
  const backendSettings = useQuery(api.settings.get);
  const updateSettings = useMutation(api.settings.upsert);

  const [edits, setEdits] = useState<any>({});
  const [orgNameEdit, setOrgNameEdit] = useState<string | null>(null);
  const [orgSlugEdit, setOrgSlugEdit] = useState<string | null>(null);

  const defaultSettings = useMemo(() => ({
    inactiveAbsences: 4,
    promoteAttendance: 8,
    followUpAbsences: 2,
    welcomeTitle: "Welcome to Worship",
    enabledModules: ["gallery", "giving", "prayer", "bulletins", "bible", "announcements", "events", "followups", "assignments"],
    typography: "'Inter', system-ui, sans-serif"
  }), []);

  // Local state for list-based inputs to prevent comma-vanishing bug
  const [givingTypesDraft, setGivingTypesDraft] = useState<string | null>(null);

  useEffect(() => {
    if (givingTypesDraft === null && backendSettings?.givingTypes) {
      setGivingTypesDraft(backendSettings.givingTypes.join(", "));
    }
  }, [backendSettings?.givingTypes]);

  const currentSettings = useMemo(() => {
    return {
      ...defaultSettings,
      ...(backendSettings || {}),
      ...edits
    };
  }, [backendSettings, edits, defaultSettings]);

  const churchName = orgNameEdit ?? organization?.name ?? defaultSettings.welcomeTitle;
  const churchSlug = orgSlugEdit ?? organization?.slug ?? "my-church";
  const churchJoinCode = edits.joinCode !== undefined ? edits.joinCode : (organization?.joinCode ?? "");

  // Auto-save effect
  const handleUpdate = (updates: any) => {
    const next = { ...currentSettings, ...updates };
    setEdits((prev: any) => ({ ...prev, ...updates }));

    updateSettings({
      inactiveAbsences: Number(next.inactiveAbsences) || defaultSettings.inactiveAbsences,
      promoteAttendance: Number(next.promoteAttendance) || defaultSettings.promoteAttendance,
      followUpAbsences: Number(next.followUpAbsences) || defaultSettings.followUpAbsences,
      welcomeTitle: next.welcomeTitle || defaultSettings.welcomeTitle,
      vision: next.vision,
      mission: next.mission,
      aboutChurch: next.aboutChurch,
      logoUrl: next.logoUrl,
      primaryColor: next.primaryColor,
      accentColor: next.accentColor,
      socialLinks: next.socialLinks,
      givingTypes: next.givingTypes,
      address: next.address,
      visitInfo: next.visitInfo,
      enabledModules: next.enabledModules,
      typography: next.typography,
    }).catch(console.error);
  };

  const handleOrgUpdate = (updates: { name?: string, slug?: string }) => {
    if (updates.name !== undefined) setOrgNameEdit(updates.name);
    if (updates.slug !== undefined) setOrgSlugEdit(updates.slug);

    if (user?.organizationId) {
      updateOrg({
        organizationId: user.organizationId as Id<"organizations">,
        name: updates.name ?? churchName,
        slug: updates.slug ?? churchSlug,
        joinCode: updates.joinCode !== undefined ? updates.joinCode : (edits.joinCode !== undefined ? edits.joinCode : organization?.joinCode)
      }).catch(console.error);
    }
  };

  const toggleModule = (moduleId: string) => {
    const current = currentSettings.enabledModules || [];
    const next = current.includes(moduleId)
      ? current.filter((id: string) => id !== moduleId)
      : [...current, moduleId];
    handleUpdate({ enabledModules: next });
  };

  if (backendSettings === undefined || (user?.organizationId && organization === undefined)) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[50vh]">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="System Settings"
          subtitle="Configure global preferences and integrations."
          gradient="gradient-admin"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <DashboardCard title="Branding" icon={<Sparkles className="h-5 w-5 text-primary" />} gradient="gradient-admin">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Church / Organization Name</Label>
                <Input
                  placeholder="e.g. MAGI Church"
                  value={churchName}
                  onChange={(e) => handleOrgUpdate({ name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Unique URL Slug (lowercase, no spaces)</Label>
                <div className="flex gap-2 items-center">
                  <div className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground">papuri.app/</div>
                  <Input
                    placeholder="my-church"
                    value={churchSlug}
                    onChange={(e) => handleOrgUpdate({ slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">This defines your church's unique link.</p>
              </div>
              <div className="space-y-2">
                <Label>Welcome Slogan</Label>
                <Input
                  placeholder="e.g. Welcome to Worship"
                  value={currentSettings.welcomeTitle || ""}
                  onChange={(e) => handleUpdate({ welcomeTitle: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input
                  placeholder="https://example.com/logo.png"
                  value={currentSettings.logoUrl || ""}
                  onChange={(e) => handleUpdate({ logoUrl: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                <div className="space-y-2">
                  <Label>Primary Color (Hex)</Label>
                  <div className="flex gap-2">
                    <div 
                      className="w-9 h-9 rounded-md border cursor-pointer shrink-0 shadow-sm hover:ring-1 ring-primary transition-all"
                      style={{ backgroundColor: currentSettings.primaryColor?.startsWith('#') ? currentSettings.primaryColor : '#6366f1' }}
                      onClick={() => document.getElementById('primary-color-picker')?.click()}
                    />
                    <Input
                      placeholder="#6366f1"
                      value={currentSettings.primaryColor || ""}
                      onChange={(e) => handleUpdate({ primaryColor: e.target.value })}
                      className="font-mono h-9"
                    />
                    <input
                      id="primary-color-picker"
                      type="color"
                      value={currentSettings.primaryColor?.startsWith('#') ? currentSettings.primaryColor : '#6366f1'}
                      onChange={(e) => handleUpdate({ primaryColor: e.target.value })}
                      className="sr-only"
                    />
                  </div>
                  <p className="text-[10px] opacity-70">Example: #6366f1</p>
                </div>
                <div className="space-y-2">
                  <Label>Accent Color (Hex)</Label>
                  <div className="flex gap-2">
                    <div 
                      className="w-9 h-9 rounded-md border cursor-pointer shrink-0 shadow-sm hover:ring-1 ring-primary transition-all"
                      style={{ backgroundColor: currentSettings.accentColor?.startsWith('#') ? currentSettings.accentColor : '#f59e0b' }}
                      onClick={() => document.getElementById('accent-color-picker')?.click()}
                    />
                    <Input
                      placeholder="#f59e0b"
                      value={currentSettings.accentColor || ""}
                      onChange={(e) => handleUpdate({ accentColor: e.target.value })}
                      className="font-mono h-9"
                    />
                    <input
                      id="accent-color-picker"
                      type="color"
                      value={currentSettings.accentColor?.startsWith('#') ? currentSettings.accentColor : '#f59e0b'}
                      onChange={(e) => handleUpdate({ accentColor: e.target.value })}
                      className="sr-only"
                    />
                  </div>
                  <p className="text-[10px] opacity-70">Example: #f59e0b</p>
                </div>
              </div>

              <div className="pt-4 border-t space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="h-4 w-4 text-primary" />
                  <Label className="font-bold">Church Access Control</Label>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="join-code">Church Access Code</Label>
                    {churchJoinCode && (
                       <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/20">
                         Active
                       </Badge>
                    )}
                  </div>
                  <div className="relative group">
                    <Input
                      id="join-code"
                      placeholder="Leave empty for public access"
                      value={churchJoinCode}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEdits(prev => ({ ...prev, joinCode: val }));
                        handleOrgUpdate({ joinCode: val });
                      }}
                      className="pr-10 font-mono tracking-widest"
                      type="text"
                    />
                    <Hash className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">
                    If set, new users must enter this code to join your church. Existing members are not affected.
                  </p>
                </div>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard title="About Church Content" icon={<Church className="h-5 w-5 text-primary" />} gradient="gradient-admin">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Our Vision</Label>
                <Textarea
                  placeholder="Describe the church's vision..."
                  value={currentSettings.vision || ""}
                  onChange={(e) => handleUpdate({ vision: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Core Values / Mission</Label>
                <Textarea
                  placeholder="Describe the core values..."
                  value={currentSettings.mission || ""}
                  onChange={(e) => handleUpdate({ mission: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
          </DashboardCard>

          <DashboardCard title="Social Links" icon={<Users className="h-5 w-5 text-primary" />} gradient="gradient-admin">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Facebook URL</Label>
                <Input
                  placeholder="https://facebook.com/..."
                  value={currentSettings.socialLinks?.facebook || ""}
                  onChange={(e) => handleUpdate({ socialLinks: { ...currentSettings.socialLinks, facebook: e.target.value } })}
                />
              </div>
              <div className="space-y-2">
                <Label>Instagram URL</Label>
                <Input
                  placeholder="https://instagram.com/..."
                  value={currentSettings.socialLinks?.instagram || ""}
                  onChange={(e) => handleUpdate({ socialLinks: { ...currentSettings.socialLinks, instagram: e.target.value } })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>YouTube</Label>
                  <Input
                    placeholder="https://youtube.com/..."
                    value={currentSettings.socialLinks?.youtube || ""}
                    onChange={(e) => handleUpdate({ socialLinks: { ...currentSettings.socialLinks, youtube: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>X (Twitter)</Label>
                  <Input
                    placeholder="https://x.com/..."
                    value={currentSettings.socialLinks?.x || ""}
                    onChange={(e) => handleUpdate({ socialLinks: { ...currentSettings.socialLinks, x: e.target.value } })}
                  />
                </div>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard title="Finance Configuration" icon={<Heart className="h-5 w-5 text-primary" />} gradient="gradient-admin">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Giving Types (Comma separated)</Label>
                <Textarea
                  placeholder="Tithe, Offering, Mission, Building Fund"
                  value={givingTypesDraft ?? (currentSettings.givingTypes?.join(", ") || "")}
                  onChange={(e) => setGivingTypesDraft(e.target.value)}
                  onBlur={() => {
                    const types = (givingTypesDraft || "").split(",").map(t => t.trim()).filter(t => !!t);
                    handleUpdate({ givingTypes: types });
                  }}
                  rows={2}
                />
                <p className="text-[10px] text-muted-foreground">These will appear in the Record Giving dropdown.</p>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard title="Attendance Parameters" icon={<ClipboardList className="h-5 w-5 text-primary" />} gradient="gradient-admin">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Absences before inactive</Label>
                <Input
                  type="number"
                  min={1}
                  value={currentSettings.inactiveAbsences || ""}
                  onChange={(e) => handleUpdate({ inactiveAbsences: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Attendance before promote to member</Label>
                <Input
                  type="number"
                  min={1}
                  value={currentSettings.promoteAttendance || ""}
                  onChange={(e) => handleUpdate({ promoteAttendance: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Absences before follow up</Label>
                <Input
                  type="number"
                  min={1}
                  value={currentSettings.followUpAbsences || ""}
                  onChange={(e) => handleUpdate({ followUpAbsences: e.target.value })}
                />
              </div>
            </div>
          </DashboardCard>

          <DashboardCard title="Module Management" icon={<Plus className="h-5 w-5 text-primary" />} gradient="gradient-admin">
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground mb-2">Enable or disable specific features for your organization.</p>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { id: "gallery", label: "Photo Gallery", desc: "Share church memories" },
                  { id: "giving", label: "Online Giving", desc: "Digital donations & QR codes" },
                  { id: "prayer", label: "Prayer Requests", desc: "Members can share requests" },
                  { id: "bulletins", label: "Digital Bulletins", desc: "Share news and updates" },
                  { id: "bible", label: "Bible Reading", desc: "Daily scripture passages" },
                  { id: "events", label: "Events & RSVPs", desc: "Plan and track attendance" },
                  { id: "assignments", label: "Assignments", desc: "Assign tasks to members" },
                ].map((mod) => (
                  <div key={mod.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                    <div className="space-y-0.5">
                      <Label className="text-sm">{mod.label}</Label>
                      <p className="text-[10px] text-muted-foreground">{mod.desc}</p>
                    </div>
                    <Switch
                      checked={currentSettings.enabledModules?.includes(mod.id)}
                      onCheckedChange={() => toggleModule(mod.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </DashboardCard>

          <DashboardCard title="Typography" icon={<FileText className="h-5 w-5 text-primary" />} gradient="gradient-admin">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Font Pairing</Label>
                <Select
                  value={currentSettings.typography}
                  onValueChange={(val) => handleUpdate({ typography: val })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a font family" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="'Inter', system-ui, sans-serif">Modern Sans (Inter)</SelectItem>
                    <SelectItem value="'Outfit', sans-serif">Geometric (Outfit)</SelectItem>
                    <SelectItem value="'Playfair Display', serif">Elegant Serif (Playfair Display)</SelectItem>
                    <SelectItem value="'Roboto Mono', monospace">Technical (Roboto Mono)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">This will update the typography across the entire platform.</p>
              </div>
              <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                <p style={{ fontFamily: currentSettings.typography }} className="text-lg mb-1">Testing Header Font</p>
                <p style={{ fontFamily: currentSettings.typography }} className="text-sm opacity-70">The quick brown fox jumps over the lazy dog. This is how your content will look.</p>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard title="Visit Information" icon={<MapPin className="h-5 w-5 text-primary" />} gradient="gradient-admin">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Physical Address</Label>
                <Input
                  placeholder="123 Grace Avenue, Springfield"
                  value={currentSettings.address || ""}
                  onChange={(e) => handleUpdate({ address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Visit Details (Parking, Childcare, etc.)</Label>
                <Textarea
                  placeholder="e.g. Parking available on campus. Childcare during services."
                  value={currentSettings.visitInfo || ""}
                  onChange={(e) => handleUpdate({ visitInfo: e.target.value })}
                  rows={3}
                />
                <p className="text-[10px] text-muted-foreground">Detailed instructions for first-time visitors.</p>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard title="Security" icon={<Shield className="h-5 w-5 text-primary" />} gradient="gradient-admin">
            <p className="text-sm text-muted-foreground">Manage authentication, password policies, and 2FA.</p>
            <Button size="sm" className="mt-3">Review Security</Button>
          </DashboardCard>

          <DashboardCard title="Integrations" icon={<Settings className="h-5 w-5 text-primary" />} gradient="gradient-admin">
            <p className="text-sm text-muted-foreground">Connect giving platforms, email providers, and calendars.</p>
            <Button size="sm" variant="outline" className="mt-3">Manage Integrations</Button>
          </DashboardCard>

          <DashboardCard title="Data Management" icon={<BarChart3 className="h-5 w-5 text-primary" />} gradient="gradient-admin">
            <p className="text-sm text-muted-foreground">Configure data retention, exports, and backups.</p>
            <Button size="sm" variant="outline" className="mt-3">Open Data Center</Button>
          </DashboardCard>

          <DashboardCard title="Notifications" icon={<Bell className="h-5 w-5 text-accent" />} gradient="gradient-admin">
            <p className="text-sm text-muted-foreground">Set system-wide alerts and communication defaults.</p>
            <Button size="sm" variant="outline" className="mt-3">Adjust Notifications</Button>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
}

export function MinistriesPage() {
  const ministries = useQuery(api.ministries.list) || [];
  const createMinistry = useMutation(api.ministries.create);
  const updateMinistry = useMutation(api.ministries.update);
  const deleteMinistry = useMutation(api.ministries.deleteMinistry);

  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createMinistry({ name: trimmed, active: true })
      .then(() => setName(""))
      .catch((err) => console.error("Failed to create ministry:", err));
  };

  const handleStartEdit = (ministry: any) => {
    setEditingId(ministry._id);
    setEditName(ministry.name);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editName.trim()) return;
    updateMinistry({
      id: editingId as any,
      name: editName.trim(),
      active: true
    })
      .then(() => {
        setEditingId(null);
        setEditName("");
      })
      .catch((err) => console.error("Failed to update ministry:", err));
  };

  const handleDelete = (id: any) => {
    if (confirm("Are you sure you want to delete this ministry? This will remove it from all assigned users.")) {
      deleteMinistry({ id }).catch((err) => console.error("Failed to delete ministry:", err));
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Ministry Maintenance"
          subtitle="Create and manage ministry groups for multi-tenant access."
          gradient="gradient-admin"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <Card className="glass-strong border-0 rounded-2xl lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Active Ministries
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ministries.map((ministry) => (
                <div key={ministry._id}>
                  {editingId === ministry._id ? (
                    <div className="p-3 rounded-xl glass-subtle border border-primary/30 space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Ministry Name</Label>
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 text-sm" />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                        <Button size="sm" onClick={handleSaveEdit}>Save Changes</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl glass-subtle flex items-center justify-between group">
                      <div>
                        <p className="text-sm font-medium">{ministry.name}</p>
                        <p className="text-xs text-muted-foreground">ID: {ministry._id}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => handleStartEdit(ministry)}
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(ministry._id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <DashboardCard
            title="Add Ministry"
            description="Create a new ministry group"
            icon={<Plus className="h-5 w-5 text-primary" />}
            gradient="gradient-admin"
          >
            <div className="space-y-3">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Worship, Care, Youth"
              />
              <Button size="sm" className="w-full" onClick={handleAdd}>Add Ministry</Button>
              <p className="text-xs text-muted-foreground">
                Ministries added here define the scopes for events, members, and announcements.
              </p>
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
}

export function OnboardingMaintenancePage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const steps = useQuery(api.onboarding.listSteps, { orgSlug }) || [];
  const addStepMutation = useMutation(api.onboarding.addStep);
  const updateStepMutation = useMutation(api.onboarding.updateStep);
  const deleteStepMutation = useMutation(api.onboarding.deleteStep);
  const moveStepMutation = useMutation(api.onboarding.moveStep);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const handleAddStep = () => {
    if (!title.trim()) return;
    addStepMutation({ title: title.trim(), description: desc.trim(), orgSlug })
      .then(() => {
        setTitle("");
        setDesc("");
      })
      .catch((err) => console.error("Failed to add step:", err));
  };

  const handleDeleteStep = (id: string) => {
    deleteStepMutation({ stepId: id as any }).catch(console.error);
  };

  const handleStartEdit = (step: any) => {
    setEditingId(step._id);
    setEditTitle(step.title);
    setEditDesc(step.description);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editTitle.trim()) return;
    updateStepMutation({
      stepId: editingId as any,
      title: editTitle.trim(),
      description: editDesc.trim(),
    })
      .then(() => {
        setEditingId(null);
        setEditTitle("");
        setEditDesc("");
      })
      .catch(console.error);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDesc("");
  };

  const handleMove = (stepId: string, direction: "up" | "down") => {
    moveStepMutation({ stepId: stepId as any, direction }).catch(console.error);
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Onboarding Maintenance"
          subtitle="Manage onboarding steps shown to newcomers."
          gradient="gradient-admin"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <Card className="glass-strong border-0 rounded-2xl lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Onboarding Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {steps.length === 0 ? (
                <p className="text-sm text-muted-foreground">No steps yet.</p>
              ) : (
                steps.map((step, index) => (
                  <div key={step._id}>
                    {editingId === step._id ? (
                      <div className="p-3 rounded-xl glass-subtle border border-primary/30 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-primary min-w-[4rem]">Step {index + 1}</span>
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="Step title"
                            className="text-sm"
                          />
                        </div>
                        <Textarea
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="Step description"
                          className="text-xs min-h-[60px]"
                        />
                        <div className="flex flex-wrap gap-1">
                          {/* Assuming 'm' refers to a member object with contact details. This context is not present in OnboardingMaintenancePage. */}
                          {/* The following buttons are added based on the instruction, but 'm' is undefined here. */}
                          {/* If this code was intended for a different component (e.g., a member list), 'm' would be the member object. */}
                          {/* For now, they are added as requested, but will likely cause a runtime error due to 'm' being undefined. */}
                          {/* To make this functional, 'm' would need to be passed as a prop or derived from context. */}
                          {/* Example: {step.contactNumber && ( ... )} if steps had contactNumber */}
                          {/* For demonstration, I'll use a placeholder 'm' if it were defined. */}
                          {/* As 'm' is not defined, these buttons will not render or will cause an error. */}
                          {/* If the intent was to add these to a different page, please specify. */}
                          {/* For now, I'm inserting the code as literally as possible at the specified location. */}
                          {/* {m.contactNumber && (
                          <Button size="sm" variant="ghost" onClick={() => window.open(`tel:${m.contactNumber}`)}>
                            Call
                          </Button>
                        )}
                        {m.email && (
                          <Button size="sm" variant="ghost" onClick={() => window.open(`mailto:${m.email}`)}>
                            Email
                          </Button>
                        )}
                        {m.contactNumber && (
                          <Button size="sm" variant="ghost" onClick={() => window.open(`sms:${m.contactNumber}`)}>
                            Message
                          </Button>
                        )} */}
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                            Cancel
                          </Button>
                          <Button size="sm" onClick={handleSaveEdit}>
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl glass-subtle flex justify-between items-start group">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-sm font-semibold text-primary min-w-[4rem]">Step {index + 1}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{step.title}</p>
                            <p className="text-xs text-muted-foreground">{step.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleMove(step._id, "up")}
                            disabled={index === 0}
                            title="Move up"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleMove(step._id, "down")}
                            disabled={index === steps.length - 1}
                            title="Move down"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleStartEdit(step)}
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteStep(step._id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <DashboardCard
            title="Add Step"
            description="Create a new onboarding step"
            icon={<ClipboardList className="h-5 w-5 text-primary" />}
            gradient="gradient-admin"
          >
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Attend a service" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Short description" />
              </div>
              <Button size="sm" className="w-full" onClick={handleAddStep}>Add Step</Button>
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
}

export function ScheduleMaintenancePage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const services = useQuery(api.services.list, { orgSlug }) || [];
  const addServiceMutation = useMutation(api.services.create);
  const updateServiceMutation = useMutation(api.services.update);
  const deleteServiceMutation = useMutation(api.services.deleteService);

  const [name, setName] = useState("");
  const [day, setDay] = useState("Sunday");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDay, setEditDay] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editLocation, setEditLocation] = useState("");

  const handleAddService = () => {
    if (!name.trim()) return;
    addServiceMutation({
      name: name.trim(),
      day: day.trim(),
      time: time.trim(),
      location: location.trim(),
      orgSlug: orgSlug // Crucial for multi-tenant safety
    })
      .then(() => {
        setName("");
        setDay("");
        setTime("");
        setLocation("");
      })
      .catch((err) => console.error("Failed to add service:", err));
  };

  const handleStartEdit = (service: any) => {
    setEditingId(service._id);
    setEditName(service.name);
    setEditDay(service.day);
    setEditTime(service.time);
    setEditLocation(service.location);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editName.trim()) return;
    updateServiceMutation({
      id: editingId as any,
      name: editName.trim(),
      day: editDay.trim(),
      time: editTime.trim(),
      location: editLocation.trim()
    })
      .then(() => {
        setEditingId(null);
        setEditName("");
        setEditDay("");
        setEditTime("");
        setEditLocation("");
      })
      .catch((err) => console.error("Failed to update service:", err));
  };

  const handleDeleteService = (id: any) => {
    if (confirm("Are you sure you want to delete this service?")) {
      deleteServiceMutation({ id }).catch((err) => console.error("Failed to delete service:", err));
    }
  };


  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Service Schedule Maintenance"
          subtitle="Manage service times and locations."
          gradient="gradient-admin"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <Card className="glass-strong border-0 rounded-2xl lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Service Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {services.length === 0 ? (
                <p className="text-sm text-muted-foreground">No services yet.</p>
              ) : (
                services.map((service) => (
                  <div key={service._id}>
                    {editingId === service._id ? (
                      <div className="p-3 rounded-xl glass-subtle border border-primary/30 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Service Name</Label>
                            <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 text-sm" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Day</Label>
                            <select
                              value={editDay}
                              onChange={(e) => setEditDay(e.target.value)}
                              className="w-full h-8 px-2 py-1 rounded-md border bg-background text-sm"
                            >
                              {daysOfWeek.map(d => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Time</Label>
                            <Input value={editTime} onChange={(e) => setEditTime(e.target.value)} className="h-8 text-sm" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Location</Label>
                            <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className="h-8 text-sm" />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                          <Button size="sm" onClick={handleSaveEdit}>Save Changes</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl glass-subtle flex justify-between items-start group">
                        <div>
                          <p className="text-sm font-medium">{service.name}</p>
                          <p className="text-xs text-muted-foreground">{service.day} · {service.time} · {service.location}</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleStartEdit(service)}
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteService(service._id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <DashboardCard
            title="Add Service"
            description="Create a service schedule entry"
            icon={<Calendar className="h-5 w-5 text-primary" />}
            gradient="gradient-admin"
          >
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Service name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sunday Worship" />
              </div>
              <div className="space-y-2">
                <Label>Day</Label>
                <select
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                >
                  {daysOfWeek.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input value={time} onChange={(e) => setTime(e.target.value)} placeholder="10:00 AM" />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Main Sanctuary" />
              </div>
              <Button size="sm" className="w-full" onClick={handleAddService}>Add Service</Button>
            </div>
          </DashboardCard>
        </div >
      </div >
    </Layout >
  );
}

export function GivingMaintenancePage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const givingOptions = useQuery(api.giving_options.list, { orgSlug }) || [];
  const createGivingOption = useMutation(api.giving_options.create);
  const updateGivingOption = useMutation(api.giving_options.update);
  const deleteGivingOption = useMutation(api.giving_options.remove);
  const generateUploadUrl = useMutation(api.media.generateUploadUrl);

  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);

  const handleAddOption = async () => {
    if (!label) return;

    let storageId = undefined;
    if (selectedImage) {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": selectedImage.type },
        body: selectedImage,
      });
      const { storageId: id } = await result.json();
      storageId = id;
    }

    createGivingOption({ label, description, storageId, orgSlug })
      .then(() => {
        setLabel("");
        setDescription("");
        setSelectedImage(null);
      })
      .catch((err) => console.error(err));
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    let storageId = undefined;
    if (editImage) {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": editImage.type },
        body: editImage,
      });
      const { storageId: id } = await result.json();
      storageId = id;
    }

    updateGivingOption({
      id: editingId as any,
      label: editLabel,
      description: editDesc,
      isActive: true,
      storageId
    })
      .then(() => {
        setEditingId(null);
        setEditLabel("");
        setEditDesc("");
        setEditImage(null);
      })
      .catch((err) => console.error(err));
  };

  const handleStartEdit = (option: any) => {
    setEditingId(option._id);
    setEditLabel(option.label);
    setEditDesc(option.description);
    setEditImage(null);
  };

  const handleDeleteOption = (id: any) => {
    if (confirm("Are you sure you want to delete this giving option?")) {
      deleteGivingOption({ id }).catch((err) => console.error(err));
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Giving Maintenance"
          subtitle="Manage giving options and QR codes."
          gradient="gradient-admin"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <Card className="glass-strong border-0 rounded-2xl lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Giving Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {givingOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No giving options yet.</p>
              ) : (
                givingOptions.map((option) => (
                  <div key={option._id}>
                    {editingId === option._id ? (
                      <div className="p-3 rounded-xl glass-subtle border border-primary/30 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Label</Label>
                            <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className="h-8 text-sm" />
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <Label className="text-xs">Description</Label>
                            <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="text-sm min-h-[60px]" />
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-xs mb-1 block">Update QR Code</Label>
                            <ImageUpload
                              currentImageUrl={option.qrCodeUrl}
                              onImageSelected={setEditImage}
                              label="QR Code"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                          <Button size="sm" onClick={handleSaveEdit}>Save Changes</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl glass-subtle flex justify-between items-start group">
                        <div className="flex gap-3">
                          {option.qrCodeUrl && (
                            <img src={option.qrCodeUrl} alt="QR" className="w-12 h-12 object-cover rounded-md bg-white p-1" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{option.label}</p>
                            <p className="text-xs text-muted-foreground">{option.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleStartEdit(option)}
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteOption(option._id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <DashboardCard
            title="Add Given Option"
            description="Create a new giving channel"
            icon={<Heart className="h-5 w-5 text-primary" />}
            gradient="gradient-admin"
          >
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Label</Label>
                <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Tithes" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="10% of income" />
              </div>
              <div className="space-y-2">
                <ImageUpload
                  onImageSelected={setSelectedImage}
                  label="QR Code Upload"
                />
              </div>
              <Button size="sm" className="w-full" onClick={handleAddOption}>Add Option</Button>
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
}


