import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface RsvpDialogProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string | null;
    eventTitle?: string;
}

export function RsvpDialog({ isOpen, onClose, eventId, eventTitle }: RsvpDialogProps) {
    const rsvps = useQuery(api.events.getEventRsvps, eventId ? { eventId: eventId as any } : "skip");

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] glass-strong border-0">
                <DialogHeader>
                    <DialogTitle>RSVPs for {eventTitle || "Event"}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[300px] w-full rounded-md p-1">
                    <div className="space-y-3">
                        {!rsvps ? (
                            <p className="text-center text-sm text-muted-foreground py-4">Loading...</p>
                        ) : rsvps.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground py-4">No RSVPs yet.</p>
                        ) : (
                            rsvps.map((r: any) => (
                                <div key={r._id} className="flex items-center justify-between p-3 rounded-xl glass-subtle">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={r.member.imageUrl} />
                                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                                {r.member.name?.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">{r.member.name}</p>
                                            <p className="text-xs text-muted-foreground">{r.member.email}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(r.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
                <div className="text-xs text-muted-foreground text-center mt-2">
                    Total: {rsvps?.length || 0}
                </div>
            </DialogContent>
        </Dialog>
    );
}
