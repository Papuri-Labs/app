import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { DashboardCard } from "@/components/DashboardCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Phone, MapPin } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-4 md:space-y-6">
        <h1 className="text-2xl font-bold">My Profile</h1>

        <DashboardCard title="Personal Information" icon={<User className="h-5 w-5 text-primary" />}>
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {user.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">{user.name}</p>
              <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input defaultValue={user.name.split(" ")[0]} />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input defaultValue={user.name.split(" ")[1]} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ministry Assignment</Label>
              <Input defaultValue={user.ministryNames?.join(", ") || "Unassigned"} readOnly />
            </div>
            <div className="space-y-2">
              <Label><Mail className="h-3 w-3 inline mr-1" />Email</Label>
              <Input defaultValue={user.email} />
            </div>
            <div className="space-y-2">
              <Label><Phone className="h-3 w-3 inline mr-1" />Phone</Label>
              <Input placeholder="+1 (555) 000-0000" />
            </div>
            <div className="space-y-2">
              <Label><MapPin className="h-3 w-3 inline mr-1" />Address</Label>
              <Input placeholder="123 Faith Avenue" />
            </div>
            <Button className="w-fit">Save Changes</Button>
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
}
