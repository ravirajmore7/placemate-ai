"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  Code2,
  FileText,
  Gauge,
  GraduationCap,
  Lightbulb,
  ListChecks,
  Plus,
  UserRound
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Application, Drive, Paginated, Readiness, StudentProfile } from "@/lib/types";
import { formatCurrency, formatDate, toTitle } from "@/lib/utils";
import { ApplicationKanban } from "@/components/kanban";
import { ReadinessRing } from "@/components/readiness-ring";
import { SimpleBarChart, SimplePieChart } from "@/components/charts";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";

function useStudentProfile() {
  return useQuery({
    queryKey: ["student-profile"],
    queryFn: () => apiFetch<StudentProfile>("/students/me")
  });
}

function useReadiness() {
  return useQuery({
    queryKey: ["student-readiness"],
    queryFn: () => apiFetch<Readiness>("/students/me/readiness")
  });
}

function profileCompletion(profile?: StudentProfile) {
  if (!profile) return 0;
  const fields = [
    profile.phone,
    profile.collegeName,
    profile.branch,
    profile.year,
    profile.graduationYear,
    profile.cgpa,
    profile.location,
    profile.targetRole,
    profile.preferredLocation,
    profile.expectedSalary,
    profile.preferredCompanies?.length
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

function Field({ label, name, defaultValue, type = "text" }: { label: string; name: string; defaultValue?: string | number | null; type?: string }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue ?? ""} />
    </div>
  );
}

export function StudentDashboardPage() {
  const profileQuery = useStudentProfile();
  const readinessQuery = useReadiness();
  const applicationsQuery = useQuery({
    queryKey: ["student-applications"],
    queryFn: () => apiFetch<Application[]>("/applications/me")
  });

  const profile = profileQuery.data;
  const readiness = readinessQuery.data;
  const applications = applicationsQuery.data ?? [];
  const activeApps = applications.filter((item) => !["REJECTED", "WITHDRAWN", "SELECTED"].includes(item.status)).length;
  const skillDistribution = Object.entries(
    (profile?.skills ?? []).reduce<Record<string, number>>((acc, skill) => {
      acc[skill.category] = (acc[skill.category] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([category, count]) => ({ category, count }));
  const applicationsByStatus = Object.entries(
    applications.reduce<Record<string, number>>((acc, application) => {
      acc[toTitle(application.status)] = (acc[toTitle(application.status)] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([status, count]) => ({ status, count }));

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">Student dashboard</h2>
        <p className="text-muted-foreground">Your readiness, proof, applications, and next improvements.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Placement Readiness Score</CardTitle>
            <CardDescription>Rule-based score for Stage 1.</CardDescription>
          </CardHeader>
          <CardContent>
            <ReadinessRing score={readiness?.score ?? profile?.readinessScore ?? 0} level={readiness?.level ?? "Not Ready"} />
          </CardContent>
        </Card>
        <div className="grid gap-4 xl:col-span-3 md:grid-cols-2 xl:grid-cols-3">
          <StatCard title="Profile Completion" value={`${profileCompletion(profile)}%`} helper="Personal and career fields" icon={UserRound} />
          <StatCard title="Active Applications" value={activeApps} helper="In progress" icon={ListChecks} />
          <StatCard title="Upcoming Deadlines" value={applications.length} helper="Saved and applied drives" icon={CalendarClock} />
          <StatCard title="Coding Profiles" value={[profile?.githubUsername, profile?.leetcodeUsername, profile?.hackerrankUsername].filter(Boolean).length} helper="Linked usernames" icon={Code2} />
          <StatCard title="Projects" value={profile?.projects?.length ?? 0} helper="Proof of work" icon={BriefcaseBusiness} />
          <StatCard title="Resume" value={profile?.resumeUrl ? "Uploaded" : "Missing"} helper="Local/mock upload ready" icon={FileText} />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Readiness breakdown</CardTitle></CardHeader>
          <CardContent>
            <SimpleBarChart
              data={Object.entries(readiness?.breakdown ?? {}).map(([area, score]) => ({ area: toTitle(area), score }))}
              xKey="area"
              yKey="score"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Applications by status</CardTitle></CardHeader>
          <CardContent>
            <SimplePieChart data={applicationsByStatus} nameKey="status" valueKey="count" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Skill distribution</CardTitle></CardHeader>
          <CardContent>
            <SimplePieChart data={skillDistribution} nameKey="category" valueKey="count" />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Suggested improvements</CardTitle>
          <CardDescription>Highest-impact changes based on Stage 1 scoring.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {(readiness?.suggestions ?? ["Complete your profile to unlock suggestions."]).map((suggestion) => (
            <div key={suggestion} className="flex items-start gap-3 rounded-md border bg-muted/30 p-3 text-sm">
              <Lightbulb className="mt-0.5 h-4 w-4 text-primary" />
              {suggestion}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function StudentProfilePage() {
  const queryClient = useQueryClient();
  const profileQuery = useStudentProfile();
  const profile = profileQuery.data;
  const updateProfile = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiFetch<StudentProfile>("/students/me", { method: "PUT", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-profile"] });
      queryClient.invalidateQueries({ queryKey: ["student-readiness"] });
      toast({ title: "Profile updated" });
    }
  });
  const addSkill = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiFetch("/students/me/skills", { method: "POST", body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["student-profile"] })
  });
  const addProject = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiFetch("/students/me/projects", { method: "POST", body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["student-profile"] })
  });
  const addEducation = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiFetch("/students/me/education", { method: "POST", body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["student-profile"] })
  });

  if (profileQuery.isLoading) return <p className="text-muted-foreground">Loading profile...</p>;

  function submitProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    updateProfile.mutate({
      phone: form.get("phone"),
      collegeName: form.get("collegeName"),
      branch: form.get("branch"),
      year: Number(form.get("year") || 0),
      graduationYear: Number(form.get("graduationYear") || 0),
      cgpa: Number(form.get("cgpa") || 0),
      activeBacklogs: Number(form.get("activeBacklogs") || 0),
      location: form.get("location"),
      targetRole: form.get("targetRole"),
      preferredCompanies: String(form.get("preferredCompanies") ?? "").split(",").map((item) => item.trim()).filter(Boolean),
      preferredLocation: form.get("preferredLocation"),
      expectedSalary: Number(form.get("expectedSalary") || 0),
      placementStatus: form.get("placementStatus")
    });
  }

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">My placement profile</h2>
        <p className="text-muted-foreground">Keep your academic, career, skill, project, and education proof current.</p>
      </div>
      <Tabs defaultValue="profile">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card>
            <CardHeader><CardTitle>Personal and career details</CardTitle></CardHeader>
            <CardContent>
              <form className="grid gap-4 md:grid-cols-2" onSubmit={submitProfile}>
                <Field label="Phone" name="phone" defaultValue={profile?.phone} />
                <Field label="College" name="collegeName" defaultValue={profile?.collegeName} />
                <Field label="Branch" name="branch" defaultValue={profile?.branch} />
                <Field label="Year" name="year" type="number" defaultValue={profile?.year} />
                <Field label="Graduation year" name="graduationYear" type="number" defaultValue={profile?.graduationYear} />
                <Field label="CGPA" name="cgpa" type="number" defaultValue={profile?.cgpa} />
                <Field label="Active backlogs" name="activeBacklogs" type="number" defaultValue={profile?.activeBacklogs} />
                <Field label="Location" name="location" defaultValue={profile?.location} />
                <Field label="Target role" name="targetRole" defaultValue={profile?.targetRole} />
                <Field label="Preferred companies comma separated" name="preferredCompanies" defaultValue={profile?.preferredCompanies?.join(", ")} />
                <Field label="Preferred location" name="preferredLocation" defaultValue={profile?.preferredLocation} />
                <Field label="Expected salary" name="expectedSalary" type="number" defaultValue={profile?.expectedSalary} />
                <div className="grid gap-2">
                  <Label>Placement status</Label>
                  <Select name="placementStatus" defaultValue={profile?.placementStatus ?? "PREPARING"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["NOT_STARTED", "PREPARING", "OPEN_TO_APPLY", "PLACED", "NOT_INTERESTED"].map((status) => (
                        <SelectItem key={status} value={status}>{toTitle(status)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Button disabled={updateProfile.isPending}>Save profile</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="skills">
          <Card>
            <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <form
                className="grid gap-3 md:grid-cols-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  addSkill.mutate({ name: form.get("name"), category: form.get("category"), level: Number(form.get("level") || 3) });
                  event.currentTarget.reset();
                }}
              >
                <Input name="name" placeholder="React" required />
                <Input name="category" placeholder="Framework" required />
                <Input name="level" type="number" min={1} max={5} defaultValue={3} />
                <Button><Plus className="mr-2 h-4 w-4" /> Add skill</Button>
              </form>
              <div className="grid gap-3 md:grid-cols-2">
                {profile?.skills?.map((skill) => (
                  <div key={skill.id} className="rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{skill.name}</span>
                      <Badge variant="secondary">{skill.category}</Badge>
                    </div>
                    <Progress className="mt-3" value={skill.level * 20} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="projects">
          <Card>
            <CardHeader><CardTitle>Projects</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <form
                className="grid gap-3 md:grid-cols-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  addProject.mutate({
                    title: form.get("title"),
                    description: form.get("description"),
                    techStack: String(form.get("techStack") ?? "").split(",").map((item) => item.trim()).filter(Boolean),
                    githubUrl: form.get("githubUrl") || undefined,
                    liveUrl: form.get("liveUrl") || undefined,
                    category: form.get("category")
                  });
                  event.currentTarget.reset();
                }}
              >
                <Input name="title" placeholder="Project title" required />
                <Input name="category" placeholder="Full Stack" />
                <Input name="techStack" placeholder="React, NestJS, PostgreSQL" required />
                <Input name="githubUrl" placeholder="https://github.com/..." />
                <Input name="liveUrl" placeholder="https://..." />
                <Input name="description" placeholder="Short description" required />
                <Button className="md:col-span-2"><Plus className="mr-2 h-4 w-4" /> Add project</Button>
              </form>
              <div className="grid gap-3 md:grid-cols-2">
                {profile?.projects?.map((project) => (
                  <div key={project.id} className="rounded-md border p-4">
                    <div className="font-medium">{project.title}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {project.techStack.map((tech) => <Badge key={tech} variant="outline">{tech}</Badge>)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="education">
          <Card>
            <CardHeader><CardTitle>Education</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <form
                className="grid gap-3 md:grid-cols-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  addEducation.mutate({
                    degree: form.get("degree"),
                    institute: form.get("institute"),
                    startYear: Number(form.get("startYear")),
                    endYear: Number(form.get("endYear") || 0),
                    score: form.get("score")
                  });
                  event.currentTarget.reset();
                }}
              >
                <Input name="degree" placeholder="B.Tech" required />
                <Input name="institute" placeholder="Institute" required />
                <Input name="startYear" type="number" placeholder="2023" required />
                <Input name="endYear" type="number" placeholder="2027" />
                <Input name="score" placeholder="8.2 CGPA" />
                <Button className="md:col-span-5"><Plus className="mr-2 h-4 w-4" /> Add education</Button>
              </form>
              {profile?.education?.map((item) => (
                <div key={item.id} className="rounded-md border p-3">
                  <div className="font-medium">{item.degree}</div>
                  <div className="text-sm text-muted-foreground">{item.institute} • {item.startYear}-{item.endYear ?? "Present"} • {item.score}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function ResumeUploadPage() {
  const queryClient = useQueryClient();
  const profileQuery = useStudentProfile();
  const mutation = useMutation({
    mutationFn: (resumeUrl: string) => apiFetch<Readiness>("/students/me/resume", { method: "POST", body: { resumeUrl } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-profile"] });
      queryClient.invalidateQueries({ queryKey: ["student-readiness"] });
      toast({ title: "Resume saved", description: "Stage 1 stores the resume URL/path placeholder." });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resume upload placeholder</CardTitle>
        <CardDescription>Use a local path or URL now. Cloud storage can replace this contract later.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="rounded-md border bg-muted/30 p-4 text-sm">Current: {profileQuery.data?.resumeUrl ?? "No resume added"}</div>
        <form
          className="grid gap-3 md:grid-cols-[1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            mutation.mutate(String(form.get("resumeUrl")));
          }}
        >
          <Input name="resumeUrl" placeholder="/uploads/my-resume.pdf or https://..." required />
          <Button disabled={mutation.isPending}>Save resume</Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function CodingProfilesPage() {
  const queryClient = useQueryClient();
  const profileQuery = useStudentProfile();
  const profile = profileQuery.data;
  const mutation = useMutation({
    mutationFn: (body: Record<string, string>) => apiFetch<Readiness>("/students/me/coding-profiles", { method: "POST", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-profile"] });
      queryClient.invalidateQueries({ queryKey: ["student-readiness"] });
      toast({ title: "Coding profiles updated" });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Coding profile connections</CardTitle>
        <CardDescription>Stage 1 stores usernames only. Never ask students for platform passwords.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 md:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            mutation.mutate({
              githubUsername: String(form.get("githubUsername") ?? ""),
              leetcodeUsername: String(form.get("leetcodeUsername") ?? ""),
              hackerrankUsername: String(form.get("hackerrankUsername") ?? "")
            });
          }}
        >
          <Field label="GitHub username" name="githubUsername" defaultValue={profile?.githubUsername} />
          <Field label="LeetCode username" name="leetcodeUsername" defaultValue={profile?.leetcodeUsername} />
          <Field label="HackerRank username" name="hackerrankUsername" defaultValue={profile?.hackerrankUsername} />
          <div className="md:col-span-3">
            <Button disabled={mutation.isPending}>Save usernames</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function DriveCard({ drive }: { drive: Drive }) {
  const queryClient = useQueryClient();
  const eligibilityQuery = useQuery({
    queryKey: ["drive-eligibility", drive.id],
    queryFn: () => apiFetch<{ status: string; reason: string }>(`/drives/${drive.id}/eligibility`)
  });
  const applyMutation = useMutation({
    mutationFn: () => apiFetch<Application>("/applications", { method: "POST", body: { driveId: drive.id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-applications"] });
      toast({ title: "Application submitted", description: `${drive.company.name} ${drive.role}` });
    },
    onError: (error) => toast({ title: "Could not apply", description: error instanceof Error ? error.message : "Try another drive.", variant: "destructive" })
  });
  const eligibility = eligibilityQuery.data;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{drive.company.name}</CardTitle>
            <CardDescription>{drive.role} • {drive.location}</CardDescription>
          </div>
          <Badge variant={drive.status === "OPEN" ? "success" : "secondary"}>{toTitle(drive.status)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <p className="text-sm text-muted-foreground">{drive.description}</p>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div>CTC: <span className="font-medium">{formatCurrency(drive.ctc)}</span></div>
          <div>Deadline: <span className="font-medium">{formatDate(drive.applicationDeadline)}</span></div>
          <div>Min CGPA: <span className="font-medium">{drive.minimumCgpa}</span></div>
          <div>Backlogs: <span className="font-medium">Max {drive.maxBacklogs}</span></div>
        </div>
        <div className="flex flex-wrap gap-2">{drive.requiredSkills.map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>)}</div>
        <div className="rounded-md border bg-muted/30 p-3 text-sm">
          <div className="font-medium">{eligibility ? toTitle(eligibility.status) : "Checking eligibility..."}</div>
          <p className="mt-1 text-muted-foreground">{eligibility?.reason}</p>
        </div>
        <Button
          disabled={applyMutation.isPending || eligibility?.status === "NOT_ELIGIBLE"}
          onClick={() => applyMutation.mutate()}
        >
          Apply to drive
        </Button>
      </CardContent>
    </Card>
  );
}

export function StudentDrivesPage() {
  const drivesQuery = useQuery({
    queryKey: ["drives"],
    queryFn: () => apiFetch<Paginated<Drive>>("/drives?limit=30")
  });

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">Company drives</h2>
        <p className="text-muted-foreground">Review eligibility and apply to open drives.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {(drivesQuery.data?.items ?? []).map((drive) => <DriveCard key={drive.id} drive={drive} />)}
      </div>
    </div>
  );
}

export function StudentApplicationsPage() {
  const applicationsQuery = useQuery({
    queryKey: ["student-applications"],
    queryFn: () => apiFetch<Application[]>("/applications/me")
  });
  const applications = applicationsQuery.data ?? [];

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">My applications</h2>
        <p className="text-muted-foreground">Track every drive from applied to selected or rejected.</p>
      </div>
      <ApplicationKanban applications={applications} />
    </div>
  );
}

export function StudentReadinessPage() {
  const readinessQuery = useReadiness();
  const readiness = readinessQuery.data;

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Readiness report</CardTitle>
          <CardDescription>Updated from your latest profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <ReadinessRing score={readiness?.score ?? 0} level={readiness?.level ?? "Not Ready"} />
        </CardContent>
      </Card>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Score breakdown</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {Object.entries(readiness?.breakdown ?? {}).map(([key, value]) => (
              <div key={key} className="grid gap-2">
                <div className="flex justify-between text-sm">
                  <span>{toTitle(key)}</span>
                  <span className="font-medium">{value}</span>
                </div>
                <Progress value={value} />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Improvement suggestions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {(readiness?.suggestions ?? []).map((suggestion) => (
              <div key={suggestion} className="flex items-start gap-3 rounded-md border p-3 text-sm">
                <BadgeCheck className="mt-0.5 h-4 w-4 text-primary" />
                {suggestion}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
