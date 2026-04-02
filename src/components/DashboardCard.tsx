import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  gradient?: string;
  onClick?: () => void;
}

export function DashboardCard({ title, description, icon, children, className, gradient, onClick }: DashboardCardProps) {
  const barGradientMap: Record<string, string> = {
    "gradient-newcomer": "gradient-bar-newcomer",
    "gradient-member": "gradient-bar-member",
    "gradient-leader": "gradient-bar-leader",
    "gradient-admin": "gradient-bar-admin",
  };
  const barClass = gradient ? barGradientMap[gradient] || "gradient-header" : "";

  return (
    <Card className={cn("card-hover glass-strong rounded-xl overflow-hidden border-0", className, onClick && "cursor-pointer")} onClick={onClick}>
      {gradient && <div className={cn("h-1", barClass)} />}
      <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-3 pb-2">
        {icon && (
          <div className="h-10 w-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 icon-glow">
            {icon}
          </div>
        )}
        <div>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
