import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { DashboardCard } from "@/components/DashboardCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    ClipboardList,
    Search,
    Trash2,
    Plus,
    Loader2,
    Filter,
    Check,
    XCircle,
    AlertCircle,
    CheckCircle2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useViewMode } from "@/contexts/ViewModeContext";
import { AssignmentDialog } from "@/components/AssignmentDialog";
import { toast } from "sonner";
import { format } from "date-fns";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { getTracing } from "@/lib/tracing";

export default function AssignmentsPage() {
    // ... rest of the component
    const { user } = useAuth();
    const { viewMode } = useViewMode();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [confirmStatus, setConfirmStatus] = useState<{ id: string; status: "completed" | "acknowledged" | "not_available" | "pending"; title: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isLeaderView = viewMode === "leader" || user?.role === "admin";
    const ministryId = user?.ministryIds?.[0];

    // Queries
    const memberAssignments = useQuery(
        api.assignments.listByMember,
        user?._id ? { memberId: user._id as any } : "skip"
    ) || [];

    const ministryAssignments = useQuery(
        api.assignments.listByMinistry,
        isLeaderView && ministryId ? { ministryId: ministryId as any } : "skip"
    ) || [];

    // Mutations
    const updateStatus = useMutation(api.assignments.updateStatus);
    const removeAssignment = useMutation(api.assignments.remove);

    const assignments = isLeaderView ? ministryAssignments : memberAssignments;

    const filteredAssignments = assignments.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (isLeaderView && (a as any).memberName?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const pendingAssignments = filteredAssignments.filter(a => a.status === "pending");
    const acknowledgedAssignments = filteredAssignments.filter(a => a.status === "acknowledged");
    const completedAssignments = filteredAssignments.filter(a => a.status === "completed");
    const notAvailableAssignments = filteredAssignments.filter(a => a.status === "not_available");

    const handleUpdateStatus = async () => {
        if (!confirmStatus) return;
        setIsSubmitting(true);
        try {
            await updateStatus({
                id: confirmStatus.id as any,
                status: confirmStatus.status,
                tracing: getTracing()
            });
            toast.success(`Assignment marked as ${confirmStatus.status.replace("_", " ")}`);
        } catch (error) {
            toast.error("Failed to update status");
        } finally {
            setIsSubmitting(false);
            setConfirmStatus(null);
        }
    };

    const handleDelete = async (id: any) => {
        if (confirm("Are you sure you want to remove this assignment?")) {
            try {
                await removeAssignment({
                    id,
                    tracing: getTracing()
                });
                toast.success("Assignment removed");
            } catch (error) {
                toast.error("Failed to remove assignment");
            }
        }
    };

    if (!user) return null;

    return (
        <>
            <div className="space-y-6 animate-fade-in pb-20">
                <div className={`${isLeaderView ? 'gradient-leader' : 'gradient-member'} glass rounded-2xl p-6 relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-primary/10 -translate-y-1/2 translate-x-1/3 blur-3xl" />
                    <h1 className="text-2xl font-bold mb-1 relative">Weekly Assignments</h1>
                    <p className="text-muted-foreground relative">
                        {isLeaderView
                            ? "Manage and track tasks for your ministry members."
                            : "View and complete your assigned tasks for the week."}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search assignments..."
                            className="pl-9 glass-subtle border-0"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {isLeaderView && (
                        <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
                            <Plus className="h-4 w-4 mr-2" /> New Assignment
                        </Button>
                    )}
                </div>

                <Tabs defaultValue="pending" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 max-w-[600px] glass-subtle mb-4 sm:mb-6 h-auto p-1">
                        <TabsTrigger value="pending" className="text-[10px] sm:text-sm py-1.5 px-2">
                            Pending ({pendingAssignments.length})
                        </TabsTrigger>
                        <TabsTrigger value="acknowledged" className="text-[10px] sm:text-sm py-1.5 px-2">
                            Ack ({acknowledgedAssignments.length})
                        </TabsTrigger>
                        <TabsTrigger value="completed" className="text-[10px] sm:text-sm py-1.5 px-2">
                            Done ({completedAssignments.length})
                        </TabsTrigger>
                        <TabsTrigger value="not_available" className="text-[10px] sm:text-sm py-1.5 px-2">
                            N/A ({notAvailableAssignments.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pending" className="mt-0">
                        <AssignmentList
                            items={pendingAssignments}
                            isLeaderView={isLeaderView}
                            onUpdateStatus={(id, status, title) => setConfirmStatus({ id, status, title })}
                            onDelete={handleDelete}
                        />
                    </TabsContent>
                    <TabsContent value="acknowledged" className="mt-0">
                        <AssignmentList
                            items={acknowledgedAssignments}
                            isLeaderView={isLeaderView}
                            onUpdateStatus={(id, status, title) => setConfirmStatus({ id, status, title })}
                            onDelete={handleDelete}
                        />
                    </TabsContent>
                    <TabsContent value="completed" className="mt-0">
                        <AssignmentList
                            items={completedAssignments}
                            isLeaderView={isLeaderView}
                            onUpdateStatus={(id, status, title) => setConfirmStatus({ id, status, title })}
                            onDelete={handleDelete}
                        />
                    </TabsContent>
                    <TabsContent value="not_available" className="mt-0">
                        <AssignmentList
                            items={notAvailableAssignments}
                            isLeaderView={isLeaderView}
                            onUpdateStatus={(id, status, title) => setConfirmStatus({ id, status, title })}
                            onDelete={handleDelete}
                        />
                    </TabsContent>
                </Tabs>
            </div>

            <AssignmentDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                ministryId={ministryId as any}
            />

            <AlertDialog open={!!confirmStatus} onOpenChange={(open) => !open && setConfirmStatus(null)}>
                <AlertDialogContent className="glass-strong">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-primary" />
                            Confirm Status Update
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to mark "{confirmStatus?.title}" as{" "}
                            <strong className="text-foreground">
                                {confirmStatus?.status.replace("_", " ")}
                            </strong>
                            ? This action will be visible to your ministry leader.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleUpdateStatus();
                            }}
                            disabled={isSubmitting}
                            className={confirmStatus?.status === "not_available" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Confirm"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function AssignmentList({ items, isLeaderView, onUpdateStatus, onDelete }: {
    items: any[],
    isLeaderView: boolean,
    onUpdateStatus: (id: any, status: any, title: string) => void,
    onDelete: (id: any) => void
}) {
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground glass-subtle rounded-2xl border border-dashed border-primary/20">
                <ClipboardList className="h-12 w-12 mb-4 opacity-20" />
                <p>No assignments found.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4">
            {items.map((a) => (
                <Card key={a._id} className="glass-subtle border-0 hover:shadow-md transition-all group">
                    <div className="p-4 sm:p-6 flex items-start gap-4">
                        <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 border transition-colors ${a.status === "completed"
                            ? "bg-success/20 border-success text-success"
                            : a.status === "acknowledged"
                                ? "bg-info/20 border-info text-info"
                                : a.status === "not_available"
                                    ? "bg-destructive/20 border-destructive text-destructive"
                                    : "bg-primary/10 border-primary/20 text-primary"
                            }`}>
                            <ClipboardList className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-2">
                                <div>
                                    <h3 className={`font-semibold text-lg leading-tight ${a.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                                        {a.title}
                                        {a.status !== "pending" && (
                                            <Badge variant="outline" className={`ml-2 text-[10px] uppercase font-bold px-1.5 py-0 ${a.status === "completed" ? "border-success text-success" :
                                                a.status === "acknowledged" ? "border-info text-info" :
                                                    "border-destructive text-destructive"
                                                }`}>
                                                {a.status.replace("_", " ")}
                                            </Badge>
                                        )}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-muted-foreground font-medium">
                                        {isLeaderView ? (
                                            <span className="flex items-center gap-1">
                                                Assigned: <span className="text-foreground">{a.memberName}</span>
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1">
                                                Ministry: <span className="text-foreground">{a.ministryName}</span>
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1 whitespace-nowrap">
                                            Due: <span className="text-foreground">{a.dueDate}</span>
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-row items-center gap-2 mt-1 sm:mt-0">
                                    {!isLeaderView && (
                                        <>
                                            {a.status !== "completed" && (
                                                <Button
                                                    size="sm"
                                                    className="bg-success hover:bg-success/90 text-white gap-1 sm:gap-1.5 h-8 flex-1 sm:flex-none text-[11px] sm:text-xs px-2 sm:px-3"
                                                    onClick={() => onUpdateStatus(a._id, "completed", a.title)}
                                                >
                                                    <Check className="h-3.5 w-3.5" /> <span className="sm:inline">Done</span>
                                                </Button>
                                            )}
                                            {a.status !== "acknowledged" && (
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="gap-1 sm:gap-1.5 h-8 flex-1 sm:flex-none text-[11px] sm:text-xs px-2 sm:px-3"
                                                    onClick={() => onUpdateStatus(a._id, "acknowledged", a.title)}
                                                >
                                                    <ClipboardList className="h-3.5 w-3.5" /> <span className="sm:inline">Ack</span>
                                                </Button>
                                            )}
                                            {a.status !== "not_available" && (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="gap-1 sm:gap-1.5 h-8 flex-1 sm:flex-none text-[11px] sm:text-xs px-2 sm:px-3"
                                                    onClick={() => onUpdateStatus(a._id, "not_available", a.title)}
                                                >
                                                    <XCircle className="h-3.5 w-3.5" /> <span className="sm:inline">N/A</span>
                                                </Button>
                                            )}
                                            {a.status !== "pending" && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 px-2 text-[11px] sm:text-xs text-muted-foreground hover:bg-muted"
                                                    onClick={() => onUpdateStatus(a._id, "pending", a.title)}
                                                >
                                                    Undo
                                                </Button>
                                            )}
                                        </>
                                    )}
                                    {isLeaderView && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                            onClick={() => onDelete(a._id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                            {a.description && (
                                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                                    {a.description}
                                </p>
                            )}
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}

function Card({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={`rounded-2xl bg-card text-card-foreground shadow-sm ${className}`}>
            {children}
        </div>
    );
}
