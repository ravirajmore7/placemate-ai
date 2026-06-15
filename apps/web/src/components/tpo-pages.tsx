"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Code2,
  FileText,
  Filter,
  Gauge,
  Github,
  ListChecks,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Application, Drive, Paginated, StudentProfile } from "@/lib/types";
import { formatCurrency, formatDate, toTitle } from "@/lib/utils";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { PageHeader } from "@/components/page-header";
import { SimpleBarChart, SimplePieChart } from "@/components/charts";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
    averageSkillProofScore: number;
    strongGithubStudents: number;
    strongLeetCodeStudents: number;
    weakResumeStudents: number;
    weakDsaStudents: number;
  };
  charts: {
    branchWiseStudents: Array<{ branch: string; students: number }>;
    driveWiseApplications: Array<{ drive: string; applications: number }>;
  };
};

export function TpoDashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["tpo-dashboard"], queryFn: () => apiFetch<TpoDashboard>("/tpo/dashboard") });
  const cards = data?.cards;

  if (isLoading) return <LoadingSkeleton rows={5} />;

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Placement office"
        title="TPO dashboard"
        description="Placement readiness, drives, applications, shortlists, and outcomes."
        actions={
          <>
            <Button variant="outline" asChild><Link href="/tpo/students">Manage students</Link></Button>
            <Button asChild><Link href="/tpo/drives/new">Create drive <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard title="Total Students" value={cards?.totalStudents ?? 0} icon={Users} />
        <StatCard title="Avg Readiness" value={cards?.averageReadinessScore ?? 0} icon={Gauge} />
        <StatCard title="Open Drives" value={cards?.openDrives ?? 0} icon={BriefcaseBusiness} />
        <StatCard title="Applications" value={cards?.totalApplications ?? 0} icon={ListChecks} />
        <StatCard title="Shortlisted" value={cards?.shortlistedStudents ?? 0} icon={BadgeCheck} />
        <StatCard title="Selected" value={cards?.selectedStudents ?? 0} icon={CheckCircle2} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Avg SkillProof" value={cards?.averageSkillProofScore ?? 0} helper="Stage 2 verified score" icon={Sparkles} />
        <StatCard title="Strong GitHub" value={cards?.strongGithubStudents ?? 0} helper="Score 75+" icon={Github} />
        <StatCard title="Strong LeetCode" value={cards?.strongLeetCodeStudents ?? 0} helper="Score 75+" icon={Code2} />
        <StatCard title="Weak Resume" value={cards?.weakResumeStudents ?? 0} helper="Resume score below 60" icon={FileText} />
        <StatCard title="Weak DSA" value={cards?.weakDsaStudents ?? 0} helper="Low proof signals" icon={Gauge} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="soft-shadow">
          <CardHeader><CardTitle>Branch-wise students</CardTitle></CardHeader>
          <CardContent>
            <SimpleBarChart data={data?.charts.branchWiseStudents ?? []} xKey="branch" yKey="students" />
          </CardContent>
        </Card>
        <Card className="soft-shadow">
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
  const { data, isLoading } = useQuery({
    queryKey: ["tpo-students", filters],
    queryFn: () => apiFetch<Paginated<StudentProfile>>(`/tpo/students?limit=50&${filters}`)
  });

  const columns: ColumnDef<StudentProfile>[] = [
    {
      accessorFn: (row) => `${row.user.name} ${row.user.email}`,
      header: "Student",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.user.name}</div>
          <div className="text-xs text-muted-foreground">{row.original.user.email}</div>
        </div>
      )
    },
    { accessorKey: "branch", header: "Branch" },
    { accessorKey: "cgpa", header: "CGPA" },
    { accessorKey: "activeBacklogs", header: "Backlogs" },
    {
      accessorKey: "readinessScore",
      header: "Readiness",
      cell: ({ row }) => (
        <div className="min-w-32">
          <div className="mb-1 text-xs font-medium">{row.original.readinessScore}/100</div>
          <Progress value={row.original.readinessScore} />
        </div>
      )
    },
    {
      accessorFn: (row) => row.skills.map((skill) => skill.name).join(" "),
      header: "Skills",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.skills.slice(0, 3).map((skill) => <Badge key={skill.id} variant="outline">{skill.name}</Badge>)}
        </div>
      )
    },
    { accessorKey: "placementStatus", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.placementStatus} /> }
  ];

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Student management"
        title="Manage students"
        description="Filter by branch, CGPA, skills, backlog, readiness, and placement status."
      />
      <Card className="soft-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Filter className="h-4 w-4" /> Advanced filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 md:grid-cols-7"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const params = new URLSearchParams();
              for (const key of ["branch", "minCgpa", "skills", "maxBacklogs", "minReadiness", "placementStatus"]) {
                const value = String(form.get(key) ?? "");
                if (value && value !== "all") params.set(key, value);
              }
              setFilters(params.toString());
            }}
          >
            <Input name="branch" placeholder="Branch" />
            <Input name="minCgpa" type="number" placeholder="Min CGPA" />
            <Input name="skills" placeholder="React, SQL" />
            <Input name="maxBacklogs" type="number" placeholder="Max backlogs" />
            <Input name="minReadiness" type="number" placeholder="Min score" />
            <Select name="placementStatus" defaultValue="all">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any status</SelectItem>
                {["NOT_STARTED", "PREPARING", "OPEN_TO_APPLY", "PLACED", "NOT_INTERESTED"].map((status) => (
                  <SelectItem key={status} value={status}>{toTitle(status)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button><Search className="mr-2 h-4 w-4" /> Apply</Button>
          </form>
        </CardContent>
      </Card>
      <Card className="soft-shadow">
        <CardContent className="pt-5">
          {isLoading ? (
            <LoadingSkeleton rows={4} />
          ) : (
            <DataTable
              columns={columns}
              data={data?.items ?? []}
              searchPlaceholder="Search students, emails, branches, or skills..."
              emptyTitle="No students found"
              emptyMessage="Try relaxing the filters or wait for students to register."
            />
          )}
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
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Company drive"
        title="Create company drive"
        description="Add company details, eligibility criteria, dates, role information, and required skills."
        badge="TPO only"
      />
      <Card className="soft-shadow">
        <CardHeader>
          <CardTitle>Drive details</CardTitle>
          <CardDescription>Fields marked by the browser as required must be completed before publishing.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-6"
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
            <div className="grid gap-4 md:grid-cols-2">
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
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea name="description" placeholder="Role description and hiring process" required />
              </div>
              <div className="grid gap-2">
                <Label>Company description</Label>
                <Textarea name="companyDescription" placeholder="Short company overview" />
              </div>
            </div>
            <Button className="w-full md:w-fit" disabled={mutation.isPending}>
              <Plus className="mr-2 h-4 w-4" />
              {mutation.isPending ? "Creating..." : "Create drive"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
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

function DriveManagementCard({ drive }: { drive: Drive }) {
  return (
    <Card className="soft-shadow overflow-hidden transition-all hover:-translate-y-1">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate">{drive.company.name}</CardTitle>
            <CardDescription>{drive.role}</CardDescription>
          </div>
          <StatusBadge status={drive.status} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm">
        <p className="line-clamp-3 leading-6 text-muted-foreground">{drive.description}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-primary" /> {formatDate(drive.applicationDeadline)}</div>
          <div className="flex items-center gap-2"><BriefcaseBusiness className="h-4 w-4 text-primary" /> {formatCurrency(drive.ctc)}</div>
          <div className="flex items-center gap-2"><ListChecks className="h-4 w-4 text-primary" /> {drive._count?.applications ?? 0} applications</div>
          <div className="flex items-center gap-2"><Gauge className="h-4 w-4 text-primary" /> CGPA {drive.minimumCgpa}+</div>
          <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> {drive.location}</div>
          <div className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-primary" /> Max {drive.maxBacklogs} backlogs</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{toTitle(drive.jobType)}</Badge>
          {drive.requiredSkills.map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>)}
        </div>
      </CardContent>
    </Card>
  );
}

export function ManageDrivesPage() {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [jobType, setJobType] = React.useState("all");
  const { data, isLoading } = useQuery({ queryKey: ["drives"], queryFn: () => apiFetch<Paginated<Drive>>("/drives?limit=50") });
  const drives = (data?.items ?? []).filter((drive) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [drive.company.name, drive.role, drive.location].some((value) => value.toLowerCase().includes(query));
    const matchesStatus = status === "all" || drive.status === status;
    const matchesJobType = jobType === "all" || drive.jobType === jobType;
    return matchesSearch && matchesStatus && matchesJobType;
  });

  if (isLoading) return <LoadingSkeleton rows={5} />;

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Drive operations"
        title="Manage drives"
        description="Review open, draft, closed, and completed company drives."
        actions={<Button asChild><Link href="/tpo/drives/new">Create drive <Plus className="ml-2 h-4 w-4" /></Link></Button>}
      />
      <Card className="soft-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><SlidersHorizontal className="h-4 w-4" /> Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search drives" className="pl-9" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {["DRAFT", "OPEN", "CLOSED", "COMPLETED"].map((item) => <SelectItem key={item} value={item}>{toTitle(item)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={jobType} onValueChange={setJobType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All job types</SelectItem>
              <SelectItem value="INTERNSHIP">Internship</SelectItem>
              <SelectItem value="FULL_TIME">Full-time</SelectItem>
              <SelectItem value="INTERNSHIP_PPO">Internship + PPO</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      {drives.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {drives.map((drive) => <DriveManagementCard key={drive.id} drive={drive} />)}
        </div>
      ) : (
        <EmptyState icon={BriefcaseBusiness} title="No drives available right now" message="Create a company drive or adjust filters to see matching records." />
      )}
    </div>
  );
}

export function TpoApplicationsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["all-applications"], queryFn: () => apiFetch<Paginated<Application>>("/applications?limit=100") });
  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiFetch<Application>(`/applications/${id}/status`, { method: "PUT", body: { status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-applications"] });
      toast({ title: "Application status updated" });
    }
  });
  const columns: ColumnDef<Application>[] = [
    {
      accessorFn: (row) => `${row.studentProfile?.user.name ?? ""} ${row.studentProfile?.user.email ?? ""}`,
      header: "Student",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.studentProfile?.user.name}</div>
          <div className="text-xs text-muted-foreground">{row.original.studentProfile?.user.email}</div>
        </div>
      )
    },
    { accessorFn: (row) => row.drive.company.name, header: "Company" },
    { accessorFn: (row) => row.drive.role, header: "Role" },
    { accessorKey: "eligibilityStatus", header: "Eligibility", cell: ({ row }) => <StatusBadge status={row.original.eligibilityStatus} /> },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Select defaultValue={row.original.status} onValueChange={(status) => mutation.mutate({ id: row.original.id, status })}>
          <SelectTrigger className="min-w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["SAVED", "APPLIED", "SHORTLISTED", "TEST_SCHEDULED", "TEST_COMPLETED", "INTERVIEW_SCHEDULED", "SELECTED", "REJECTED", "WITHDRAWN"].map((status) => (
              <SelectItem key={status} value={status}>{toTitle(status)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }
  ];

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Application pipeline" title="Applications" description="Review and update student application progress." />
      <Card className="soft-shadow">
        <CardContent className="pt-5">
          {isLoading ? (
            <LoadingSkeleton rows={4} />
          ) : (
            <DataTable
              columns={columns}
              data={data?.items ?? []}
              searchPlaceholder="Search students, companies, roles..."
              emptyTitle="No applications yet"
              emptyMessage="Applications will appear once students apply to drives."
            />
          )}
        </CardContent>
      </Card>
    </div>
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
      <PageHeader
        eyebrow="Shortlist builder"
        title="Eligible students"
        description="Select a drive to view eligible and partially ready candidates."
      />
      <Card className="soft-shadow">
        <CardHeader>
          <CardTitle>Select drive</CardTitle>
          <CardDescription>Eligibility is calculated from profile and drive criteria.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={driveId} onValueChange={setDriveId}>
            <SelectTrigger><SelectValue placeholder="Select drive" /></SelectTrigger>
            <SelectContent>
              {(drives.data?.items ?? []).map((drive) => (
                <SelectItem key={drive.id} value={drive.id}>{drive.company.name} - {drive.role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      {!driveId ? (
        <EmptyState icon={Gauge} title="Choose a drive to start" message="Eligible and partially ready students will appear after you select a company drive." />
      ) : eligible.isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : eligible.data?.students.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {eligible.data.students.map((student) => (
            <Card key={student.id} className="soft-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{student.user.name}</CardTitle>
                    <CardDescription>{student.branch} - CGPA {student.cgpa}</CardDescription>
                  </div>
                  <StatusBadge status={student.eligibility.status} />
                </div>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Readiness</span>
                    <span>{student.readinessScore}/100</span>
                  </div>
                  <Progress value={student.readinessScore} />
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{student.eligibility.reason}</p>
                <div className="flex flex-wrap gap-2">{student.skills.slice(0, 5).map((skill) => <Badge key={skill.id} variant="outline">{skill.name}</Badge>)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={Users} title="No students found for this drive" message="No eligible or partially ready students matched the selected drive criteria." />
      )}
    </div>
  );
}

export function TpoReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["tpo-reports"],
    queryFn: () => apiFetch<{
      applicationsByStatus: Array<{ status: string; count: number }>;
      readinessDistribution: Array<{ bucket: string; students: number }>;
      placementStatus: Array<{ status: string; students: number }>;
      drivePerformance: Array<{ drive: string; applications: number }>;
    }>("/tpo/reports")
  });

  if (isLoading) return <LoadingSkeleton rows={5} />;

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Analytics"
        title="Reports"
        description="Useful Stage 1 placement analytics for readiness, applications, status, and drive performance."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="soft-shadow">
          <CardHeader><CardTitle>Readiness distribution</CardTitle></CardHeader>
          <CardContent><SimpleBarChart data={data?.readinessDistribution ?? []} xKey="bucket" yKey="students" /></CardContent>
        </Card>
        <Card className="soft-shadow">
          <CardHeader><CardTitle>Applications by status</CardTitle></CardHeader>
          <CardContent><SimplePieChart data={(data?.applicationsByStatus ?? []).map((item) => ({ status: toTitle(item.status), count: item.count }))} nameKey="status" valueKey="count" /></CardContent>
        </Card>
        <Card className="soft-shadow">
          <CardHeader><CardTitle>Placement status</CardTitle></CardHeader>
          <CardContent><SimpleBarChart data={(data?.placementStatus ?? []).map((item) => ({ status: toTitle(item.status), students: item.students }))} xKey="status" yKey="students" /></CardContent>
        </Card>
        <Card className="soft-shadow">
          <CardHeader><CardTitle>Drive performance</CardTitle></CardHeader>
          <CardContent><SimpleBarChart data={data?.drivePerformance ?? []} xKey="drive" yKey="applications" /></CardContent>
        </Card>
      </div>
    </div>
  );
}
