import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  gradient: "gradient-newcomer" | "gradient-member" | "gradient-leader" | "gradient-admin";
}

export function PageHeader({
  title,
  subtitle,
  gradient,
}: PageHeaderProps) {
  const glowMap: Record<string, string> = {
    "gradient-newcomer": "bg-accent/10",
    "gradient-member": "bg-primary/10",
    "gradient-leader": "bg-success/8",
    "gradient-admin": "bg-primary/6",
  };

  return (
    <div className={`${gradient} glass rounded-2xl p-4 sm:p-6 relative overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-48 h-48 rounded-full ${glowMap[gradient]} -translate-y-1/2 translate-x-1/3 blur-3xl`} />
      <h1 className="text-xl sm:text-2xl font-bold mb-1 relative">{title}</h1>
      <p className="text-muted-foreground relative">{subtitle}</p>
    </div>
  );
}
