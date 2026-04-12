import { useState, useEffect, useMemo } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { getTracing } from "@/lib/tracing";
import { getLocalSysDate } from "@/lib/utils";

interface Event {
    _id: string;
    title: string;
    date: string;
    time: string;
    type?: string;
    stage?: string;
    lead?: string;
    status?: string;
    ministryId?: string;
    rsvpCount: number;
}

interface EventDialogProps {
    isOpen: boolean;
    onClose: () => void;
    eventToEdit?: Event;
    defaultMinistryId?: string;
}

export function EventDialog({ isOpen, onClose, eventToEdit, defaultMinistryId }: EventDialogProps) {
    const { user } = useAuth();
    const createEvent = useMutation(api.events.createEvent);
    const updateEvent = useMutation(api.events.updateEvent);
    const ministries = useQuery(api.ministries.list) || [];

    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [type, setType] = useState("General");
    const [stage, setStage] = useState("Planning");
    const [lead, setLead] = useState("");
    const [status, setStatus] = useState("Draft");
    const [selectedMinistryId, setSelectedMinistryId] = useState<string>("global");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isAdmin = user?.role === "admin";
    const userMinistries = useMemo(() => {
        return ministries.filter(m => user?.ministryIds?.includes(m._id as any));
    }, [ministries, user?.ministryIds]);

    useEffect(() => {
        if (eventToEdit) {
            setTitle(eventToEdit.title);
            setDate(eventToEdit.date);
            setTime(eventToEdit.time);
            setType(eventToEdit.type || "General");
            setStage(eventToEdit.stage || "Planning");
            setLead(eventToEdit.lead || "");
            setStatus(eventToEdit.status || "Draft");
            setSelectedMinistryId(eventToEdit.ministryId || "global");
        } else {
            // Reset for create
            setTitle("");
            setDate(getLocalSysDate());
            setTime("");
            setType("General");
            setStage("Planning");
            setLead(user?.name || "");
            setStatus("Draft");
            setSelectedMinistryId(defaultMinistryId || (isAdmin ? "global" : userMinistries[0]?._id || "global"));
        }
    }, [eventToEdit, isOpen, user, defaultMinistryId, isAdmin, userMinistries]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const ministryIdToSave = selectedMinistryId === "global" ? undefined : selectedMinistryId as any;

        try {
            if (eventToEdit) {
                await updateEvent({
                    id: eventToEdit._id as any,
                    title,
                    date,
                    time,
                    type,
                    stage,
                    lead,
                    status,
                    tracing: getTracing(),
                });
            } else {
                await createEvent({
                    title,
                    date,
                    time,
                    type,
                    stage,
                    lead,
                    status,
                    ministryId: ministryIdToSave,
                    tracing: getTracing(),
                });
            }
            onClose();
        } catch (error) {
            console.error("Failed to save event:", error);
            alert("Failed to save event");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-background border h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{eventToEdit ? "Edit Event" : "Create Event"}</DialogTitle>
                    <DialogDescription>
                        {eventToEdit ? "Update event details." : "Plan a new event."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
                    <div className="space-y-2">
                        <Label htmlFor="target">Ministry / Scope</Label>
                        <Select value={selectedMinistryId} onValueChange={setSelectedMinistryId} disabled={!!eventToEdit}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select scope" />
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
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title" className="flex items-center gap-1">
                            Event Title <span className="text-destructive font-bold">*</span>
                        </Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Sunday Service" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date" className="flex items-center gap-1">
                                Date <span className="text-destructive font-bold">*</span>
                            </Label>
                            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="time">Time</Label>
                            <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <Input id="type" value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g. Worship" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="stage">Stage</Label>
                            <Select value={stage} onValueChange={setStage}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Stage" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Planning">Planning</SelectItem>
                                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                                    <SelectItem value="Ready">Ready</SelectItem>
                                    <SelectItem value="Completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="lead">Lead / Organizer</Label>
                        <Input id="lead" value={lead} onChange={(e) => setLead(e.target.value)} placeholder="Organizer Name" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Visibility Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Draft">Draft (Internal Only)</SelectItem>
                                <SelectItem value="Published">Published (Visible to All)</SelectItem>
                            </SelectContent>
                        </Select>
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
