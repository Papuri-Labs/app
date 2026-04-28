import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import { useParams } from "react-router-dom";

interface FirstTimerDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function FirstTimerDialog({ isOpen, onClose }: FirstTimerDialogProps) {
    const { orgSlug } = useParams<{ orgSlug: string }>();
    const submit = useMutation(api.users.submitFirstTimer);

    // Form state
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [birthday, setBirthday] = useState("");
    const [address, setAddress] = useState("");
    const [heardFrom, setHeardFrom] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim() || !orgSlug) {
            toast.error("Please fill in the required fields (Name and Email)");
            return;
        }

        setIsSubmitting(true);
        try {
            await submit({
                name: name.trim(),
                email: email.trim(),
                contactNumber: phone.trim() || undefined,
                birthday: birthday || undefined,
                address: address.trim() || undefined,
                orgSlug: orgSlug,
                heardFrom: heardFrom || undefined,
                message: message.trim() || undefined,
            });
            toast.success("Welcome! Your information has been received.");
            // Reset form
            setName("");
            setEmail("");
            setPhone("");
            setBirthday("");
            setAddress("");
            setHeardFrom("");
            setMessage("");
            onClose();
        } catch (error: any) {
            console.error("Failed to submit first timer form:", error);
            if (error?.message?.includes("EMAIL_ALREADY_EXISTS")) {
                toast.error("This email is already registered with us.");
            } else {
                toast.error("Something went wrong. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-white dark:bg-zinc-950 border border-border shadow-2xl rounded-3xl p-0 overflow-hidden">
                <div className="bg-primary/5 p-6 border-b border-border/50">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <UserPlus className="h-5 w-5 text-primary" />
                            </div>
                            <DialogTitle className="text-xl font-bold">First Timer Connect</DialogTitle>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            We'd love to get to know you! Please leave your details below.
                        </p>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="ft-name" className="text-xs font-bold uppercase tracking-wider opacity-70">Full Name *</Label>
                        <Input
                            id="ft-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your full name"
                            className="rounded-xl border-border/50 focus:ring-primary/20"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="ft-email" className="text-xs font-bold uppercase tracking-wider opacity-70">Email Address *</Label>
                            <Input
                                id="ft-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="rounded-xl border-border/50 focus:ring-primary/20"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ft-phone" className="text-xs font-bold uppercase tracking-wider opacity-70">Phone Number</Label>
                            <Input
                                id="ft-phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="0917-000-0000"
                                className="rounded-xl border-border/50 focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="ft-birthday" className="text-xs font-bold uppercase tracking-wider opacity-70">Birthday</Label>
                            <Input
                                id="ft-birthday"
                                type="date"
                                value={birthday}
                                onChange={(e) => setBirthday(e.target.value)}
                                className="rounded-xl border-border/50 focus:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ft-heard" className="text-xs font-bold uppercase tracking-wider opacity-70">How did you hear about us?</Label>
                            <Select value={heardFrom} onValueChange={setHeardFrom}>
                                <SelectTrigger id="ft-heard" className="rounded-xl border-border/50">
                                    <SelectValue placeholder="Select an option" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Social Media">Social Media</SelectItem>
                                    <SelectItem value="Friend/Family">Friend or Family</SelectItem>
                                    <SelectItem value="Website">Website</SelectItem>
                                    <SelectItem value="Walk-in">Just walked by</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="ft-address" className="text-xs font-bold uppercase tracking-wider opacity-70">Home Address</Label>
                        <Input
                            id="ft-address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Street, Barangay, City"
                            className="rounded-xl border-border/50 focus:ring-primary/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="ft-message" className="text-xs font-bold uppercase tracking-wider opacity-70">Message / Prayer Request</Label>
                        <Textarea
                            id="ft-message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Anything else you'd like us to know?"
                            className="min-h-[100px] rounded-xl border-border/50 focus:ring-primary/20"
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={onClose} 
                            disabled={isSubmitting}
                            className="rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="rounded-xl px-8 bg-primary hover:bg-primary/90"
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Information
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
