"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  FileText,
  Gauge,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Network,
  Shield,
  Users
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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

export function AppShell({ children, role }: { children: React.ReactNode; role: Role }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, hydrated, hydrate, logout } = useAuthStore();
  const nav = navByRole[role];

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

  const sidebar = (
    <div className="flex h-full flex-col gap-6">
      <Link href="/" className="flex items-center gap-2 px-2 font-semibold">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Gauge className="h-5 w-5" />
        </span>
        <span>PlaceMate AI</span>
      </Link>
      <nav className="grid gap-1">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                active && "bg-accent text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/20">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-background/95 p-4 backdrop-blur lg:block">
        {sidebar}
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur lg:px-8">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">{sidebar}</SheetContent>
          </Sheet>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Stage 1 MVP</p>
            <h1 className="text-base font-semibold">{user?.name ?? "PlaceMate AI"}</h1>
          </div>
          <ThemeToggle />
          <Avatar className="h-9 w-9">
            <AvatarFallback>{user?.name?.slice(0, 2).toUpperCase() ?? "PM"}</AvatarFallback>
          </Avatar>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              logout();
              router.push("/login");
            }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </header>
        <main className="container py-6">{children}</main>
      </div>
    </div>
  );
}
