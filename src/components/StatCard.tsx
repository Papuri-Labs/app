import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  icon: ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function StatCard({ label, value, change, icon, trend = "neutral", className }: StatCardProps) {
  return (
    <Card className={cn("card-hover p-3 sm:p-5 glass-strong rounded-xl border-0", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs sm:text-sm text-muted-foreground">{label}</p>
          <p className="text-xl sm:text-2xl font-bold mt-1">{value}</p>
          {change && (
            <p className={cn(
              "text-xs mt-1 font-medium",
              trend === "up" && "text-success",
              trend === "down" && "text-destructive",
              trend === "neutral" && "text-muted-foreground"
            )}>
              {change}
            </p>
          )}
        </div>
        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-primary/8 flex items-center justify-center icon-glow">
          {icon}
        </div>
      </div>
    </Card>
  );
}
