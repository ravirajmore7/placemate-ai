"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Activity, Building2, BriefcaseBusiness, ListChecks, Shield, Users } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { User } from "@/lib/types";
import { toTitle } from "@/lib/utils";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { PageHeader } from "@/components/page-header";
import { SimpleBarChart } from "@/components/charts";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type AdminStats = {
  totalUsers: number;
  totalStudents: number;
  totalTpoAdmins: number;
  totalDrives: number;
  totalApplications: number;
  usersByRole: Array<{ role: string; users: number }>;
};

type AdminUser = User & {
  createdAt: string;
  studentProfile?: {
    id: string;
    readinessScore: number;
    branch?: string;
    collegeName?: string;
  };
};

function useStats() {
  return useQuery({ queryKey: ["admin-stats"], queryFn: () => apiFetch<AdminStats>("/admin/stats") });
}

export function AdminOverviewPage() {
  const { data, isLoading } = useStats();
  if (isLoading) return <LoadingSkeleton rows={5} />;

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Super admin"
        title="Platform overview"
        description="Basic Stage 1 SaaS usage metrics across users, drives, and applications."
        badge="Live workspace"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Users" value={data?.totalUsers ?? 0} icon={Users} />
        <StatCard title="Students" value={data?.totalStudents ?? 0} icon={Users} />
        <StatCard title="TPO Admins" value={data?.totalTpoAdmins ?? 0} icon={Shield} />
        <StatCard title="Drives" value={data?.totalDrives ?? 0} icon={BriefcaseBusiness} />
        <StatCard title="Applications" value={data?.totalApplications ?? 0} icon={ListChecks} />
      </div>
      <Card className="soft-shadow">
        <CardHeader>
          <CardTitle>Users by role</CardTitle>
          <CardDescription>Distribution of registered accounts by role.</CardDescription>
        </CardHeader>
        <CardContent>
          <SimpleBarChart data={(data?.usersByRole ?? []).map((item) => ({ role: toTitle(item.role), users: item.users }))} xKey="role" yKey="users" />
        </CardContent>
      </Card>
    </div>
  );
}

export function CollegesPlaceholderPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Tenant management"
        title="Colleges"
        description="Reserved for Stage 2 college onboarding, plans, and tenant-level controls."
        badge="Placeholder"
      />
      <Card className="soft-shadow">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl border bg-background text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>College workspace preview</CardTitle>
              <CardDescription>Future tenant controls can live here without changing current routes.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3">
          {["Nexus Institute of Technology", "Demo College of Engineering"].map((college) => (
            <div key={college} className="flex items-center justify-between rounded-xl border bg-muted/25 p-4 text-sm">
              <span className="font-medium">{college}</span>
              <StatusBadge status="DRAFT" label="Preview" />
            </div>
          ))}
          <EmptyState
            icon={Building2}
            title="Tenant controls arrive in Stage 2"
            message="Planned fields include domain verification, TPO seats, subscription status, drive limits, and analytics scope."
            className="min-h-44"
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function UsersListPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: () => apiFetch<AdminUser[]>("/admin/users") });
  const columns: ColumnDef<AdminUser>[] = [
    {
      accessorFn: (row) => `${row.name} ${row.email}`,
      header: "User",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-xs text-muted-foreground">{row.original.email}</div>
        </div>
      )
    },
    { accessorKey: "role", header: "Role", cell: ({ row }) => <StatusBadge status={row.original.role} label={toTitle(row.original.role)} /> },
    { accessorFn: (row) => row.studentProfile?.collegeName ?? "Not applicable", header: "College" },
    { accessorFn: (row) => row.studentProfile?.branch ?? "-", header: "Branch" },
    {
      accessorFn: (row) => row.studentProfile?.readinessScore ?? 0,
      header: "Readiness",
      cell: ({ row }) => (
        row.original.studentProfile ? (
          <div className="min-w-32">
            <div className="mb-1 text-xs font-medium">{row.original.studentProfile.readinessScore}/100</div>
            <Progress value={row.original.studentProfile.readinessScore} />
          </div>
        ) : "-"
      )
    }
  ];

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="User management" title="Users" description="Basic user management view for Stage 1." />
      <Card className="soft-shadow">
        <CardContent className="pt-5">
          {isLoading ? (
            <LoadingSkeleton rows={4} />
          ) : (
            <DataTable
              columns={columns}
              data={data ?? []}
              searchPlaceholder="Search users, roles, colleges..."
              emptyTitle="No users found"
              emptyMessage="Registered users will appear here."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function SystemStatsPage() {
  const { data, isLoading } = useStats();
  if (isLoading) return <LoadingSkeleton rows={4} />;

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Operations"
        title="System stats"
        description="Operational overview for the MVP."
      />
      <Card className="soft-shadow">
        <CardHeader>
          <CardTitle>Platform activity</CardTitle>
          <CardDescription>Snapshot of the current dataset and system usage.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(data ?? {}).filter(([key]) => key !== "usersByRole").map(([key, value]) => (
            <div key={key} className="rounded-xl border bg-muted/25 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-muted-foreground">{toTitle(key)}</div>
                  <div className="mt-1 text-3xl font-semibold tracking-tight">{String(value)}</div>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-xl border bg-background text-primary">
                  <Activity className="h-4 w-4" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
