import { useState } from "react";
import { Layout } from "@/components/Layout";
import { DashboardCard } from "@/components/DashboardCard";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { BarChart3, Calendar, FileText, Users, TrendingUp, Cake, ChevronLeft, ChevronRight, Edit2, Trash2, ClipboardList } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { BulletinDialog } from "@/components/BulletinDialog";
import { RsvpDialog } from "@/components/RsvpDialog";
import { AssignmentDialog } from "@/components/AssignmentDialog";

export default function LeaderDashboard() {
  const { user } = useAuth();
  const ministryIds = user?.ministryIds ?? [];
  const [bulletinToEdit, setBulletinToEdit] = useState<any>(null);
  const [isBulletinDialogOpen, setIsBulletinDialogOpen] = useState(false);
  const [isRsvpDialogOpen, setIsRsvpDialogOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const deleteBulletin = useMutation(api.bulletins.deleteBulletin);

  // Fetch data from backend
  const members = useQuery(api.users.getMemberDirectory) || [];
  const events = useQuery(api.events.list) || [];
  const bulletins = useQuery(api.bulletins.listBulletins) || [];

  // Filter bulletins - Leaders only see their ministry's bulletins in this dashboard
  const myBulletins = bulletins.filter(b => b.ministryId && ministryIds.includes(b.ministryId));

  // Pagination state
  const [eventsPage, setEventsPage] = useState(0);
  const [membersPage, setMembersPage] = useState(0);
  const [bulletinsPage, setBulletinsPage] = useState(0);
  const [celebrationsPage, setCelebrationsPage] = useState(0);
  const itemsPerPage = 5;

  // Filter members under this leader's ministry
  const ministryMembers = members.filter(m =>
    m.ministryIds?.some(id => ministryIds.includes(id))
  );

  // Filter upcoming events
  const today = new Date().toISOString().split('T')[0];
  const upcomingEvents = events.filter(e => (!e.status || e.status === "Published") && e.date >= today);

  // Get upcoming celebrations (birthdays and anniversaries) for this month
  const currentMonth = new Date().getMonth() + 1;
  const ministryCelebrations = ministryMembers
    .map(m => {
      const celebrations = [];
      if (m.birthday) {
        const birthMonth = new Date(m.birthday).getMonth() + 1;
        if (birthMonth === currentMonth) {
          celebrations.push({
            name: m.name,
            type: "Birthday",
            date: new Date(m.birthday).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            fullDate: m.birthday
          });
        }
      }
      if (m.anniversary) {
        const annivMonth = new Date(m.anniversary).getMonth() + 1;
        if (annivMonth === currentMonth) {
          celebrations.push({
            name: m.name,
            type: "Anniversary",
            date: new Date(m.anniversary).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            fullDate: m.anniversary
          });
        }
      }
      return celebrations;
    })
    .flat()
    .sort((a, b) => new Date(a.fullDate).getDate() - new Date(b.fullDate).getDate());

  // Calculate metrics
  const totalMembers = ministryMembers.length;
  const activeMembers = ministryMembers.filter(m => m.status === "Active" || !m.status).length;
  const newMembers = ministryMembers.filter(m => m.status === "New").length;

  // Pagination helpers
  const getPaginatedItems = (items: any[], page: number) => {
    const start = page * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  };

  const getTotalPages = (items: any[]) => Math.ceil(items.length / itemsPerPage);

  const handleDeleteBulletin = async (id: any) => {
    if (confirm("Are you sure you want to delete this bulletin?")) {
      try {
        await deleteBulletin({ id });
      } catch (error) {
        console.error("Failed to delete bulletin:", error);
        alert("Failed to delete bulletin");
      }
    }
  };



  return (
    <Layout>
      <div className="space-y-6 animate-fade-in pb-20">
        <div className="gradient-leader glass rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-44 h-44 rounded-full bg-success/8 -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <h1 className="text-2xl font-bold mb-1 relative">Ministry Dashboard</h1>
          <p className="text-muted-foreground relative">
            Manage {user?.ministryNames?.join(", ") ?? "your"} ministry and track key metrics.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard label="Total Members" value={totalMembers} trend="neutral" icon={<Users className="h-5 w-5 text-primary" />} />
          <StatCard label="Active Members" value={activeMembers} icon={<Users className="h-5 w-5 text-success" />} />
          <StatCard label="New Members" value={newMembers} trend="up" icon={<TrendingUp className="h-5 w-5 text-success" />} />
          <StatCard label="Upcoming Events" value={upcomingEvents.length} icon={<Calendar className="h-5 w-5 text-primary" />} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">


          {/* Upcoming Events */}
          <DashboardCard title="Upcoming Events" description="Create and track events" icon={<Calendar className="h-5 w-5 text-primary" />} gradient="gradient-leader">
            <div className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming events yet.</p>
              ) : (
                <>
                  {getPaginatedItems(upcomingEvents, eventsPage).map((e) => (
                    <div
                      key={e._id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl glass-subtle cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => { setSelectedEventId(e._id); setIsRsvpDialogOpen(true); }}
                    >
                      <div>
                        <p className="text-sm font-medium">{e.title}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">{e.date} · {e.time}</p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium flex items-center gap-1">
                            <Users className="h-2.5 w-2.5" /> {e.rsvpCount || 0} RSVP
                          </span>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-primary/10 text-primary">
                        {e.date === today ? "Today" : "Upcoming"}
                      </span>
                    </div>
                  ))}
                  {getTotalPages(upcomingEvents) > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <Button size="sm" variant="ghost" onClick={() => setEventsPage(p => Math.max(0, p - 1))} disabled={eventsPage === 0}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-xs text-muted-foreground">Page {eventsPage + 1} of {getTotalPages(upcomingEvents)}</span>
                      <Button size="sm" variant="ghost" onClick={() => setEventsPage(p => Math.min(getTotalPages(upcomingEvents) - 1, p + 1))} disabled={eventsPage >= getTotalPages(upcomingEvents) - 1}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </DashboardCard>

          {/* Ministry Members */}
          <DashboardCard title="Ministry Members" description="Your ministry team" icon={<Users className="h-5 w-5 text-primary" />} gradient="gradient-leader">
            <div className="space-y-3">
              {ministryMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No team members yet.</p>
              ) : (
                <>
                  {getPaginatedItems(ministryMembers, membersPage).map((m) => (
                    <div key={m._id} className="flex items-center justify-between p-3 rounded-xl glass-subtle">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full gradient-header flex items-center justify-center text-xs font-medium text-primary-foreground">
                          {m.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{m.name}</p>
                          <p className="text-xs text-muted-foreground">{m.email}</p>
                        </div>
                      </div>
                      <span className={`text-xs ${m.status === "Active" || !m.status ? "text-success" : m.status === "New" ? "text-primary" : "text-muted-foreground"}`}>
                        {m.status || "Active"}
                      </span>
                    </div>
                  ))}
                  {getTotalPages(ministryMembers) > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <Button size="sm" variant="ghost" onClick={() => setMembersPage(p => Math.max(0, p - 1))} disabled={membersPage === 0}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-xs text-muted-foreground">Page {membersPage + 1} of {getTotalPages(ministryMembers)}</span>
                      <Button size="sm" variant="ghost" onClick={() => setMembersPage(p => Math.min(getTotalPages(ministryMembers) - 1, p + 1))} disabled={membersPage >= getTotalPages(ministryMembers) - 1}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </DashboardCard>

          {/* Celebrations */}
          <DashboardCard title="Upcoming Celebrations" description="Birthdays & anniversaries" icon={<Cake className="h-5 w-5 text-accent" />} gradient="gradient-leader">
            <div className="space-y-3">
              {ministryCelebrations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No celebrations this month.</p>
              ) : (
                <>
                  {getPaginatedItems(ministryCelebrations, celebrationsPage).map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl glass-subtle">
                      <div>
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.type}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent-foreground font-medium">{c.date}</span>
                    </div>
                  ))}
                  {getTotalPages(ministryCelebrations) > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <Button size="sm" variant="ghost" onClick={() => setCelebrationsPage(p => Math.max(0, p - 1))} disabled={celebrationsPage === 0}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-xs text-muted-foreground">Page {celebrationsPage + 1} of {getTotalPages(ministryCelebrations)}</span>
                      <Button size="sm" variant="ghost" onClick={() => setCelebrationsPage(p => Math.min(getTotalPages(ministryCelebrations) - 1, p + 1))} disabled={celebrationsPage >= getTotalPages(ministryCelebrations) - 1}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </DashboardCard>

          {/* Bulletins */}
          <DashboardCard title="Bulletins" description="Recent bulletins" icon={<FileText className="h-5 w-5 text-primary" />} gradient="gradient-leader">
            <div className="flex justify-end mb-2">
              <Button size="sm" variant="outline" onClick={() => { setBulletinToEdit(null); setIsBulletinDialogOpen(true); }}>
                + New Bulletin
              </Button>
            </div>
            <div className="space-y-3">
              {myBulletins.length === 0 ? (
                <p className="text-sm text-muted-foreground">No bulletins yet.</p>
              ) : (
                <>
                  {getPaginatedItems(myBulletins, bulletinsPage).map((b) => (
                    <div key={b._id} className="p-3 rounded-xl glass-subtle">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{b.title}</p>
                        <div className="flex items-center gap-1">
                          <span className={`text-xs px-2 py-1 rounded-full ${b.status === "Published" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                            {b.status}
                          </span>
                          <div className="flex items-center gap-1 ml-2">
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setBulletinToEdit(b); setIsBulletinDialogOpen(true); }}>
                              <Edit2 className="h-3 w-3 text-muted-foreground hover:text-primary transition-colors" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleDeleteBulletin(b._id)}>
                              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive transition-colors" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{b.date}</p>
                    </div>
                  ))}
                  {getTotalPages(myBulletins) > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <Button size="sm" variant="ghost" onClick={() => setBulletinsPage(p => Math.max(0, p - 1))} disabled={bulletinsPage === 0}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-xs text-muted-foreground">Page {bulletinsPage + 1} of {getTotalPages(myBulletins)}</span>
                      <Button size="sm" variant="ghost" onClick={() => setBulletinsPage(p => Math.min(getTotalPages(myBulletins) - 1, p + 1))} disabled={bulletinsPage >= getTotalPages(myBulletins) - 1}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </DashboardCard>

          {/* Quick Stats */}
          <DashboardCard title="Quick Stats" description="Ministry performance" icon={<BarChart3 className="h-5 w-5 text-primary" />} gradient="gradient-leader">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl glass-subtle">
                <span className="text-sm text-muted-foreground">Total Members</span>
                <span className="text-sm font-semibold">{totalMembers}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl glass-subtle">
                <span className="text-sm text-muted-foreground">Active</span>
                <span className="text-sm font-semibold text-success">{activeMembers}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl glass-subtle">
                <span className="text-sm text-muted-foreground">New</span>
                <span className="text-sm font-semibold text-primary">{newMembers}</span>
              </div>
            </div>
          </DashboardCard>
        </div>
      </div>
      <BulletinDialog
        isOpen={isBulletinDialogOpen}
        onClose={() => setIsBulletinDialogOpen(false)}
        bulletinToEdit={bulletinToEdit}
        ministryId={ministryIds[0]} // Default to first ministry for now
      />
      <RsvpDialog
        isOpen={isRsvpDialogOpen}
        onClose={() => setIsRsvpDialogOpen(false)}
        eventId={selectedEventId}
        eventTitle={upcomingEvents.find(e => e._id === selectedEventId)?.title}
      />

    </Layout>
  );
}
