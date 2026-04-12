import { Layout } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { DashboardCard } from "@/components/DashboardCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Heart, TrendingUp, Users, ClipboardList } from "lucide-react";
import { Link, useParams } from "react-router-dom";

export default function FinanceDashboard() {
    const { orgSlug } = useParams<{ orgSlug: string }>();
    const { user } = useAuth();

    // Get giving statistics for the finance user's ministry
    const stats = useQuery(api.givingTransactions.getStats, {});
    const recentTransactions = useQuery(api.givingTransactions.listByMinistry, {});

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div className="gradient-newcomer glass rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-accent/8 -translate-y-1/2 translate-x-1/3 blur-3xl" />
                    <h1 className="text-2xl font-bold mb-1 relative font-outfit">Finance Dashboard</h1>
                    <p className="text-muted-foreground relative">
                        Manage giving and track contributions for {user?.ministryNames?.join(", ") || "your ministry"}
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="This Month"
                        value={`₱${stats?.totalThisMonth?.toLocaleString() || "0"}`}
                        icon={<Heart className="h-5 w-5 text-accent" />}
                        gradient="gradient-newcomer"
                        valueClassName="text-accent font-outfit"
                    />
                    <StatCard
                        label="Total All Time"
                        value={`₱${stats?.totalAllTime?.toLocaleString() || "0"}`}
                        icon={<TrendingUp className="h-5 w-5 text-accent" />}
                        gradient="gradient-newcomer"
                        valueClassName="text-accent font-outfit"
                    />
                    <StatCard
                        label="Transactions"
                        value={stats?.transactionCount || 0}
                        icon={<ClipboardList className="h-5 w-5 text-accent" />}
                        gradient="gradient-newcomer"
                    />
                    <StatCard
                        label="Active Givers"
                        value={stats?.uniqueGivers || 0}
                        icon={<Users className="h-5 w-5 text-accent" />}
                        gradient="gradient-newcomer"
                    />
                </div>

                {/* Quick Actions */}
                <DashboardCard
                    title="Quick Actions"
                    icon={<Heart className="h-5 w-5 text-accent" />}
                    gradient="gradient-newcomer"
                >
                    <div className="flex flex-wrap gap-3">
                        <Link to={`/${orgSlug}/record-giving`}>
                            <Button className="gap-2">
                                <Heart className="h-4 w-4" />
                                Record New Transaction
                            </Button>
                        </Link>
                        <Link to={`/${orgSlug}/transaction-history`}>
                            <Button variant="outline" className="gap-2">
                                <ClipboardList className="h-4 w-4" />
                                View All Transactions
                            </Button>
                        </Link>
                    </div>
                </DashboardCard>

                {/* Recent Transactions */}
                <DashboardCard
                    title="Recent Transactions"
                    description="Last 10 transactions recorded"
                    icon={<ClipboardList className="h-5 w-5 text-accent" />}
                    gradient="gradient-newcomer"
                >
                    {!recentTransactions || recentTransactions.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            No transactions recorded yet. Start by recording a new transaction.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {recentTransactions.slice(0, 10).map((transaction) => (
                                <div
                                    key={transaction._id}
                                    className="p-4 rounded-xl glass-subtle flex items-center justify-between"
                                >
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold">{transaction.userName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {transaction.givingType} • {new Date(transaction.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-accent font-outfit">
                                            ₱{transaction.amount.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </DashboardCard>
            </div>
        </Layout>
    );
}
