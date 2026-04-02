import { Layout } from "@/components/Layout";
import { DashboardCard } from "@/components/DashboardCard";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ClipboardList } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function TransactionHistoryPage() {
    const { user } = useAuth();

    // Get all transactions for the finance user's ministry
    const transactions = useQuery(api.givingTransactions.listByMinistry, {});

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div className="gradient-leader glass rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-success/8 -translate-y-1/2 translate-x-1/3 blur-3xl" />
                    <h1 className="text-2xl font-bold mb-1 relative">Transaction History</h1>
                    <p className="text-muted-foreground relative">
                        View all giving transactions for {user?.ministryNames?.join(", ") || "your ministry"}
                    </p>
                </div>

                {/* Transactions Table */}
                <DashboardCard
                    title="All Transactions"
                    description={`${transactions?.length || 0} total transactions`}
                    icon={<ClipboardList className="h-5 w-5 text-primary" />}
                    gradient="gradient-leader"
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
                                                <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                                                    {transaction.givingType}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-success">
                                                ₱{transaction.amount.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {transaction.recorderName}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                                                {transaction.notes || "-"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </DashboardCard>
            </div>
        </Layout>
    );
}
