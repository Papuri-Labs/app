import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { getTracing } from "@/lib/tracing";

export function NotificationBell() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const logUIEvent = useMutation(api.logs.logUIEvent);
    const [isOpen, setIsOpen] = useState(false);
    const [lastReadTime, setLastReadTime] = useState<number>(() => {
        const stored = localStorage.getItem("notificationLastRead");
        return stored ? parseInt(stored) : Date.now();
    });

    // Fetch data
    const events = useQuery(api.events.list) || [];
    const announcements = useQuery(api.bulletins.listAnnouncements) || [];
    const bulletins = useQuery(api.bulletins.listBulletins) || [];
    const assignments = useQuery(
        api.assignments.listByMember,
        user?._id ? { memberId: user._id as any } : "skip"
    ) || [];
    const followUpAssignments = useQuery(
        api.attendance.getMyFollowUpAssignments,
        user?.role === "leader" || user?.role === "admin" ? {} : "skip"
    ) || [];
    const bibleReadingPlans = useQuery(api.biblePlan.getMyActivePlans) || [];

    // Combine and sort notifications
    const notifications = [
        ...events
            .filter(e => !e.status || e.status === "Published")
            .map(e => ({
                id: e._id,
                type: "Event",
                title: e.title,
                date: e._creationTime,
                link: `/${user?.organizationSlug || "my-church"}/events`
            })),
        ...announcements
            .filter(a => !a.status || a.status === "Published")
            .map(a => ({
                id: a._id,
                type: "Announcement",
                title: a.title,
                date: a._creationTime,
                link: `/${user?.organizationSlug || "my-church"}/announcements`
            })),
        ...bulletins
            .filter(b => !b.status || b.status === "Published")
            .map(b => ({
                id: b._id,
                type: "Bulletin",
                title: b.title,
                date: b._creationTime,
                link: `/${user?.organizationSlug || "my-church"}/bulletins`
            })),
        ...assignments
            .map((a: any) => ({
                id: a._id,
                type: "Assignment",
                title: `${a.title} · ${a.ministryName}`,
                date: a.createdAt ?? a._creationTime,
                link: `/${user?.organizationSlug || "my-church"}/assignments`,
                status: a.status,
            })),
        ...followUpAssignments
            .filter((a: any) => a.status !== "completed")
            .map((a: any) => ({
                id: `fu-${a._id}`,
                type: "Follow-Up",
                title: `Follow up with ${a.memberName}`,
                date: a.createdAt ?? a._creationTime,
                link: `/${user?.organizationSlug || "my-church"}/follow-ups`,
            })),
        ...bibleReadingPlans.map((br: any) => ({
            id: `br-${br.assignment._id}`,
            type: "Bible Reading",
            title: `New plan: ${br.plan?.title}`,
            date: br.assignment.createdAt ?? br.assignment._creationTime,
            link: `/${user?.organizationSlug || "my-church"}/bible-reading`,
        })),
    ].sort((a, b) => b.date - a.date)
        .slice(0, 15);


    const hasUnread = notifications.some(n => n.date > lastReadTime);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open) {
            // Mark as read when opening
            const now = Date.now();
            setLastReadTime(now);
            localStorage.setItem("notificationLastRead", now.toString());

            logUIEvent({
                action: "NOTIFICATION_OPEN",
                details: "User opened notification bell",
                tracing: getTracing(),
            });
        }
    };

    const handleItemClick = (link: string, title: string, type: string) => {
        logUIEvent({
            action: "NOTIFICATION_CLICK",
            details: `User clicked ${type}: ${title}`,
            metadata: { link, type, title },
            tracing: getTracing(),
        });
        navigate(link);
        setIsOpen(false);
    };

    if (!user) return null;

    return (
        <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {hasUnread && (
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive border-2 border-background" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-white dark:bg-zinc-950 border border-border shadow-lg">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        No notifications
                    </div>
                ) : (
                    <div className="max-h-[300px] overflow-y-auto">
                        {notifications.map((n) => (
                            <DropdownMenuItem
                                key={n.id}
                                className="cursor-pointer flex flex-col items-start gap-1 p-3 focus:bg-muted/50"
                                onClick={() => handleItemClick(n.link, n.title, n.type)}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                        n.type === "Event" ? "bg-primary/10 text-primary" :
                                        n.type === "Announcement" ? "bg-accent/10 text-accent-foreground" :
                                        n.type === "Assignment" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                                        n.type === "Follow-Up" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                                        n.type === "Bible Reading" ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" :
                                        "bg-muted text-muted-foreground"
                                    }`}>
                                        {n.type}
                                    </span>
                                    {n.date > lastReadTime && (
                                        <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                                    )}
                                </div>
                                <p className="text-sm font-medium leading-none">{n.title}</p>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(n.date).toLocaleDateString()}
                                </p>
                            </DropdownMenuItem>
                        ))}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
