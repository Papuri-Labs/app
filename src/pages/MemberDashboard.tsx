import { useState } from "react";
import { Layout } from "@/components/Layout";
import { DashboardCard } from "@/components/DashboardCard";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, BookOpen, Bell, Heart, Users, ClipboardList, Check, XCircle, AlertCircle, Loader2, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { GivingDialog } from "@/components/GivingDialog";
import { getTracing } from "@/lib/tracing";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const bibleReading = {
  plan: "",
  todayReading: "",
  progress: 0,
};

export default function MemberDashboard() {
  const { user } = useAuth();
  const logUIEvent = useMutation(api.logs.logUIEvent);
  const [selectedGiving, setSelectedGiving] = useState<any>(null);
  const givingOptions = useQuery(api.giving_options.list) || [];

  // Real data fetching
  const events = useQuery(api.events.list) || [];
  const announcements = useQuery(api.bulletins.listAnnouncements) || [];
  const bulletins = useQuery(api.bulletins.listBulletins) || [];
  const assignments = useQuery(api.assignments.listByMember, user?._id ? { memberId: user._id as any } : "skip") || [];
  const recentPhotos = useQuery(api.media.getRecentPhotos, { limit: 4 }) || [];

  // Local state
  const [rsvpMap, setRsvpMap] = useState<Record<string, boolean>>({}); // Keep for immediate feedback if desired, but better to rely on query
  const myRsvps = useQuery(api.events.getUserRsvps, user?._id ? { memberId: user._id as any } : "skip");
  const rsvpSet = new Set(myRsvps?.map((r: any) => r.eventId));

  const [confirmStatus, setConfirmStatus] = useState<{ id: string; status: "completed" | "acknowledged" | "not_available" | "pending"; title: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Filter upcoming events
  const today = new Date().toISOString().split('T')[0];
  const upcomingEvents = events
    .filter(e => (!e.status || e.status === "Published") && e.date >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  // Filter recent announcements
  const recentAnnouncements = announcements
    .filter(a => !a.status || a.status === "Published")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  // Stats calculation
  const groupsJoined = user?.ministryIds?.length ?? 0;
  const unreadBulletins = bulletins.length; // Simplified for now

  const rsvpMutation = useMutation(api.events.rsvp);
  const updateAssignmentStatus = useMutation(api.assignments.updateStatus);

  const toggleRsvp = (id: string) => {
    if (!user || !user._id) return;
    rsvpMutation({
      eventId: id as any,
      memberId: user._id as any,
      tracing: getTracing()
    }).catch(console.error);
  };

  const handleUpdateStatus = async () => {
    if (!confirmStatus) return;
    setIsSubmitting(true);
    try {
      await updateAssignmentStatus({
        id: confirmStatus.id as any,
        status: confirmStatus.status,
        tracing: getTracing()
      });
      toast.success(`Assignment marked as ${confirmStatus.status.replace("_", " ")}`);
    } catch (error) {
      toast.error("Failed to update status");
      console.error(error);
    } finally {
      setIsSubmitting(false);
      setConfirmStatus(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="gradient-member glass rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-primary/8 -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-info/6 translate-y-1/2 -translate-x-1/4 blur-2xl" />
          <h1 className="text-2xl font-bold mb-1 relative">My Dashboard</h1>
          <p className="text-muted-foreground relative">
            Stay connected and engaged with your {user?.ministryNames?.join(", ") ?? "church"} ministry.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard label="Upcoming Events" value={upcomingEvents.length} icon={<Calendar className="h-5 w-5 text-primary" />} />
          <StatCard label="Recent Bulletins" value={unreadBulletins} icon={<FileText className="h-5 w-5 text-primary" />} />
          <StatCard label="Streak (Days)" value={0} trend="neutral" icon={<BookOpen className="h-5 w-5 text-primary" />} />
          <StatCard label="Groups Joined" value={groupsJoined} icon={<Users className="h-5 w-5 text-primary" />} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <DashboardCard
            title="Weekly Assignment"
            description="Your assigned tasks for this week"
            icon={<ClipboardList className="h-5 w-5 text-primary" />}
            gradient="gradient-member"
            className="md:col-span-2"
          >
            <div className="space-y-3">
              {assignments.length === 0 ? (
                <div className="p-4 rounded-xl glass-subtle border border-primary/10">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <ClipboardList className="h-8 w-8 opacity-20" />
                    <div>
                      <p className="text-sm font-medium">No assignments yet</p>
                      <p className="text-xs">Assignments will appear here when your leader assigns them to you.</p>
                    </div>
                  </div>
                </div>
              ) : (
                assignments.map((a: any) => (
                  <div key={a._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 rounded-xl glass-subtle border border-primary/10">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 sm:mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${a.status === "completed" ? "bg-success/20 text-success" : "bg-primary/10 text-primary"
                        }`}>
                        <ClipboardList className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-semibold leading-tight ${a.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{a.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          <span className="inline sm:hidden">Min: {a.ministryName}</span>
                          <span className="hidden sm:inline">Ministry: {a.ministryName}</span>
                          {" · "}Due: {a.dueDate}
                        </p>
                        {a.description && <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2 sm:line-clamp-none">{a.description}</p>}
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-nowrap items-center gap-2 mt-2 sm:mt-0 ml-11 sm:ml-0">
                      {user?.role === "member" && (
                        <>
                          {a.status !== "completed" && (
                            <Button
                              size="sm"
                              className="h-8 flex-1 sm:flex-none bg-success hover:bg-success/90 text-white gap-1.5 px-3 text-xs"
                              onClick={() => setConfirmStatus({ id: a._id, status: "completed", title: a.title })}
                            >
                              <Check className="h-3.5 w-3.5" /> <span className="sm:inline">Done</span>
                            </Button>
                          )}
                          {a.status !== "acknowledged" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-8 flex-1 sm:flex-none gap-1.5 px-3 text-xs"
                              onClick={() => setConfirmStatus({ id: a._id, status: "acknowledged", title: a.title })}
                            >
                              <ClipboardList className="h-3.5 w-3.5" /> <span className="sm:inline">Ack</span>
                            </Button>
                          )}
                          {a.status !== "not_available" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 flex-1 sm:flex-none gap-1.5 px-3 text-xs"
                              onClick={() => setConfirmStatus({ id: a._id, status: "not_available", title: a.title })}
                            >
                              <XCircle className="h-3.5 w-3.5" /> <span className="sm:inline">N/A</span>
                            </Button>
                          )}
                          {a.status !== "pending" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-[11px] text-muted-foreground hover:bg-muted"
                              onClick={() => setConfirmStatus({ id: a._id, status: "pending", title: a.title })}
                            >
                              Reset
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link to="/assignments">
              <Button variant="outline" size="sm" className="mt-4 w-full">View All Assignments</Button>
            </Link>
          </DashboardCard>


          <DashboardCard title="Upcoming Events" description="What's happening this week" icon={<Calendar className="h-5 w-5 text-primary" />} gradient="gradient-member">
            <div className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming events yet.</p>
              ) : (
                upcomingEvents.map((e) => (
                  <div key={e._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl glass-subtle">
                    <div>
                      <p className="text-sm font-medium">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{e.date} · {e.time}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">{e.type || "Event"}</span>
                      <Button size="sm" variant={rsvpSet.has(e._id) ? "default" : "outline"} onClick={() => toggleRsvp(e._id)}>
                        {rsvpSet.has(e._id) ? "RSVP'd" : "RSVP"}
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Confirmed: {e.rsvpCount}</p>
                  </div>
                ))
              )}
            </div>
            <Link to="/events">
              <Button variant="outline" size="sm" className="mt-3 w-full">View All Events</Button>
            </Link>
          </DashboardCard>

          <DashboardCard title="Announcements" description="Latest from your ministry" icon={<Bell className="h-5 w-5 text-accent" />} gradient="gradient-member">
            <div className="space-y-3">
              {recentAnnouncements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No announcements yet.</p>
              ) : (
                recentAnnouncements.map((a) => (
                  <div key={a._id} className="p-3 rounded-xl glass-subtle">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium">{a.title}</p>
                      <span className="text-xs text-muted-foreground">{a.date}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{a.body}</p>
                  </div>
                ))
              )}
            </div>
          </DashboardCard>

          <DashboardCard title="Bible Reading" description={bibleReading.plan} icon={<BookOpen className="h-5 w-5 text-primary" />} gradient="gradient-member">
            <div className="p-4 rounded-xl glass-subtle">
              <p className="text-xs text-muted-foreground mb-1">Today's Reading</p>
              <p className="text-sm font-medium">
                {bibleReading.todayReading || "No reading assigned yet."}
              </p>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm">Mark as Read</Button>
              <Button variant="outline" size="sm">View Plan</Button>
            </div>
          </DashboardCard>

          <DashboardCard title="Giving" description="Support the ministry" icon={<Heart className="h-5 w-5 text-accent" />} gradient="gradient-member">
            <p className="text-sm text-muted-foreground mb-4">
              Your generous giving helps further our mission and serve our community.
            </p>
            <Button size="sm" onClick={() => {
              logUIEvent({
                action: "GIVING_CLICK",
                details: "User clicked Give Now button on dashboard",
                tracing: getTracing(),
              });
              setSelectedGiving(givingOptions[0] || { label: "General Giving", description: "Default giving option" });
            }}>Give Now</Button>
          </DashboardCard>

          <DashboardCard title="Recent Memories" description="Latest photos from church events" icon={<ImageIcon className="h-5 w-5 text-primary" />} gradient="gradient-member">
            <div className="grid grid-cols-2 gap-2">
              {recentPhotos.length === 0 ? (
                <div className="col-span-2 py-8 text-center glass-subtle rounded-xl border border-dashed border-primary/20">
                  <p className="text-xs text-muted-foreground">No memories shared yet.</p>
                </div>
              ) : (
                recentPhotos.map((photo: any) => (
                  <Link key={photo._id} to="/gallery" className="aspect-square rounded-lg overflow-hidden border border-white/10 hover:opacity-80 transition-opacity">
                    <img src={photo.url} alt="Memory" className="w-full h-full object-cover" />
                  </Link>
                ))
              )}
            </div>
            <Link to="/gallery">
              <Button variant="outline" size="sm" className="mt-3 w-full">Open Gallery</Button>
            </Link>
          </DashboardCard>
        </div>
      </div>
      <GivingDialog selectedGiving={selectedGiving} onClose={() => setSelectedGiving(null)} />

      <AlertDialog open={!!confirmStatus} onOpenChange={(open) => !open && setConfirmStatus(null)}>
        <AlertDialogContent className="glass-strong">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Confirm Status Update
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark "{confirmStatus?.title}" as{" "}
              <strong className="text-foreground">
                {confirmStatus?.status.replace("_", " ")}
              </strong>
              ? This action will be visible to your ministry leader.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleUpdateStatus();
              }}
              disabled={isSubmitting}
              className={confirmStatus?.status === "not_available" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Confirm"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
