import { UserRole } from "@/contexts/AuthContext";

/**
 * Standard colors for User Roles that respect the organization branding (primary/accent variables).
 * These strings are Tailwind class combinations.
 */
export const roleBadgeStyles: Record<UserRole, string> = {
  admin: "bg-primary text-primary-foreground border-transparent shadow-sm",
  leader: "bg-primary/15 text-primary border border-primary/20",
  member: "bg-primary/5 text-primary/80 border border-primary/10",
  finance: "bg-accent/20 text-accent font-semibold border border-accent/30",
  newcomer: "bg-accent/10 text-accent border border-accent/20",
};

/**
 * Solid background colors for charts or simple indicators.
 */
export const roleSolidColors: Record<UserRole, string> = {
  admin: "bg-primary",
  leader: "bg-primary/70",
  member: "bg-primary/40",
  finance: "bg-accent",
  newcomer: "bg-accent/60",
};
