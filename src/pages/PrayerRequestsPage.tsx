import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { format, isWithinInterval, startOfDay, endOfDay, parseISO, subDays } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, MessageSquareHeart, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/PageHeader";


interface PrayerRequest {
    _id: Id<"prayer_requests">;
    _creationTime: number;
    name: string;
    request: string;
    status: string;
    category?: string;
    createdAt: number;
    acknowledgedByName?: string;
    acknowledgedAt?: number;
    isFirstTimer?: boolean;
}

export default function PrayerRequestsPage() {
    const { user } = useAuth();
    const isUserLeader = user?.role === "leader" || user?.role === "admin";

    const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
    const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [activeTab, setActiveTab] = useState("submitted");

    const requests = useQuery(api.prayer_requests.list, isUserLeader ? {} : "skip");
    const toggleStatus = useMutation(api.prayer_requests.toggleStatus);
    const [toggling, setToggling] = useState<string | null>(null);

    const submittedRequests = requests?.filter(r => r.status !== "Prayed" && !r.isFirstTimer && r.category !== "First Timer") || [];
    const prayedRequests = requests?.filter(r => r.status === "Prayed" && !r.isFirstTimer && r.category !== "First Timer") || [];


    const handleToggle = async (id: Id<"prayer_requests">, currentStatus: string) => {
        const newStatus = currentStatus === "Prayed" ? "Open" : "Prayed";
        setToggling(id);
        try {
            await toggleStatus({ id, status: newStatus });
        } catch (error) {
            toast.error("Failed to update status");
        } finally {
            setToggling(null);
        }
    };

    if (!isUserLeader) {
        return (
            <Layout>
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
            </Layout>
        );
    }

    if (requests === undefined) {
        return (
            <Layout>
                <div className="flex items-center justify-center p-8 h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </Layout>
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
            <div className="space-y-8 pb-20">
                {dates.map((date) => (
                    <div key={date} className="space-y-6">
                        <div className="flex items-center gap-4 py-2">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] bg-background/50 px-3 py-1 rounded-full border border-border/40">
                                {date}
                            </span>
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {grouped[date].map((req) => (
                                <div key={req._id} className={`p-5 rounded-2xl glass-subtle border border-border/50 hover:border-primary/30 transition-all flex flex-col gap-4 shadow-sm group ${req.status === "Prayed" ? "opacity-60" : ""}`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl gradient-header flex items-center justify-center text-sm font-bold text-primary-foreground shadow-sm group-hover:scale-110 transition-transform">
                                                {req.name.split(" ").map((n: string) => n[0]).join("")}
                                            </div>
                                            <div className="flex flex-col">
                                                <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors leading-tight">{req.name}</h3>
                                                <span className="text-[10px] text-muted-foreground">{format(new Date(req.createdAt), "h:mm a")}</span>
                                                {req.category && (
                                                    <Badge variant="outline" className="text-[9px] py-0 h-4 mt-1 w-fit bg-primary/5 text-primary border-primary/20">
                                                        {req.category}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {req.status === "Prayed" && (
                                                <div className="flex flex-col items-end gap-1">
                                                    <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20 text-[9px] px-1.5 h-5">
                                                        Acknowledged
                                                    </Badge>
                                                    {req.acknowledgedByName && (
                                                        <span className="text-[9px] text-muted-foreground whitespace-nowrap opacity-70 italic font-medium leading-none">
                                                            by {req.acknowledgedByName}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            <Switch
                                                checked={req.status === "Prayed"}
                                                onCheckedChange={() => handleToggle(req._id, req.status)}
                                                disabled={toggling === req._id}
                                                className="data-[state=checked]:bg-green-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                                        <p className="text-xs italic text-foreground/80 leading-relaxed whitespace-pre-wrap">
                                            "{req.request}"
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in p-2 md:p-0">
                <PageHeader
                    title="Prayer Requests"
                    subtitle="Manage and pray for your community's requests."
                    gradient="gradient-leader"
                />


                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 bg-background/50 p-2 rounded-xl border border-border/40">
                        <TabsList className="grid w-full grid-cols-2 max-w-[320px] h-10 p-1">
                            <TabsTrigger value="submitted" className="text-xs">Submitted ({submittedRequests.length})</TabsTrigger>
                            <TabsTrigger value="prayed" className="text-xs">Acknowledged ({prayedRequests.length})</TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="h-[calc(100vh-280px)]">
                        <TabsContent value="submitted" className="mt-0">
                            {renderRequestList(groupedSubmitted, "No active prayer requests.")}
                        </TabsContent>
                        <TabsContent value="prayed" className="mt-0">
                            {renderRequestList(groupedPrayed, "No acknowledged requests yet.")}
                        </TabsContent>
                    </ScrollArea>
                </Tabs>
            </div>

        </Layout>
    );
}
