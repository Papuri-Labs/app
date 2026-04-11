import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { DashboardCard } from "@/components/DashboardCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Phone, MapPin } from "lucide-react";
import { useUser } from "@clerk/clerk-react";

export default function Profile() {
  const { user } = useAuth();
  const { user: clerkUser } = useUser();
  const updateProfile = useMutation(api.users.updateProfile);
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      const parts = user.name.split(" ");
      setFirstName(parts[0] || "");
      setLastName(parts.slice(1).join(" ") || "");
      setPhone(user.contactNumber || "");
      setAddress((user as any).address || "");
    }
  }, [user]);

  if (!user) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (clerkUser) {
        try {
          await clerkUser.update({
            firstName: firstName || undefined,
            lastName: lastName || undefined,
          });
        } catch (err) {
          console.warn("Non-critical error: failed to manually update Clerk user name:", err);
        }
      }

      await updateProfile({
        name: `${firstName} ${lastName}`.trim(),
        contactNumber: phone,
        address: address,
      });
      alert("Profile updated successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

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
                <Input value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ministry Assignment</Label>
              <Input value={user.ministryNames?.join(", ") || "Unassigned"} readOnly disabled className="opacity-50" />
            </div>
            <div className="space-y-2">
              <Label><Mail className="h-3 w-3 inline mr-1" />Email</Label>
              <Input value={user.email} readOnly disabled className="opacity-50" />
            </div>
            <div className="space-y-2">
              <Label><Phone className="h-3 w-3 inline mr-1" />Phone</Label>
              <Input placeholder="+1 (555) 000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label><MapPin className="h-3 w-3 inline mr-1" />Address</Label>
              <Input placeholder="123 Faith Avenue" value={address} onChange={e => setAddress(e.target.value)} />
            </div>
            <Button className="w-fit" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
}
