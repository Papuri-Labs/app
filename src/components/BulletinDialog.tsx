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
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getTracing } from "@/lib/tracing";

interface Bulletin {
    _id: string;
    title: string;
    summary: string;
    date: string;
    status: string;
    ministryId?: string;
}

interface BulletinDialogProps {
    isOpen: boolean;
    onClose: () => void;
    bulletinToEdit?: Bulletin;
    ministryId?: string; // For creating new bulletins
}

export function BulletinDialog({ isOpen, onClose, bulletinToEdit, ministryId }: BulletinDialogProps) {
    const createBulletin = useMutation(api.bulletins.createBulletin);
    const updateBulletin = useMutation(api.bulletins.updateBulletin);

    const [title, setTitle] = useState("");
    const [summary, setSummary] = useState("");
    const [date, setDate] = useState("");
    const [status, setStatus] = useState("Draft");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (bulletinToEdit) {
            setTitle(bulletinToEdit.title);
            setSummary(bulletinToEdit.summary);
            setDate(bulletinToEdit.date);
            setStatus(bulletinToEdit.status);
        } else {
            // Reset for create mode
            setTitle("");
            setSummary("");
            setDate(new Date().toISOString().split('T')[0]);
            setStatus("Draft");
        }
    }, [bulletinToEdit, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (bulletinToEdit) {
                await updateBulletin({
                    id: bulletinToEdit._id as any,
                    title,
                    summary,
                    date,
                    status,
                    tracing: getTracing(),
                });
            } else {
                await createBulletin({
                    title,
                    summary,
                    date,
                    status,
                    ministryId: ministryId as any,
                    tracing: getTracing(),
                });
            }
            onClose();
        } catch (error) {
            console.error("Failed to save bulletin:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] glass-strong border-0">
                <DialogHeader>
                    <DialogTitle>{bulletinToEdit ? "Edit Bulletin" : "Create Bulletin"}</DialogTitle>
                    <DialogDescription>
                        {bulletinToEdit ? "Update the details of this bulletin." : "Draft a new bulletin for your ministry."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Youth Camp Registration" />
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
                    <div className="space-y-2">
                        <Label htmlFor="summary">Summary</Label>
                        <Textarea id="summary" value={summary} onChange={(e) => setSummary(e.target.value)} required placeholder="Brief description..." rows={3} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
