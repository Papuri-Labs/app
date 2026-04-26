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
import { Loader2, MessageSquareHeart, AlertCircle, FileDown } from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

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
    const logPdfDownload = useMutation(api.pdf_logs.logDownload);
    const [toggling, setToggling] = useState<string | null>(null);
    const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
    const [pendingDownload, setPendingDownload] = useState<{ type: "prayer_requests" | "first_timers", count: number } | null>(null);

    const submittedRequests = requests?.filter(r => r.status !== "Prayed" && !r.isFirstTimer) || [];
    const prayedRequests = requests?.filter(r => r.status === "Prayed" && !r.isFirstTimer) || [];
    const firstTimerRequests = requests?.filter(r => r.isFirstTimer) || [];

    const checkLogArgs = useMemo(() => ({
        type: activeTab === "firsttimers" ? "first_timers" : "prayer_requests",
        todayStart: startOfDay(new Date()).getTime()
    }), [activeTab]);

    const logs = useQuery(api.pdf_logs.checkLogs, checkLogArgs);

    const currentItemCount = useMemo(() => {
        return (activeTab === "firsttimers" ? 
            firstTimerRequests.filter(r => r.status === "Prayed") : 
            prayedRequests
        ).filter(req => {
            const s = startOfDay(parseISO(startDate)).getTime();
            const e = endOfDay(parseISO(endDate)).getTime();
            return req.createdAt >= s && req.createdAt <= e;
        }).length;
    }, [activeTab, startDate, endDate, firstTimerRequests, prayedRequests]);

    const existingLog = useMemo(() => {
        if (!logs) return undefined;
        return logs.find(log => 
            log.startDate === startDate && 
            log.endDate === endDate && 
            log.itemCount === currentItemCount
        );
    }, [logs, startDate, endDate, currentItemCount]);

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
    const groupedFirstTimers = groupRequests(firstTimerRequests);

    const handleDownloadPDF = async (force: boolean = false) => {
        const start = startOfDay(parseISO(startDate)).getTime();
        const end = endOfDay(parseISO(endDate)).getTime();
        
        const filteredRequests = prayedRequests.filter(req => {
            return req.createdAt >= start && req.createdAt <= end;
        });

        if (filteredRequests.length === 0) {
            toast.error("No requests found in the selected date range");
            return;
        }

        // If existingLog is undefined, we wait a moment or just block
        if (!force && existingLog) {
            setPendingDownload({ type: "prayer_requests", count: filteredRequests.length });
            setIsDuplicateModalOpen(true);
            return;
        }

        const doc = new jsPDF();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(24);
        doc.setTextColor(33, 33, 33);
        doc.text("Prayer Requests Report", 14, 22);
        
        doc.setLineWidth(0.7);
        doc.line(14, 26, 196, 26);

        // Group by category
        const categorized: Record<string, PrayerRequest[]> = {};
        filteredRequests.forEach(req => {
            const cat = req.category || "Others";
            if (!categorized[cat]) categorized[cat] = [];
            categorized[cat].push(req);
        });

        let yPos = 40;
        
        Object.keys(categorized).forEach((category) => {
            // Check for page overflow
            if (yPos > 260) {
                doc.addPage();
                yPos = 20;
            }
            
            // Category Heading
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.setFont("helvetica", "bold");
            doc.text(category, 14, yPos);
            yPos += 2;
            
            // Requisitions using autoTable for mixed styling
            autoTable(doc, {
                startY: yPos,
                body: categorized[category].map(req => [
                    `• ${req.name} - `,
                    `${req.request}`
                ]),
                theme: 'plain',
                styles: { 
                    fontSize: 10, 
                    cellPadding: { top: 0.5, bottom: 0.5, left: 1, right: 1 },
                    textColor: 50,
                    valign: 'top',
                },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 'wrap', paddingRight: 0 },
                    1: { fontStyle: 'normal', paddingLeft: 2 }
                },
                margin: { left: 16 },
                tableWidth: 'wrap',
                didDrawPage: (data) => {
                    yPos = data.cursor ? data.cursor.y : yPos;
                }
            });
            
            // Update yPos for next category
            yPos = (doc as any).lastAutoTable.finalY + 10;
        });

        await logPdfDownload({
            type: "prayer_requests",
            startDate,
            endDate,
            itemCount: filteredRequests.length,
        });

        doc.save(`prayer_requests_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    };

    const handleDownloadFirstTimersPDF = async (force: boolean = false) => {
        const start = startOfDay(parseISO(startDate)).getTime();
        const end = endOfDay(parseISO(endDate)).getTime();
        
        const filtered = firstTimerRequests.filter(req => {
            return req.status === "Prayed" && req.createdAt >= start && req.createdAt <= end;
        });

        if (filtered.length === 0) {
            toast.error("No acknowledged first timers found in the selected date range");
            return;
        }

        if (!force && existingLog) {
            setPendingDownload({ type: "first_timers", count: filtered.length });
            setIsDuplicateModalOpen(true);
            return;
        }

        const doc = new jsPDF();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(24);
        doc.setTextColor(33, 33, 33);
        doc.text("First Timer Report", 14, 22);
        
        doc.setLineWidth(0.7);
        doc.line(14, 26, 196, 26);

        autoTable(doc, {
            startY: 40,
            head: [['Date', 'Name', 'Message/Details']],
            body: filtered.map(req => [
                format(new Date(req.createdAt), "MMM d"),
                req.name,
                req.request
            ]),
            styles: { fontSize: 10 },
            headStyles: { fillStyle: 'DF', fillColor: [99, 102, 241] }
        });

        await logPdfDownload({
            type: "first_timers",
            startDate,
            endDate,
            itemCount: filtered.length,
        });

        doc.save(`first_timers_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    };

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
                                                {req.category && (
                                                    <Badge variant="outline" className="text-[10px] py-0 h-4 mt-1 bg-primary/5 text-primary border-primary/20">
                                                        {req.category}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {req.status === "Prayed" && (
                                                    <div className="flex flex-col items-end gap-1">
                                                        <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20 text-[10px] px-1.5 h-5">
                                                            Acknowledged
                                                        </Badge>
                                                        {req.acknowledgedByName && (
                                                            <span className="text-[9px] text-muted-foreground whitespace-nowrap opacity-70 italic font-medium">
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
        <Layout>
            <div className="space-y-6 animate-fade-in p-2 md:p-0">
                {/* Styled Header matching RolePages */}
                <div className="gradient-leader glass rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-success/10 -translate-y-1/2 translate-x-1/3 blur-3xl" />
                    <h1 className="text-2xl font-bold mb-1 relative">Prayer Requests</h1>
                    <p className="text-muted-foreground relative">
                        Manage and pray for your community's requests.
                    </p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 bg-background/50 p-2 rounded-xl border border-border/40">
                        <TabsList className="grid w-full grid-cols-3 max-w-[480px] h-10 p-1">
                            <TabsTrigger value="submitted" className="text-xs">Submitted ({submittedRequests.length})</TabsTrigger>
                            <TabsTrigger value="prayed" className="text-xs">Acknowledged ({prayedRequests.length})</TabsTrigger>
                            <TabsTrigger value="firsttimers" className="text-xs">First Timers ({firstTimerRequests.length})</TabsTrigger>
                        </TabsList>

                        {(activeTab === "prayed" || activeTab === "firsttimers") && (
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="start-date" className="text-[10px] uppercase font-bold text-muted-foreground whitespace-nowrap">From</Label>
                                    <Input
                                        id="start-date"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="h-8 text-[11px] w-[150px] bg-background"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="end-date" className="text-[10px] uppercase font-bold text-muted-foreground whitespace-nowrap">To</Label>
                                    <Input
                                        id="end-date"
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="h-8 text-[11px] w-[150px] bg-background"
                                    />
                                </div>
                                <Button 
                                    size="sm" 
                                    className="gap-2 text-[11px] h-8 px-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold disabled:opacity-70"
                                    onClick={activeTab === "firsttimers" ? handleDownloadFirstTimersPDF : handleDownloadPDF}
                                    disabled={
                                        (activeTab === "firsttimers" ? firstTimerRequests.length === 0 : prayedRequests.length === 0) ||
                                        existingLog === undefined
                                    }
                                >
                                    {existingLog === undefined ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <FileDown className="h-3.5 w-3.5" />
                                    )}
                                    {existingLog === undefined ? "Checking..." : `Download ${activeTab === "firsttimers" ? "First Timers" : "Prayer Requests"} PDF`}
                                </Button>
                            </div>
                        )}
                    </div>

                    <ScrollArea className="h-[calc(100vh-280px)]">
                        <TabsContent value="submitted" className="mt-0">
                            {renderRequestList(groupedSubmitted, "No active prayer requests.")}
                        </TabsContent>
                        <TabsContent value="prayed" className="mt-0">
                            {renderRequestList(groupedPrayed, "No acknowledged requests yet.")}
                        </TabsContent>
                        <TabsContent value="firsttimers" className="mt-0">
                            {renderRequestList(groupedFirstTimers, "No first timer messages yet.")}
                        </TabsContent>
                    </ScrollArea>
                </Tabs>
            </div>

            <Dialog open={isDuplicateModalOpen} onOpenChange={setIsDuplicateModalOpen}>
                <DialogContent className="sm:max-w-[400px] rounded-3xl p-6">
                    <DialogHeader>
                        <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                            <AlertCircle className="h-6 w-6 text-amber-500" />
                        </div>
                        <DialogTitle className="text-xl font-bold">Duplicate Download?</DialogTitle>
                        <p className="text-sm text-muted-foreground pt-2">
                            The PDF file with date range from <span className="font-bold text-foreground">{startDate}</span> to <span className="font-bold text-foreground">{endDate}</span> was already printed by <span className="font-bold text-primary">{existingLog?.userName}</span> today.
                        </p>
                    </DialogHeader>
                    <DialogFooter className="mt-6 gap-2">
                        <Button variant="outline" onClick={() => setIsDuplicateModalOpen(false)} className="rounded-xl flex-1">
                            Exit
                        </Button>
                        <Button 
                            onClick={async () => {
                                setIsDuplicateModalOpen(false);
                                if (pendingDownload?.type === "prayer_requests") {
                                    await handleDownloadPDF(true);
                                } else {
                                    await handleDownloadFirstTimersPDF(true);
                                }
                            }}
                            className="rounded-xl flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            Print
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Layout>
    );
}
