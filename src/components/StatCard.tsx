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
  gradient?: string;
  valueClassName?: string;
}

export function StatCard({ label, value, change, icon, trend = "neutral", className, gradient, valueClassName }: StatCardProps) {
  const iconBgClass = gradient === "gradient-newcomer" || gradient === "gradient-warm" 
    ? "bg-accent/10" 
    : "bg-primary/8";

  return (
    <Card className={cn("card-hover p-3 sm:p-5 glass-strong rounded-xl border-0", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs sm:text-sm text-muted-foreground">{label}</p>
          <p className={cn("text-xl sm:text-2xl font-bold mt-1", valueClassName)}>{value}</p>
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
        <div className={cn("h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center icon-glow", iconBgClass)}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
