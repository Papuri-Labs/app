
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { User, Mail, MapPin, Calendar, Phone, Facebook, Instagram, Twitter } from "lucide-react";

export function ProfileDialog({ trigger, isOpen, onOpenChange }: { trigger?: React.ReactNode, isOpen?: boolean, onOpenChange?: (open: boolean) => void }) {
    const { user } = useAuth();
    const updateProfile = useMutation(api.users.updateProfile);

    // Local state for form fields
    const [name, setName] = useState(user?.name || "");
    const [address, setAddress] = useState(user?.address || "");
    const [birthday, setBirthday] = useState(user?.birthday || "");
    const [gender, setGender] = useState(user?.gender || "");
    const [contactNumber, setContactNumber] = useState(user?.contactNumber || "");
    const [facebook, setFacebook] = useState(user?.socials?.facebook || "");
    const [instagram, setInstagram] = useState(user?.socials?.instagram || "");
    const [xHandle, setXHandle] = useState(user?.socials?.xHandle || "");

    // Internal state for when uncontrolled
    const [internalOpen, setInternalOpen] = useState(false);

    // Determine if controlled or uncontrolled
    const isControlled = isOpen !== undefined && onOpenChange !== undefined;
    const showOpen = isControlled ? isOpen : internalOpen;
    const setShowOpen = isControlled ? onOpenChange : setInternalOpen;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateProfile({
                name,
                address,
                birthday,
                gender,
                contactNumber,
                socials: {
                    facebook,
                    instagram,
                    xHandle,
                },
            });
            toast.success("Profile updated successfully");
            setShowOpen(false);
        } catch (error) {
            toast.error("Failed to update profile");
            console.error(error);
        }
    };

    return (
        <Dialog open={showOpen} onOpenChange={setShowOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[425px] bg-white border-0">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                        Update your personal information.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label className="text-xs">Email Address</Label>
                        <div className="relative">
                            <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={user?.email || ""}
                                disabled
                                className="pl-9 bg-muted/50 cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs">Full Name</Label>
                        <div className="relative">
                            <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="pl-9"
                                placeholder="John Doe"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address" className="text-xs">Address</Label>
                        <div className="relative">
                            <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="pl-9"
                                placeholder="123 Church St"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="birthday" className="text-xs">Birthday</Label>
                            <div className="relative">
                                <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="birthday"
                                    type="date"
                                    value={birthday}
                                    onChange={(e) => setBirthday(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="gender" className="text-xs">Gender</Label>
                            <Select value={gender} onValueChange={setGender}>
                                <SelectTrigger className="pl-9 relative">
                                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="contact" className="text-xs">Contact Number</Label>
                        <div className="relative">
                            <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="contact"
                                value={contactNumber}
                                onChange={(e) => setContactNumber(e.target.value)}
                                className="pl-9"
                                placeholder="+1 234 567 890"
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pt-2 border-t border-border/50">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Social Media Links</p>

                        <div className="space-y-2">
                            <Label htmlFor="facebook" className="text-xs">Facebook Profile</Label>
                            <div className="relative">
                                <Facebook className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="facebook"
                                    value={facebook}
                                    onChange={(e) => setFacebook(e.target.value)}
                                    className="pl-9"
                                    placeholder="https://facebook.com/username"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="instagram" className="text-xs">Instagram Profile</Label>
                            <div className="relative">
                                <Instagram className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="instagram"
                                    value={instagram}
                                    onChange={(e) => setInstagram(e.target.value)}
                                    className="pl-9"
                                    placeholder="https://instagram.com/username"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="xHandle" className="text-xs">X (Twitter) Profile</Label>
                            <div className="relative">
                                <Twitter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="xHandle"
                                    value={xHandle}
                                    onChange={(e) => setXHandle(e.target.value)}
                                    className="pl-9"
                                    placeholder="https://x.com/username"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={() => setShowOpen(false)}>Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
