import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { getTracing } from "@/lib/tracing";

interface Announcement {
    _id: string;
    title: string;
    body: string;
    date: string;
    status: string;
    ministryId?: string;
}

interface AnnouncementDialogProps {
    isOpen: boolean;
    onClose: () => void;
    announcementToEdit?: Announcement;
    defaultMinistryId?: string; // Pre-selected ministry
}

export function AnnouncementDialog({ isOpen, onClose, announcementToEdit, defaultMinistryId }: AnnouncementDialogProps) {
    const { user } = useAuth();
    const createAnnouncement = useMutation(api.bulletins.createAnnouncement);
    const updateAnnouncement = useMutation(api.bulletins.updateAnnouncement);
    const ministries = useQuery(api.ministries.list) || [];

    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [date, setDate] = useState("");
    const [status, setStatus] = useState("Draft");
    const [selectedMinistryId, setSelectedMinistryId] = useState<string>("global");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isAdmin = user?.role === "admin";

    // User's ministries to choose from (if Leader)
    const userMinistries = ministries.filter(m => user?.ministryIds?.includes(m._id as any));

    useEffect(() => {
        if (announcementToEdit) {
            setTitle(announcementToEdit.title);
            setBody(announcementToEdit.body);
            setDate(announcementToEdit.date);
            setStatus(announcementToEdit.status || "Draft");
            setSelectedMinistryId(announcementToEdit.ministryId || "global");
        } else {
            // Reset for create mode
            setTitle("");
            setBody("");
            setDate(new Date().toISOString().split('T')[0]);
            setStatus("Draft");
            setSelectedMinistryId(defaultMinistryId || (isAdmin ? "global" : userMinistries[0]?._id || "global"));
        }
    }, [announcementToEdit, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const ministryIdToSave = selectedMinistryId === "global" ? undefined : selectedMinistryId as any;

        try {
            if (announcementToEdit) {
                await updateAnnouncement({
                    id: announcementToEdit._id as any,
                    title,
                    body,
                    date,
                    status,
                    tracing: getTracing(),
                });
            } else {
                await createAnnouncement({
                    title,
                    body,
                    date,
                    status,
                    ministryId: ministryIdToSave,
                    tracing: getTracing(),
                });
            }
            onClose();
        } catch (error) {
            console.error("Failed to save announcement:", error);
            alert("Failed to save announcement");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] glass-strong border-0 h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{announcementToEdit ? "Edit Announcement" : "Create Announcement"}</DialogTitle>
                    <DialogDescription>
                        {announcementToEdit ? "Update announcement details." : "Create a new announcement."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
                    <div className="space-y-2">
                        <Label htmlFor="target">Target Audience</Label>
                        <Select value={selectedMinistryId} onValueChange={setSelectedMinistryId} disabled={!!announcementToEdit}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select audience" />
                            </SelectTrigger>
                            <SelectContent>
                                {(isAdmin || !user?.ministryIds?.length) && (
                                    <SelectItem value="global">Global (All Church)</SelectItem>
                                )}
                                {userMinistries.map(m => (
                                    <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground">
                            {selectedMinistryId === "global"
                                ? "Visible to everyone in the organization."
                                : "Visible to everyone, but tagged as specific to this ministry."}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Service Canceled" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Draft">Draft</SelectItem>
                                <SelectItem value="Published">Published</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 flex-1 flex flex-col">
                        <Label htmlFor="body">Body</Label>
                        <Textarea
                            id="body"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            required
                            placeholder="Announcement details..."
                            className="flex-1 min-h-[100px]"
                        />
                    </div>
                </form>
                <DialogFooter className="mt-4">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
