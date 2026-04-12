import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { format } from "date-fns";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, MessageSquareHeart } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle } from "lucide-react";

interface PrayerRequest {
    _id: Id<"prayer_requests">;
    _creationTime: number;
    name: string;
    request: string;
    status: string;
    createdAt: number;
}

export default function PrayerRequestsPage() {
    const { user } = useAuth();
    const isUserLeader = user?.role === "leader" || user?.role === "admin";

    const requests = useQuery(api.prayer_requests.list, isUserLeader ? {} : "skip");
    const toggleStatus = useMutation(api.prayer_requests.toggleStatus);
    const [toggling, setToggling] = useState<string | null>(null);

    const handleToggle = async (id: Id<"prayer_requests">, currentStatus: string) => {
        const newStatus = currentStatus === "Prayed" ? "Open" : "Prayed";
        setToggling(id);
        try {
            await toggleStatus({ id, status: newStatus });
            toast.success(newStatus === "Prayed" ? "Moved to Prayed tab" : "Moved to Submitted tab");
        } catch (error) {
            toast.error("Failed to update status");
        } finally {
            setToggling(null);
        }
    };

    if (!isUserLeader) {
        return (
            <>
                <div className="flex flex-col items-center justify-center p-8 h-[60vh] space-y-4 animate-fade-in">
                    <div className="bg-destructive/10 p-4 rounded-full">
                        <AlertCircle className="h-12 w-12 text-destructive" />
                    </div>
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight">Access Denied</h2>
                        <p className="text-muted-foreground max-w-md">
                            You don't have permission to access the Prayer Requests management page.
                            This section is reserved for church leaders and administrators.
                        </p>
                    </div>
                </div>
            </>
        );
    }

    if (requests === undefined) {
        return (
            <>
                <div className="flex items-center justify-center p-8 h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </>
        );
    }

    const groupRequests = (reqs: PrayerRequest[]) => {
        return reqs.reduce((acc, req) => {
            const date = format(new Date(req.createdAt), "MMMM d, yyyy");
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(req);
            return acc;
        }, {} as Record<string, PrayerRequest[]>);
    };

    const submittedRequests = requests.filter(r => r.status !== "Prayed");
    const prayedRequests = requests.filter(r => r.status === "Prayed");

    const groupedSubmitted = groupRequests(submittedRequests);
    const groupedPrayed = groupRequests(prayedRequests);

    const renderRequestList = (grouped: Record<string, PrayerRequest[]>, emptyMessage: string) => {
        const dates = Object.keys(grouped);
        if (dates.length === 0) {
            return (
                <Card className="glass-strong border-dashed mt-8">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <MessageSquareHeart className="h-12 w-12 mb-4 opacity-50" />
                        <p>{emptyMessage}</p>
                    </CardContent>
                </Card>
            );
        }
        return (
            <div className="space-y-6 pb-20">
                {dates.map((date) => (
                    <div key={date} className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground sticky top-0 bg-background/95 backdrop-blur py-2 z-10 px-2 rounded-md">
                            {date}
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {grouped[date].map((req) => (
                                <Card key={req._id} className={`glass-subtle transition-all hover:shadow-md ${req.status === "Prayed" ? "opacity-60" : ""}`}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="space-y-1">
                                                <CardTitle className="text-base font-semibold">{req.name}</CardTitle>
                                                <CardDescription className="text-xs">
                                                    {format(new Date(req.createdAt), "h:mm a")}
                                                </CardDescription>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {req.status === "Prayed" && (
                                                    <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20 text-[10px] px-1.5">
                                                        Prayed
                                                    </Badge>
                                                )}
                                                <Switch
                                                    checked={req.status === "Prayed"}
                                                    onCheckedChange={() => handleToggle(req._id, req.status)}
                                                    disabled={toggling === req._id}
                                                    className="data-[state=checked]:bg-green-500"
                                                />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                            {req.request}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <>
            <div className="space-y-6 animate-fade-in p-2 md:p-0">
                {/* Styled Header matching RolePages */}
                <div className="gradient-leader glass rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-success/10 -translate-y-1/2 translate-x-1/3 blur-3xl" />
                    <h1 className="text-2xl font-bold mb-1 relative">Prayer Requests</h1>
                    <p className="text-muted-foreground relative">
                        Manage and pray for your community's requests.
                    </p>
                </div>

                <Tabs defaultValue="submitted" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-4">
                        <TabsTrigger value="submitted">Submitted ({submittedRequests.length})</TabsTrigger>
                        <TabsTrigger value="prayed">Prayed ({prayedRequests.length})</TabsTrigger>
                    </TabsList>

                    <ScrollArea className="h-[calc(100vh-280px)]">
                        <TabsContent value="submitted" className="mt-0">
                            {renderRequestList(groupedSubmitted, "No active prayer requests.")}
                        </TabsContent>
                        <TabsContent value="prayed" className="mt-0">
                            {renderRequestList(groupedPrayed, "No prayed requests yet.")}
                        </TabsContent>
                    </ScrollArea>
                </Tabs>
            </div>
        </>
    );
}
