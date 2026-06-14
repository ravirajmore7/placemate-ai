"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Building2, BriefcaseBusiness, ListChecks, Shield, Users } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { User } from "@/lib/types";
import { toTitle } from "@/lib/utils";
import { DataTable } from "@/components/data-table";
import { SimpleBarChart } from "@/components/charts";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
  const { data } = useStats();
  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">Platform overview</h2>
        <p className="text-muted-foreground">Basic Stage 1 SaaS usage metrics.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Users" value={data?.totalUsers ?? 0} icon={Users} />
        <StatCard title="Students" value={data?.totalStudents ?? 0} icon={Users} />
        <StatCard title="TPO Admins" value={data?.totalTpoAdmins ?? 0} icon={Shield} />
        <StatCard title="Drives" value={data?.totalDrives ?? 0} icon={BriefcaseBusiness} />
        <StatCard title="Applications" value={data?.totalApplications ?? 0} icon={ListChecks} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Users by role</CardTitle>
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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>Colleges list placeholder</CardTitle>
            <CardDescription>Reserved for Stage 2 college onboarding, plans, and tenant-level controls.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm text-muted-foreground">
        <p>Nexus Institute of Technology</p>
        <p>Demo College of Engineering</p>
        <p>Future fields: domain verification, TPO seats, subscription status, drive limits, and analytics scope.</p>
      </CardContent>
    </Card>
  );
}

export function UsersListPage() {
  const { data } = useQuery({ queryKey: ["admin-users"], queryFn: () => apiFetch<AdminUser[]>("/admin/users") });
  const columns: ColumnDef<AdminUser>[] = [
    { header: "Name", accessorKey: "name" },
    { header: "Email", accessorKey: "email" },
    { header: "Role", cell: ({ row }) => <Badge variant="secondary">{toTitle(row.original.role)}</Badge> },
    { header: "College", cell: ({ row }) => row.original.studentProfile?.collegeName ?? "Not applicable" },
    { header: "Readiness", cell: ({ row }) => row.original.studentProfile?.readinessScore ?? "-" }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users list</CardTitle>
        <CardDescription>Basic user management view for Stage 1.</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={data ?? []} />
      </CardContent>
    </Card>
  );
}

export function SystemStatsPage() {
  const { data } = useStats();
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>System stats</CardTitle>
          <CardDescription>Operational overview for the MVP.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {Object.entries(data ?? {}).filter(([key]) => key !== "usersByRole").map(([key, value]) => (
            <div key={key} className="rounded-md border bg-muted/30 p-4">
              <div className="text-sm text-muted-foreground">{toTitle(key)}</div>
              <div className="text-2xl font-semibold">{String(value)}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
