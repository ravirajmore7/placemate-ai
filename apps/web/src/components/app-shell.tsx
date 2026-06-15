"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Gauge,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Network,
  Search,
  Shield,
  Sparkles,
  Users
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";

const navByRole: Record<Role, Array<{ href: string; label: string; icon: React.ElementType }>> = {
  STUDENT: [
    { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/student/profile", label: "Profile", icon: GraduationCap },
    { href: "/student/resume", label: "Resume", icon: FileText },
    { href: "/student/coding-profiles", label: "Coding Profiles", icon: Network },
    { href: "/student/drives", label: "Company Drives", icon: BriefcaseBusiness },
    { href: "/student/applications", label: "Applications", icon: ListChecks },
    { href: "/student/readiness", label: "Readiness", icon: Gauge }
  ],
  TPO_ADMIN: [
    { href: "/tpo/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tpo/students", label: "Students", icon: Users },
    { href: "/tpo/drives", label: "Manage Drives", icon: BriefcaseBusiness },
    { href: "/tpo/drives/new", label: "Create Drive", icon: Building2 },
    { href: "/tpo/applications", label: "Applications", icon: ListChecks },
    { href: "/tpo/eligible", label: "Shortlist", icon: Gauge },
    { href: "/tpo/reports", label: "Reports", icon: BarChart3 }
  ],
  SUPER_ADMIN: [
    { href: "/admin/overview", label: "Overview", icon: Shield },
    { href: "/admin/colleges", label: "Colleges", icon: Building2 },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/stats", label: "System Stats", icon: BarChart3 }
  ],
  COLLEGE_ADMIN: [],
  RECRUITER: []
};

const roleMeta: Record<Role, { label: string; badge: string }> = {
  STUDENT: { label: "Student Workspace", badge: "SkillProof" },
  TPO_ADMIN: { label: "Placement Office", badge: "TPO" },
  SUPER_ADMIN: { label: "Platform Admin", badge: "Admin" },
  COLLEGE_ADMIN: { label: "College Admin", badge: "College" },
  RECRUITER: { label: "Recruiter Portal", badge: "Recruiter" }
};

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getActivePage(pathname: string, nav: Array<{ href: string; label: string }>) {
  return [...nav].sort((a, b) => b.href.length - a.href.length).find((item) => isActive(pathname, item.href));
}

function ProductMark({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link href="/" className={cn("flex min-w-0 items-center gap-3 px-1", collapsed && "justify-center")}>
      <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
        <Gauge className="h-5 w-5" />
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-background bg-emerald-400" />
      </span>
      {!collapsed ? (
        <span className="min-w-0">
          <span className="block truncate font-semibold tracking-tight">PlaceMate AI</span>
          <span className="block truncate text-xs text-muted-foreground">SkillProof placement OS</span>
        </span>
      ) : null}
    </Link>
  );
}

function SidebarNav({
  nav,
  pathname,
  collapsed = false
}: {
  nav: Array<{ href: string; label: string; icon: React.ElementType }>;
  pathname: string;
  collapsed?: boolean;
}) {
  return (
    <nav className="grid gap-1">
      {nav.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground",
              active && "bg-primary/10 text-primary shadow-sm",
              collapsed && "justify-center px-2"
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
            {!collapsed ? <span className="truncate">{item.label}</span> : null}
            {active ? <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-primary" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children, role }: { children: React.ReactNode; role: Role }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, hydrated, hydrate, logout } = useAuthStore();
  const nav = navByRole[role];
  const [collapsed, setCollapsed] = React.useState(false);
  const activePage = getActivePage(pathname, nav);
  const meta = roleMeta[role];

  React.useEffect(() => {
    hydrate();
  }, [hydrate]);

  React.useEffect(() => {
    if (!hydrated) return;
    if (!token) router.replace("/login");
    if (user && user.role !== role) {
      const fallback =
        user.role === "STUDENT" ? "/student/dashboard" : user.role === "TPO_ADMIN" ? "/tpo/dashboard" : "/admin/overview";
      router.replace(fallback);
    }
  }, [hydrated, token, user, role, router]);

  const handleLogout = React.useCallback(() => {
    logout();
    router.push("/login");
  }, [logout, router]);

  const sidebar = (isCollapsed = false) => (
    <div className="flex h-full flex-col gap-6">
      <ProductMark collapsed={isCollapsed} />
      {!isCollapsed ? (
        <div className="rounded-xl border bg-muted/30 p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {meta.label}
          </div>
          <Badge variant="secondary" className="mt-2">
            {meta.badge}
          </Badge>
        </div>
      ) : null}
      <SidebarNav nav={nav} pathname={pathname} collapsed={isCollapsed} />
    </div>
  );

  return (
    <div className="app-surface min-h-screen">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r bg-background/80 p-4 backdrop-blur-xl transition-[width] duration-300 lg:block",
          collapsed ? "w-20" : "w-72"
        )}
      >
        {sidebar(collapsed)}
        <Button
          variant="outline"
          size="icon"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-4 top-6 h-8 w-8 rounded-full bg-background"
          onClick={() => setCollapsed((value) => !value)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </aside>
      <div className={cn("transition-[padding] duration-300", collapsed ? "lg:pl-20" : "lg:pl-72")}>
        <header className="sticky top-0 z-20 border-b bg-background/75 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open navigation">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                {sidebar(false)}
              </SheetContent>
            </Sheet>
            <div className="min-w-0 flex-1">
              <p className="hidden text-xs text-muted-foreground sm:block">
                {meta.label} / {activePage?.label ?? "Workspace"}
              </p>
              <h1 className="truncate text-sm font-semibold sm:text-base">{activePage?.label ?? "PlaceMate AI"}</h1>
            </div>
            <div className="relative hidden w-full max-w-xs md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="h-9 bg-background/60 pl-9" placeholder="Search students, drives, reports..." />
            </div>
            <Button variant="outline" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
            </Button>
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{user?.name?.slice(0, 2).toUpperCase() ?? "PM"}</AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-32 truncate text-sm font-medium xl:inline">{user?.name ?? "PlaceMate AI"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="grid gap-1">
                    <span className="truncate">{user?.name ?? "PlaceMate AI"}</span>
                    <span className="truncate text-xs font-normal text-muted-foreground">{user?.email ?? meta.label}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
