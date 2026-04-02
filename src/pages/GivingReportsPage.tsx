import { Layout } from "@/components/Layout";
import { DashboardCard } from "@/components/DashboardCard";
import { BarChart3 } from "lucide-react";

export default function GivingReportsPage() {
    return (
        <Layout>
            <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div className="gradient-leader glass rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-success/8 -translate-y-1/2 translate-x-1/3 blur-3xl" />
                    <h1 className="text-2xl font-bold mb-1 relative">Giving Reports</h1>
                    <p className="text-muted-foreground relative">
                        View detailed giving reports and analytics
                    </p>
                </div>

                {/* Coming Soon */}
                <DashboardCard
                    title="Reports"
                    icon={<BarChart3 className="h-5 w-5 text-primary" />}
                    gradient="gradient-leader"
                >
                    <p className="text-sm text-muted-foreground text-center py-8">
                        Giving reports and analytics coming soon!
                    </p>
                </DashboardCard>
            </div>
        </Layout>
    );
}
