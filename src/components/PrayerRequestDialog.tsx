import { useState, useEffect } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PrayerRequestDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PrayerRequestDialog({ isOpen, onClose }: PrayerRequestDialogProps) {
    const { user } = useAuth();
    const submit = useMutation(api.prayer_requests.submit);

    // Form state
    const [name, setName] = useState("");
    const [request, setRequest] = useState("");
    const [category, setCategory] = useState("Others");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Pre-fill name if user is logged in
    useEffect(() => {
        if (isOpen && user?.name) {
            setName(user.name);
        }
        if (!isOpen) {
            // Optional: reset form on close? 
            // Maybe keep it if accidental close? 
            // Let's keep it for now, reset on success.
        }
    }, [isOpen, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !request.trim()) {
            toast.error("Please fill in all fields");
            return;
        }

        setIsSubmitting(true);
        try {
            await submit({
                name: name.trim(),
                request: request.trim(),
                category: category,
                ministryId: user?.ministryIds?.[0] as any, // Cast to any to avoid Id narrowing issues
            });
            toast.success("Prayer request submitted successfully");
            setRequest(""); // Clear request
            onClose();
        } catch (error) {
            console.error("Failed to submit prayer request:", error);
            toast.error("Failed to submit prayer request");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-white dark:bg-zinc-950 border border-border shadow-lg">
                <DialogHeader>
                    <DialogTitle>Prayer Request</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <Label htmlFor="pr-name">Name</Label>
                        <Input
                            id="pr-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pr-category">Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger id="pr-category">
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Health">Health</SelectItem>
                                <SelectItem value="Finances">Finances</SelectItem>
                                <SelectItem value="Family">Family</SelectItem>
                                <SelectItem value="Spiritual Growth">Spiritual Growth</SelectItem>
                                <SelectItem value="Career">Career</SelectItem>
                                <SelectItem value="Others">Others</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pr-request">How can we pray for you?</Label>
                        <Textarea
                            id="pr-request"
                            value={request}
                            onChange={(e) => setRequest(e.target.value)}
                            placeholder="Share your prayer request..."
                            className="min-h-[120px]"
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Request
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
