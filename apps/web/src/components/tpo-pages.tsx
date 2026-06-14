"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  Filter,
  Gauge,
  ListChecks,
  Plus,
  Search,
  Users
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Application, Drive, Paginated, StudentProfile } from "@/lib/types";
import { formatCurrency, formatDate, toTitle } from "@/lib/utils";
import { DataTable } from "@/components/data-table";
import { SimpleBarChart, SimplePieChart } from "@/components/charts";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

type TpoDashboard = {
  cards: {
    totalStudents: number;
    totalDrives: number;
    openDrives: number;
    totalApplications: number;
    shortlistedStudents: number;
    selectedStudents: number;
    averageReadinessScore: number;
  };
  charts: {
    branchWiseStudents: Array<{ branch: string; students: number }>;
    driveWiseApplications: Array<{ drive: string; applications: number }>;
  };
};

export function TpoDashboardPage() {
  const { data } = useQuery({ queryKey: ["tpo-dashboard"], queryFn: () => apiFetch<TpoDashboard>("/tpo/dashboard") });
  const cards = data?.cards;

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">TPO dashboard</h2>
        <p className="text-muted-foreground">Placement readiness, drives, applications, and outcomes.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard title="Total Students" value={cards?.totalStudents ?? 0} icon={Users} />
        <StatCard title="Avg Readiness" value={cards?.averageReadinessScore ?? 0} icon={Gauge} />
        <StatCard title="Open Drives" value={cards?.openDrives ?? 0} icon={BriefcaseBusiness} />
        <StatCard title="Applications" value={cards?.totalApplications ?? 0} icon={ListChecks} />
        <StatCard title="Shortlisted" value={cards?.shortlistedStudents ?? 0} icon={BadgeCheck} />
        <StatCard title="Selected" value={cards?.selectedStudents ?? 0} icon={CheckCircle2} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Branch-wise students</CardTitle></CardHeader>
          <CardContent>
            <SimpleBarChart data={data?.charts.branchWiseStudents ?? []} xKey="branch" yKey="students" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Drive-wise applications</CardTitle></CardHeader>
          <CardContent>
            <SimpleBarChart data={data?.charts.driveWiseApplications ?? []} xKey="drive" yKey="applications" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function ManageStudentsPage() {
  const [filters, setFilters] = React.useState("");
  const { data } = useQuery({
    queryKey: ["tpo-students", filters],
    queryFn: () => apiFetch<Paginated<StudentProfile>>(`/tpo/students?limit=50&${filters}`)
  });

  const columns: ColumnDef<StudentProfile>[] = [
    { header: "Student", cell: ({ row }) => <div><div className="font-medium">{row.original.user.name}</div><div className="text-xs text-muted-foreground">{row.original.user.email}</div></div> },
    { accessorKey: "branch", header: "Branch" },
    { accessorKey: "cgpa", header: "CGPA" },
    { accessorKey: "activeBacklogs", header: "Backlogs" },
    { header: "Readiness", cell: ({ row }) => <div className="min-w-32"><div className="mb-1 text-xs">{row.original.readinessScore}/100</div><Progress value={row.original.readinessScore} /></div> },
    { header: "Skills", cell: ({ row }) => <div className="flex flex-wrap gap-1">{row.original.skills.slice(0, 3).map((skill) => <Badge key={skill.id} variant="outline">{skill.name}</Badge>)}</div> },
    { header: "Status", cell: ({ row }) => <Badge variant="secondary">{toTitle(row.original.placementStatus)}</Badge> }
  ];

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">Manage students</h2>
        <p className="text-muted-foreground">Filter by branch, CGPA, skills, backlog, readiness, and placement status.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Filter className="h-4 w-4" /> Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 md:grid-cols-6"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const params = new URLSearchParams();
              for (const key of ["branch", "minCgpa", "skills", "maxBacklogs", "minReadiness", "placementStatus"]) {
                const value = String(form.get(key) ?? "");
                if (value) params.set(key, value);
              }
              setFilters(params.toString());
            }}
          >
            <Input name="branch" placeholder="Branch" />
            <Input name="minCgpa" type="number" placeholder="Min CGPA" />
            <Input name="skills" placeholder="React, SQL" />
            <Input name="maxBacklogs" type="number" placeholder="Max backlogs" />
            <Input name="minReadiness" type="number" placeholder="Min score" />
            <Button><Search className="mr-2 h-4 w-4" /> Apply</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-5">
          <DataTable columns={columns} data={data?.items ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}

export function CreateDrivePage() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiFetch<Drive>("/drives", { method: "POST", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drives"] });
      toast({ title: "Drive created", description: "Students can now view eligibility." });
    },
    onError: (error) => toast({ title: "Could not create drive", description: error instanceof Error ? error.message : "Check fields.", variant: "destructive" })
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create company drive</CardTitle>
        <CardDescription>Add eligibility criteria, dates, role information, and required skills.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            mutation.mutate({
              companyName: form.get("companyName"),
              companyWebsite: form.get("companyWebsite") || undefined,
              industry: form.get("industry") || undefined,
              companyDescription: form.get("companyDescription") || undefined,
              role: form.get("role"),
              description: form.get("description"),
              ctc: Number(form.get("ctc") || 0),
              stipend: Number(form.get("stipend") || 0),
              location: form.get("location"),
              jobType: form.get("jobType"),
              eligibleBranches: String(form.get("eligibleBranches") ?? "").split(",").map((item) => item.trim()).filter(Boolean),
              minimumCgpa: Number(form.get("minimumCgpa") || 0),
              maxBacklogs: Number(form.get("maxBacklogs") || 0),
              requiredSkills: String(form.get("requiredSkills") ?? "").split(",").map((item) => item.trim()).filter(Boolean),
              applicationDeadline: form.get("applicationDeadline"),
              testDate: form.get("testDate") || undefined,
              interviewDate: form.get("interviewDate") || undefined,
              status: form.get("status")
            });
          }}
        >
          <TextField name="companyName" label="Company name" placeholder="TCS" />
          <TextField name="companyWebsite" label="Website" placeholder="https://www.tcs.com" />
          <TextField name="industry" label="Industry" placeholder="IT Services" />
          <TextField name="role" label="Role" placeholder="TCS Ninja" />
          <TextField name="ctc" label="CTC" type="number" placeholder="360000" />
          <TextField name="stipend" label="Stipend" type="number" placeholder="80000" />
          <TextField name="location" label="Location" placeholder="Pan India" />
          <div className="grid gap-2">
            <Label>Job type</Label>
            <Select name="jobType" defaultValue="FULL_TIME">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="INTERNSHIP">Internship</SelectItem>
                <SelectItem value="FULL_TIME">Full-time</SelectItem>
                <SelectItem value="INTERNSHIP_PPO">Internship + PPO</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <TextField name="eligibleBranches" label="Eligible branches" placeholder="CSE, IT, ECE" />
          <TextField name="requiredSkills" label="Required skills" placeholder="Java, SQL, React" />
          <TextField name="minimumCgpa" label="Minimum CGPA" type="number" placeholder="7" />
          <TextField name="maxBacklogs" label="Max backlogs" type="number" placeholder="0" />
          <TextField name="applicationDeadline" label="Application deadline" type="date" />
          <TextField name="testDate" label="Test date" type="date" />
          <TextField name="interviewDate" label="Interview date" type="date" />
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select name="status" defaultValue="OPEN">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["DRAFT", "OPEN", "CLOSED", "COMPLETED"].map((status) => <SelectItem key={status} value={status}>{toTitle(status)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label>Description</Label>
            <Input name="description" placeholder="Role description and process" required />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label>Company description</Label>
            <Input name="companyDescription" placeholder="Short company overview" />
          </div>
          <Button className="md:col-span-2" disabled={mutation.isPending}><Plus className="mr-2 h-4 w-4" /> Create drive</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function TextField({ label, name, type = "text", placeholder }: { label: string; name: string; type?: string; placeholder?: string }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} placeholder={placeholder} required={["companyName", "role", "location", "applicationDeadline"].includes(name)} />
    </div>
  );
}

export function ManageDrivesPage() {
  const { data } = useQuery({ queryKey: ["drives"], queryFn: () => apiFetch<Paginated<Drive>>("/drives?limit=50") });

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">Manage drives</h2>
        <p className="text-muted-foreground">Review open and upcoming company drives.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {(data?.items ?? []).map((drive) => (
          <Card key={drive.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{drive.company.name}</CardTitle>
                  <CardDescription>{drive.role}</CardDescription>
                </div>
                <Badge variant={drive.status === "OPEN" ? "success" : "secondary"}>{toTitle(drive.status)}</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <p className="text-muted-foreground">{drive.description}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>Deadline: {formatDate(drive.applicationDeadline)}</div>
                <div>CTC: {formatCurrency(drive.ctc)}</div>
                <div>Applications: {drive._count?.applications ?? 0}</div>
                <div>Min CGPA: {drive.minimumCgpa}</div>
              </div>
              <div className="flex flex-wrap gap-2">{drive.requiredSkills.map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>)}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function TpoApplicationsPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["all-applications"], queryFn: () => apiFetch<Paginated<Application>>("/applications?limit=100") });
  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiFetch<Application>(`/applications/${id}/status`, { method: "PUT", body: { status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-applications"] });
      toast({ title: "Application status updated" });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>View applications</CardTitle>
        <CardDescription>Update student application progress.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {(data?.items ?? []).map((application) => (
          <div key={application.id} className="grid gap-3 rounded-md border p-4 lg:grid-cols-[1fr_220px] lg:items-center">
            <div>
              <div className="font-medium">{application.studentProfile?.user.name} • {application.drive.company.name}</div>
              <div className="text-sm text-muted-foreground">{application.drive.role} • {application.eligibilityReason}</div>
            </div>
            <Select defaultValue={application.status} onValueChange={(status) => mutation.mutate({ id: application.id, status })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["SAVED", "APPLIED", "SHORTLISTED", "TEST_SCHEDULED", "TEST_COMPLETED", "INTERVIEW_SCHEDULED", "SELECTED", "REJECTED", "WITHDRAWN"].map((status) => (
                  <SelectItem key={status} value={status}>{toTitle(status)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function EligibleStudentsPage() {
  const [driveId, setDriveId] = React.useState("");
  const drives = useQuery({ queryKey: ["drives"], queryFn: () => apiFetch<Paginated<Drive>>("/drives?limit=50") });
  const eligible = useQuery({
    queryKey: ["eligible-students", driveId],
    enabled: Boolean(driveId),
    queryFn: () => apiFetch<{ drive: Drive; students: Array<StudentProfile & { eligibility: { status: string; reason: string } }> }>(`/tpo/drives/${driveId}/eligible-students`)
  });

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Eligible students shortlist</CardTitle>
          <CardDescription>Select a drive to view eligible and partially ready candidates.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={driveId} onValueChange={setDriveId}>
            <SelectTrigger><SelectValue placeholder="Select drive" /></SelectTrigger>
            <SelectContent>
              {(drives.data?.items ?? []).map((drive) => (
                <SelectItem key={drive.id} value={drive.id}>{drive.company.name} • {drive.role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {(eligible.data?.students ?? []).map((student) => (
          <Card key={student.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{student.user.name}</CardTitle>
                  <CardDescription>{student.branch} • CGPA {student.cgpa}</CardDescription>
                </div>
                <Badge variant={student.eligibility.status === "ELIGIBLE" ? "success" : "warning"}>{toTitle(student.eligibility.status)}</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Progress value={student.readinessScore} />
              <p className="text-sm text-muted-foreground">{student.eligibility.reason}</p>
              <div className="flex flex-wrap gap-2">{student.skills.slice(0, 5).map((skill) => <Badge key={skill.id} variant="outline">{skill.name}</Badge>)}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function TpoReportsPage() {
  const { data } = useQuery({
    queryKey: ["tpo-reports"],
    queryFn: () => apiFetch<{
      applicationsByStatus: Array<{ status: string; count: number }>;
      readinessDistribution: Array<{ bucket: string; students: number }>;
      placementStatus: Array<{ status: string; students: number }>;
      drivePerformance: Array<{ drive: string; applications: number }>;
    }>("/tpo/reports")
  });

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">Reports</h2>
        <p className="text-muted-foreground">Useful Stage 1 placement analytics.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Readiness distribution</CardTitle></CardHeader>
          <CardContent><SimpleBarChart data={data?.readinessDistribution ?? []} xKey="bucket" yKey="students" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Applications by status</CardTitle></CardHeader>
          <CardContent><SimplePieChart data={(data?.applicationsByStatus ?? []).map((item) => ({ status: toTitle(item.status), count: item.count }))} nameKey="status" valueKey="count" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Placement status</CardTitle></CardHeader>
          <CardContent><SimpleBarChart data={(data?.placementStatus ?? []).map((item) => ({ status: toTitle(item.status), students: item.students }))} xKey="status" yKey="students" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Drive performance</CardTitle></CardHeader>
          <CardContent><SimpleBarChart data={data?.drivePerformance ?? []} xKey="drive" yKey="applications" /></CardContent>
        </Card>
      </div>
    </div>
  );
}
