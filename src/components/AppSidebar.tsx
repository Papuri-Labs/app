import {
  Home, Users, Calendar, BookOpen, Bell, Settings, Shield, UserPlus,
  BarChart3, FileText, Heart, Church, LogOut, ChevronDown, Building2, ClipboardList, ClipboardCheck, User, ArrowLeftRight, MessageSquareHeart, Image, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { useAuth, UserRole, RESERVED_ROUTE_KEYWORDS } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { getTracing } from "@/lib/tracing";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader,
} from "@/components/ui/sidebar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ProfileDialog } from "@/components/ProfileDialog";
import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useViewMode } from "@/contexts/ViewModeContext";
import { roleBadgeStyles } from "@/lib/role-colors";

type NavItem = { title: string; url: string; icon: React.ElementType };

const navByRole: Record<UserRole, { label: string; items: NavItem[] }[]> = {
  newcomer: [
    {
      label: "Getting Started",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: Home },
        { title: "Onboarding", url: "/onboarding", icon: UserPlus },
        { title: "About Our Church", url: "/about-church", icon: Church },
        { title: "Service Schedule", url: "/schedule", icon: Calendar },
        { title: "Giving", url: "/giving", icon: Heart },
        { title: "Gallery", url: "/gallery", icon: Image },
      ],
    },
  ],
  member: [
    {
      label: "Main",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: Home },
        { title: "Events", url: "/events", icon: Calendar },
        { title: "Bulletins", url: "/bulletins", icon: FileText },
        { title: "Bible Reading", url: "/bible-reading", icon: BookOpen },
        { title: "Announcements", url: "/announcements", icon: Bell },
        { title: "Giving", url: "/giving", icon: Heart },
        { title: "Assignments", url: "/assignments", icon: ClipboardList },
        { title: "Gallery", url: "/gallery", icon: Image },
      ],
    },
  ],
  leader: [
    {
      label: "Ministry",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: Home },
        { title: "Ministry Stats", url: "/ministry-stats", icon: BarChart3 },
        { title: "Manage Events", url: "/manage-events", icon: Calendar },
        { title: "Manage Bulletins", url: "/manage-bulletins", icon: FileText },
        { title: "Manage Bible Reading", url: "/manage-bible-reading", icon: BookOpen },
        { title: "Members", url: "/members", icon: Users },
        { title: "Attendance", url: "/attendance", icon: ClipboardCheck },
        { title: "Follow Ups", url: "/follow-ups", icon: ClipboardList },
        { title: "Assignments", url: "/assignments", icon: ClipboardCheck },
        { title: "Prayer Requests", url: "/prayer-requests", icon: MessageSquareHeart },
        { title: "Reports", url: "/reports", icon: FileText },
        { title: "Gallery", url: "/gallery", icon: Image },
      ],

    },
  ],
  finance: [
    {
      label: "Finance",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: Home },
        { title: "Record Giving", url: "/record-giving", icon: Heart },
        { title: "Transaction History", url: "/transaction-history", icon: ClipboardList },
        { title: "Giving Reports", url: "/giving-reports", icon: BarChart3 },
      ],
    },
  ],
  admin: [
    {
      label: "Administration",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: Home },
        { title: "Manage Users", url: "/manage-users", icon: Users },
        { title: "Onboarding Maintenance", url: "/onboarding-maintenance", icon: ClipboardList },
        { title: "Schedule Maintenance", url: "/schedule-maintenance", icon: Calendar },
        { title: "Giving Maintenance", url: "/giving-maintenance", icon: Heart },
        { title: "Ministry Maintenance", url: "/ministries", icon: Building2 },
        { title: "Manage Bulletins", url: "/manage-bulletins", icon: FileText },
        { title: "System Stats", url: "/system-stats", icon: Activity },
        { title: "Gallery", url: "/gallery", icon: Image },
        { title: "Settings", url: "/settings", icon: Settings },
      ],
    },
  ],
};

const roleLabels: Record<UserRole, string> = {
  newcomer: "Newcomer",
  member: "Member",
  leader: "Leader",
  finance: "Finance User",
  admin: "Admin",
};

// roleColors is now handled by roleBadgeStyles in role-colors.ts

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const logUIEvent = useMutation(api.logs.logUIEvent);
  const [profileOpen, setProfileOpen] = useState(false);
  const { viewMode, setViewMode } = useViewMode();
  const { orgSlug: urlSlug } = useParams();

  // Robust slug detection for the sidebar header & branding
  const getEffectiveSlug = () => {
    if (urlSlug && !RESERVED_ROUTE_KEYWORDS.includes(urlSlug)) return urlSlug;
    
    // Fallback to URL parsing if useParams is empty
    const parts = location.pathname.split("/");
    if (parts[1] && !RESERVED_ROUTE_KEYWORDS.includes(parts[1])) return parts[1];
    
    // Ultimate fallback for authenticated users: Their assigned home church
    return user?.organizationSlug || "my-church";
  };

  const orgSlug = getEffectiveSlug();

  // Guest queries - only run if no user is present
  const publicOrg = useQuery(api.organizations.getPublic, !user ? { slug: orgSlug } : "skip");
  const publicSettings = useQuery(api.settings.getPublic, (!user && publicOrg) ? { organizationId: publicOrg._id } : "skip");

  // Authenticated queries - only run if user exists AND we are not using a placeholder slug for guests
  const isPlaceholder = orgSlug === "my-church";
  const organization = useQuery(api.organizations.get, (user && !isPlaceholder) ? { slug: orgSlug } : "skip");
  const settings = useQuery(api.settings.get, (user && !isPlaceholder) ? { orgSlug } : "skip");

  const displayOrg = user ? (organization || publicOrg) : publicOrg;
  const displaySettings = user ? (settings || publicSettings) : publicSettings;

  // Determine effective role based on view mode
  let effectiveRole: UserRole = user?.role || "newcomer";
  const canAccessFinance = user?.isFinance || user?.role === 'finance';

  if (user && (user.role === 'leader' || canAccessFinance)) {
    effectiveRole = viewMode as UserRole;
  }

  const groups = user ? navByRole[effectiveRole] : [
    {
      label: "Guest Access",
      items: [
        { title: "About Our Church", url: "/about-church", icon: Church },
        { title: "Service Schedule", url: "/schedule", icon: Calendar },
        { title: "Bulletins", url: "/bulletins", icon: FileText },
        { title: "Events", url: "/events", icon: Calendar },
        { title: "Giving", url: "/giving", icon: Heart },
        { title: "Gallery", url: "/gallery", icon: Image },
      ],
    },
  ];

  // Helper to prepend slug to URLs
  const getSlugUrl = (url: string) => {
    if (url === "/") return `/${orgSlug}`;
    return `/${orgSlug}${url}`;
  };

  // Check if a module is enabled
  const isModuleEnabled = (itemTitle: string) => {
    if (!displaySettings?.enabledModules) return true; // Default to all enabled if not set
    const moduleMap: Record<string, string> = {
      "Gallery": "gallery",
      "Giving": "giving",
      "Prayer Requests": "prayer",
      "Bulletins": "bulletins",
      "Bible Reading": "bible",
      "Announcements": "announcements",
      "Events": "events",
      "Follow Ups": "followups",
      "Assignments": "assignments",
      "Record Giving": "giving",
      "Transaction History": "giving",
      "Giving Reports": "giving",
    };
    const moduleKey = moduleMap[itemTitle];
    if (!moduleKey) return true; // core items like Dashboard, Manage Users, etc.
    return displaySettings.enabledModules.includes(moduleKey);
  };

  const filteredGroups = groups.map(group => ({
    ...group,
    items: group.items.filter(item => isModuleEnabled(item.title))
  }));

  return (
    <Sidebar collapsible="icon" {...props} className="border-r border-border/10 glass-subtle animate-fade-in z-40">
      <SidebarHeader className="p-3 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shadow-sm overflow-hidden">
            {displaySettings?.logoUrl ? (
              <img src={displaySettings.logoUrl} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <Church className="h-5 w-5 text-primary-foreground" />
            )}
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h2 className="text-sm font-semibold text-sidebar-foreground">{displayOrg?.name || "MAGI Church"}</h2>
            <p className="text-xs text-muted-foreground">{displaySettings?.welcomeTitle || "Welcome to Worship"}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {filteredGroups?.map((group) => (
          <SidebarGroup key={group.label} className="mb-4">
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2 group-data-[collapsible=icon]:hidden">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === getSlugUrl(item.url)}
                      tooltip={item.title}
                      onClick={() => {
                        logUIEvent({
                          action: "NAV_CLICK",
                          details: `User navigated to ${item.title}`,
                          metadata: { url: item.url, title: item.title },
                          tracing: getTracing(),
                        });
                      }}
                      className={`
                        mb-1 transition-all duration-200 rounded-lg
                        ${location.pathname === getSlugUrl(item.url) ?
                          'bg-primary text-primary-foreground font-medium shadow-sm' :
                          'text-muted-foreground hover:text-foreground hover:bg-muted/50'}
                      `}
                    >
                      <Link to={getSlugUrl(item.url)} className="flex items-center gap-3 px-3 py-2">
                        <item.icon className={`h-4 w-4 ${location.pathname === getSlugUrl(item.url) ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`} />
                        <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-border/30">
        {user ? (
          <>
            <ProfileDialog isOpen={profileOpen} onOpenChange={setProfileOpen} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-primary/5 transition-all duration-200 group-data-[collapsible=icon]:justify-center">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                      {user.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium text-sidebar-foreground">{user.name}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${roleBadgeStyles[effectiveRole]}`}>
                      {(effectiveRole === "leader" || effectiveRole === "member") && user.ministryNames && user.ministryNames.length > 0
                        ? `${user.ministryNames.join(", ")} ${effectiveRole === "leader" ? "Leader" : "Member"}`
                        : roleLabels[effectiveRole]}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass-strong">
                {/* Role Switcher - Show for leaders and finance users */}
                {(user.role === 'leader' || canAccessFinance) && (
                  <>
                    {/* Show "Switch to Member View" if not already in member view */}
                    {viewMode !== 'member' && (
                      <DropdownMenuItem
                        onClick={() => {
                          logUIEvent({
                            action: "ROLE_SWITCH",
                            details: `User switched view mode to member`,
                            metadata: { from: viewMode, to: 'member' },
                            tracing: getTracing(),
                          });
                          setViewMode('member');
                          navigate(getSlugUrl("/dashboard"));
                        }}
                        className="cursor-pointer"
                      >
                        <ArrowLeftRight className="h-4 w-4 mr-2" />
                        Switch to Member View
                      </DropdownMenuItem>
                    )}

                    {/* Show "Switch to Leader View" for leaders not in leader view */}
                    {user.role === 'leader' && viewMode !== 'leader' && (
                      <DropdownMenuItem
                        onClick={() => {
                          logUIEvent({
                            action: "ROLE_SWITCH",
                            details: `User switched view mode to leader`,
                            metadata: { from: viewMode, to: 'leader' },
                            tracing: getTracing(),
                          });
                          setViewMode('leader');
                          navigate(getSlugUrl("/dashboard"));
                        }}
                        className="cursor-pointer"
                      >
                        <ArrowLeftRight className="h-4 w-4 mr-2" />
                        Switch to Leader View
                      </DropdownMenuItem>
                    )}

                    {/* Show "Switch to Finance View" for finance users not in finance view */}
                    {canAccessFinance && viewMode !== 'finance' && (
                      <DropdownMenuItem
                        onClick={() => {
                          logUIEvent({
                            action: "ROLE_SWITCH",
                            details: `User switched view mode to finance`,
                            metadata: { from: viewMode, to: 'finance' },
                            tracing: getTracing(),
                          });
                          setViewMode('finance');
                          navigate(getSlugUrl("/dashboard"));
                        }}
                        className="cursor-pointer"
                      >
                        <ArrowLeftRight className="h-4 w-4 mr-2" />
                        Switch to Finance View
                      </DropdownMenuItem>
                    )}

                    <div className="h-px bg-border my-1" />
                  </>
                )}

                <DropdownMenuItem onClick={() => setProfileOpen(true)} className="cursor-pointer">
                  <User className="h-4 w-4 mr-2" /> Profile
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => logout()} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Button
            asChild
            className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors group-data-[collapsible=icon]:p-0"
          >
            <Link to={getSlugUrl("/login")}>
              <LogOut className="h-4 w-4 rotate-180" />
              <span className="group-data-[collapsible=icon]:hidden">Sign In</span>
            </Link>
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
