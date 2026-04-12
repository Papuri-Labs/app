import { Layout } from "@/components/Layout";
import { DashboardCard } from "@/components/DashboardCard";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { BarChart3, Users, Shield, Settings, Database, Activity } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate, useParams } from "react-router-dom";
import { roleSolidColors } from "@/lib/role-colors";
import { UserRole } from "@/contexts/AuthContext";

import { useState } from "react";

export default function AdminDashboard() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const navigate = useNavigate();
  const allUsers = useQuery(api.users.getAdminDirectory) || [];
  const ministries = useQuery(api.ministries.list) || [];
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const users = allUsers.filter((u: any) => u.isActive !== false);

  const totalUsers = users.length;
  const activeMinistries = ministries.filter((m: any) => m.active).length;

  const sortedUsers = [...users].reverse();
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Role distribution
  const roles = users.reduce((acc: any, user: any) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});

  const roleDistribution = Object.entries(roles).map(([role, count]) => ({
    role: role.charAt(0).toUpperCase() + role.slice(1),
    count: Number(count),
    color: roleSolidColors[role as UserRole] || 'bg-muted',
  }));

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="gradient-admin glass rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-primary/6 -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-24 h-24 rounded-full bg-accent/5 translate-y-1/2 blur-2xl" />
          <h1 className="text-2xl font-bold mb-1 relative">Administration</h1>
          <p className="text-muted-foreground relative">System overview and management tools.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard label="Total Users" value={totalUsers} trend="neutral" icon={<Users className="h-5 w-5 text-primary" />} />
          <StatCard label="Ministries" value={activeMinistries} icon={<Database className="h-5 w-5 text-primary" />} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <DashboardCard title="Recent Users" description="Newest registrations" icon={<Users className="h-5 w-5 text-primary" />} gradient="gradient-admin">
            <div className="space-y-3">
              {paginatedUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent users yet.</p>
              ) : (
                <>
                  {paginatedUsers.map((u: any, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl glass-subtle">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full gradient-header flex items-center justify-center text-xs font-medium text-primary-foreground">
                          {u.name ? u.name.split(" ").map((n: string) => n[0]).join("") : "U"}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">{u.role}</span>
                      </div>
                    </div>
                  ))}

                  {sortedUsers.length > itemsPerPage && (
                    <div className="flex justify-between items-center pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="h-8 px-2 text-xs"
                      >
                        Previous
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="h-8 px-2 text-xs"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => navigate(`/${orgSlug}/manage-users`)}>Manage All Users</Button>
          </DashboardCard>

          <DashboardCard title="Roles & Permissions" description="User distribution by role" icon={<Shield className="h-5 w-5 text-primary" />} gradient="gradient-admin">
            <div className="space-y-3">
              {roleDistribution.length === 0 ? (
                <p className="text-sm text-muted-foreground">No role data yet.</p>
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
            <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate(`/${orgSlug}/roles`)}>Manage Roles</Button>
          </DashboardCard>


          <DashboardCard title="Quick Actions" icon={<Settings className="h-5 w-5 text-primary" />} gradient="gradient-admin">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="justify-start" onClick={() => navigate(`/${orgSlug}/manage-users`)}>Add User</Button>
              <Button variant="outline" size="sm" className="justify-start" onClick={() => navigate(`/${orgSlug}/manage-bulletins`)}>Manage Bulletins</Button>
              <Button variant="outline" size="sm" className="justify-start" onClick={() => navigate(`/${orgSlug}/ministries`)}>Manage Ministries</Button>
              <ComingSoonDialog>
                <Button variant="outline" size="sm" className="justify-start w-full">Export Data</Button>
              </ComingSoonDialog>
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
}
