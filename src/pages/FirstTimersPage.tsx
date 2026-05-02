import { Layout } from "@/components/Layout";
import { DashboardCard } from "@/components/DashboardCard";
import { PageHeader } from "@/components/PageHeader";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useParams } from "react-router-dom";
import { 
  Users, Mail, Phone, Calendar, MapPin, 
  MessageSquare, CheckCircle2, Clock, 
  MessageSquareHeart, Loader2, AlertCircle
} from "lucide-react";
import { format, isWithinInterval, startOfDay, endOfDay, parseISO, subDays } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useMutation } from "convex/react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "@/contexts/AuthContext";

export default function FirstTimersPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { user } = useAuth();
  const isUserLeader = user?.role === "leader" || user?.role === "admin";

  const [activeTab, setActiveTab] = useState("submitted");
  const [toggling, setToggling] = useState<string | null>(null);

  // Queries
  const firstTimersDetails = useQuery(api.users.listFirstTimers, { orgSlug: orgSlug || "" }) || [];
  const allRequests = useQuery(api.prayer_requests.list, isUserLeader ? {} : "skip") || [];
  const toggleStatus = useMutation(api.prayer_requests.toggleStatus);

  // Filter for First Timer requests only
  const firstTimerRequests = useMemo(() => {
    return allRequests.filter(r => r.isFirstTimer || r.category === "First Timer");
  }, [allRequests]);

  const submitted = firstTimerRequests.filter(r => r.status !== "Prayed");
  const acknowledged = firstTimerRequests.filter(r => r.status === "Prayed");

  const handleToggle = async (id: Id<"prayer_requests">, currentStatus: string) => {
    const newStatus = currentStatus === "Prayed" ? "Open" : "Prayed";
    setToggling(id);
    try {
      await toggleStatus({ id, status: newStatus });
      toast.success(newStatus === "Prayed" ? "Marked as acknowledged" : "Moved back to submitted");
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setToggling(null);
    }
  };

  const groupRequests = (reqs: any[]) => {
    const grouped: Record<string, any[]> = {};
    reqs.sort((a, b) => b.createdAt - a.createdAt).forEach(req => {
      const date = format(req.createdAt, "MMMM d, yyyy");
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(req);
    });
    return grouped;
  };

  const renderList = (requests: any[], emptyMessage: string) => {
    if (requests.length === 0) {
      return (
        <div className="text-center py-20 glass rounded-3xl border-dashed border-2 border-primary/20">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground font-medium">{emptyMessage}</p>
        </div>
      );
    }

    const grouped = groupRequests(requests);
    const dates = Object.keys(grouped);

    return (
      <div className="space-y-8 pb-10">
        {dates.map(date => (
          <div key={date} className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] bg-background/50 px-3 py-1 rounded-full border border-border/40">
                {date}
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {grouped[date].map((req) => {
                const details = firstTimersDetails.find(d => d.name === req.name);
                return (
                  <div key={req._id} className="p-5 rounded-2xl glass-subtle border border-border/50 hover:border-primary/30 transition-all flex flex-col gap-4 shadow-sm group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl gradient-header flex items-center justify-center text-sm font-bold text-primary-foreground shadow-sm group-hover:scale-110 transition-transform">
                          {req.name.split(" ").map((n: string) => n[0]).join("")}
                        </div>
                        <div className="flex flex-col">
                          <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors leading-tight">{req.name}</h3>
                          <span className="text-[10px] text-muted-foreground">{format(req.createdAt, "MMM d, h:mm a")}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {req.status === "Prayed" && (
                          <div className="flex flex-col items-end gap-1">
                            <Badge 
                              variant="secondary" 
                              className="text-[9px] font-bold h-5 rounded-md bg-green-500/10 text-green-600 border-green-500/20"
                            >
                              Acknowledged
                            </Badge>
                            {req.acknowledgedByName && (
                              <span className="text-[9px] text-muted-foreground whitespace-nowrap opacity-70 italic font-medium leading-none">
                                by {req.acknowledgedByName}
                              </span>
                            )}
                          </div>
                        )}
                        <Switch
                          checked={req.status === "Prayed"}
                          onCheckedChange={() => handleToggle(req._id, req.status)}
                          disabled={toggling === req._id}
                          className="data-[state=checked]:bg-green-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      {details?.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{details.email}</span>
                        </div>
                      )}
                      {details?.contactNumber && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{details.contactNumber}</span>
                        </div>
                      )}
                    </div>

                    {req.request && (
                      <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                        <p className="text-xs italic text-foreground/80 leading-relaxed">
                          "{req.request}"
                        </p>
                      </div>
                    )}

                    <div className="mt-auto pt-4 border-t border-border/30 grid grid-cols-2 gap-2">
                      {details?.birthday && (
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <Calendar className="h-3 w-3 opacity-70" />
                          <span className="truncate">Birth: {details.birthday}</span>
                        </div>
                      )}
                      {details?.heardFrom && (
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <MessageSquare className="h-3 w-3 opacity-70" />
                          <span className="truncate">Via: {details.heardFrom}</span>
                        </div>
                      )}
                      {details?.address && (
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground col-span-2">
                          <MapPin className="h-3 w-3 opacity-70" />
                          <span className="truncate">{details.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="First Timers"
          subtitle="Visitors who submitted the Connect form."
          gradient="gradient-leader"
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 bg-background/50 p-2 rounded-xl border border-border/40">
            <TabsList className="grid w-full grid-cols-2 max-w-[320px] h-10 p-1">
              <TabsTrigger value="submitted" className="text-xs">Submitted ({submitted.length})</TabsTrigger>
              <TabsTrigger value="acknowledged" className="text-xs">Acknowledged ({acknowledged.length})</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[calc(100vh-280px)]">
            <TabsContent value="submitted" className="mt-0">
              {renderList(submitted, "No pending first timer submissions.")}
            </TabsContent>
            <TabsContent value="acknowledged" className="mt-0">
              {renderList(acknowledged, "No acknowledged first timers yet.")}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </Layout>
  );
}
