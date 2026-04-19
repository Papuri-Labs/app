import { useState } from "react";
import { Layout } from "@/components/Layout";
import { DashboardCard } from "@/components/DashboardCard";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ClipboardList, Pencil, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function TransactionHistoryPage() {
    const { user } = useAuth();
    
    // Get all transactions for the finance user's ministry
    const transactions = useQuery(api.givingTransactions.listByMinistry, {});
    const settings = useQuery(api.settings.get);
    
    const updateTransaction = useMutation(api.givingTransactions.updateTransaction);
    const deleteTransaction = useMutation(api.givingTransactions.deleteTransaction);

    const [editingTransaction, setEditingTransaction] = useState<any>(null);
    const [deletingTransactionId, setDeletingTransactionId] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const defaultGivingTypes = ["Tithe", "Offering", "Pledge", "Special Offering", "Mission", "Building Fund"];
    const givingTypes = settings?.givingTypes || defaultGivingTypes;

    const [editFormData, setEditFormData] = useState({
        amount: "",
        givingType: "",
        date: "",
        notes: "",
    });

    const handleEditClick = (transaction: any) => {
        setEditingTransaction(transaction);
        setEditFormData({
            amount: transaction.amount.toString(),
            givingType: transaction.givingType,
            date: transaction.date,
            notes: transaction.notes || "",
        });
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTransaction) return;

        setIsSubmitting(true);
        try {
            await updateTransaction({
                id: editingTransaction._id,
                amount: parseFloat(editFormData.amount),
                givingType: editFormData.givingType,
                date: editFormData.date,
                notes: editFormData.notes || undefined,
            });
            setEditingTransaction(null);
            alert("Transaction updated successfully!");
        } catch (error) {
            console.error("Error updating transaction:", error);
            alert("Failed to update transaction.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingTransactionId) return;

        setIsSubmitting(true);
        try {
            await deleteTransaction({ id: deletingTransactionId });
            setDeletingTransactionId(null);
            alert("Transaction deleted successfully!");
        } catch (error) {
            console.error("Error deleting transaction:", error);
            alert("Failed to delete transaction.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div className="gradient-newcomer glass rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-accent/8 -translate-y-1/2 translate-x-1/3 blur-3xl" />
                    <h1 className="text-2xl font-bold mb-1 relative font-outfit">Transaction History</h1>
                    <p className="text-muted-foreground relative">
                        View all giving transactions for {user?.ministryNames?.join(", ") || "your ministry"}
                    </p>
                </div>

                {/* Transactions Table */}
                <DashboardCard
                    title="All Transactions"
                    description={`${transactions?.length || 0} total transactions`}
                    icon={<ClipboardList className="h-5 w-5 text-accent" />}
                    gradient="gradient-newcomer"
                >
                    {!transactions || transactions.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            No transactions recorded yet.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Member</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead>Recorded By</TableHead>
                                        <TableHead>Notes</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.map((transaction) => (
                                        <TableRow key={transaction._id}>
                                            <TableCell className="font-medium">
                                                {new Date(transaction.date).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>{transaction.userName}</TableCell>
                                            <TableCell>
                                                <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-accent/10 text-accent">
                                                    {transaction.givingType}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-accent font-outfit">
                                                ₱{transaction.amount.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {transaction.recorderName}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                                                {transaction.notes || "-"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-accent"
                                                        onClick={() => handleEditClick(transaction)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        onClick={() => setDeletingTransactionId(transaction._id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </DashboardCard>
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editingTransaction} onOpenChange={(open) => !open && setEditingTransaction(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="font-outfit text-accent">Edit Transaction</DialogTitle>
                        <DialogDescription>
                            Updating transaction for <strong className="text-foreground">{editingTransaction?.userName}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-amount">Amount (₱) *</Label>
                            <Input
                                id="edit-amount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={editFormData.amount}
                                onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-givingType">Giving Type *</Label>
                            <Select
                                value={editFormData.givingType}
                                onValueChange={(value) => setEditFormData({ ...editFormData, givingType: value })}
                            >
                                <SelectTrigger id="edit-givingType">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {givingTypes.map((type: string) => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-date">Date *</Label>
                            <Input
                                id="edit-date"
                                type="date"
                                value={editFormData.date}
                                onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-notes">Notes</Label>
                            <Textarea
                                id="edit-notes"
                                value={editFormData.notes}
                                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                                rows={3}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting} className="w-full">
                                {isSubmitting ? "Updating..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deletingTransactionId} onOpenChange={(open) => !open && setDeletingTransactionId(null)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2 font-outfit">
                            Delete Transaction
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this transaction? This action cannot be undone and will affect official giving statistics.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button 
                            variant="ghost" 
                            onClick={() => setDeletingTransactionId(null)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleDelete}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Deleting..." : "Confirm Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Layout>
    );
}
