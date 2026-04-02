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

interface AssignmentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    ministryId: string;
}

import { getTracing } from "@/lib/tracing";

export function AssignmentDialog({ isOpen, onClose, ministryId }: AssignmentDialogProps) {
    const assignTask = useMutation(api.assignments.create);
    const members = useQuery(api.users.getMemberDirectory) || [];

    const [memberId, setMemberId] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setMemberId("");
            setTitle("");
            setDescription("");
            // Default due date to next Sunday
            const today = new Date();
            const nextSunday = new Date(today);
            nextSunday.setDate(today.getDate() + (7 - today.getDay()));
            setDueDate(nextSunday.toISOString().split("T")[0]);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!memberId) {
            alert("Please select a member.");
            return;
        }
        setIsSubmitting(true);

        try {
            await assignTask({
                memberId: memberId as any,
                ministryId: ministryId as any,
                title,
                description,
                dueDate,
                tracing: getTracing(),
            });
            onClose();
        } catch (error) {
            console.error("Failed to assign task:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] glass-strong border-0">
                <DialogHeader>
                    <DialogTitle>Assign Weekly Task</DialogTitle>
                    <DialogDescription>
                        Assign a specific task to a ministry member for this week.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="member">Member</Label>
                        <Select value={memberId} onValueChange={setMemberId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a member" />
                            </SelectTrigger>
                            <SelectContent>
                                {members.map((m) => (
                                    <SelectItem key={m._id} value={m._id}>
                                        {m.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="title">Task Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            placeholder="e.g. Lead Praise and Worship"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input
                            id="dueDate"
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Additional details..."
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Assigning..." : "Assign Task"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
