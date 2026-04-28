import { Layout } from "@/components/Layout";
import { DashboardCard } from "@/components/DashboardCard";
import { PageHeader } from "@/components/PageHeader";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useParams } from "react-router-dom";
import { Users, Mail, Phone, Calendar, MapPin, MessageSquare } from "lucide-react";
import { format } from "date-fns";

export default function FirstTimersPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const firstTimers = useQuery(api.users.listFirstTimers, { orgSlug: orgSlug || "" }) || [];

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="First Timers"
          subtitle="Visitors who submitted the Connect form."
          gradient="gradient-leader"
        />

        <div className="grid grid-cols-1 gap-6">
          <DashboardCard
            title="Recent Visitors"
            icon={<Users className="h-5 w-5 text-primary" />}
            gradient="gradient-leader"
          >
            <div className="space-y-4">
              {firstTimers.length === 0 ? (
                <div className="text-center py-12 glass rounded-2xl border-dashed border-2">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                  <p className="text-muted-foreground">No visitor submissions yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {firstTimers.map((ft: any) => (
                    <div key={ft._id} className="p-4 rounded-xl glass-subtle border border-border/50 hover:border-primary/30 transition-all flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="h-10 w-10 rounded-full gradient-header flex items-center justify-center text-sm font-bold text-primary-foreground shadow-sm">
                          {ft.name.split(" ").map((n: string) => n[0]).join("")}
                        </div>
                        <span className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                          {format(ft.createdAt, "MMM d, yyyy")}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-lg">{ft.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{ft.email}</span>
                        </div>
                        {ft.contactNumber && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Phone className="h-3 w-3" />
                            <span>{ft.contactNumber}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-border/30 space-y-2">
                        {ft.birthday && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Birthday: {ft.birthday}</span>
                          </div>
                        )}
                        {ft.address && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{ft.address}</span>
                          </div>
                        )}
                        {ft.heardFrom && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MessageSquare className="h-3 w-3" />
                            <span>Heard via: {ft.heardFrom}</span>
                          </div>
                        )}
                      </div>

                      {ft.message && (
                        <div className="mt-auto p-3 rounded-lg bg-primary/5 border border-primary/10">
                          <p className="text-xs italic text-foreground/80 line-clamp-3">
                            "{ft.message}"
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
}
