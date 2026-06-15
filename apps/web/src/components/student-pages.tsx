"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Code2,
  FileText,
  Gauge,
  Github,
  GraduationCap,
  Lightbulb,
  ListChecks,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Target,
  UploadCloud,
  UserRound
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Application, Drive, JobMatchResult, Paginated, Readiness, SkillProofScore, StudentProfile } from "@/lib/types";
import { formatCurrency, formatDate, toTitle } from "@/lib/utils";
import { ApplicationKanban } from "@/components/kanban";
import { EmptyState } from "@/components/empty-state";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { PageHeader } from "@/components/page-header";
import { ReadinessRing } from "@/components/readiness-ring";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";

type Eligibility = { status: string; reason: string };

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

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue ?? ""} placeholder={placeholder} />
    </div>
  );
}

function SuggestionList({ suggestions }: { suggestions: string[] }) {
  if (!suggestions.length) {
    return (
      <EmptyState
        icon={Lightbulb}
        title="No suggestions yet"
        message="Complete your placement profile to unlock personalized improvement suggestions."
        className="min-h-44"
      />
    );
  }

  return (
    <div className="grid gap-3">
      {suggestions.map((suggestion) => (
        <div key={suggestion} className="flex items-start gap-3 rounded-xl border bg-muted/25 p-3 text-sm">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span className="leading-6">{suggestion}</span>
        </div>
      ))}
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
  const skillProofQuery = useQuery({
    queryKey: ["skillproof"],
    queryFn: () => apiFetch<SkillProofScore>("/skillproof/me")
  });

  const profile = profileQuery.data;
  const readiness = readinessQuery.data;
  const applications = applicationsQuery.data ?? [];
  const activeApps = applications.filter((item) => !["REJECTED", "WITHDRAWN", "SELECTED"].includes(item.status)).length;
  const completion = profileCompletion(profile);
  const linkedProfiles = [profile?.githubUsername, profile?.leetcodeUsername, profile?.hackerrankUsername].filter(Boolean).length;
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

  if (profileQuery.isLoading && readinessQuery.isLoading) return <LoadingSkeleton rows={5} />;

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Student workspace"
        title="Placement dashboard"
        description="Your readiness, proof, applications, and next improvements in one place."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/student/profile">Update profile</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/student/skillproof">SkillProof AI</Link>
            </Button>
            <Button asChild>
              <Link href="/student/drives">Explore drives <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="soft-shadow xl:col-span-2">
          <CardHeader>
            <CardTitle>Placement Readiness Score</CardTitle>
            <CardDescription>Live score from your latest Stage 1 profile data.</CardDescription>
          </CardHeader>
          <CardContent>
            <ReadinessRing score={readiness?.score ?? profile?.readinessScore ?? 0} level={readiness?.level ?? "Not Ready"} />
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 xl:col-span-3 xl:grid-cols-3">
          <StatCard title="SkillProof Score" value={skillProofQuery.data?.overallScore ?? 0} helper={skillProofQuery.data?.level ?? "Stage 2"} icon={Sparkles} />
          <StatCard title="Profile Completion" value={`${completion}%`} helper="Academic and career fields" icon={UserRound} />
          <StatCard title="Active Applications" value={activeApps} helper="In progress" icon={ListChecks} />
          <StatCard title="Upcoming Deadlines" value={applications.length} helper="Saved and applied drives" icon={CalendarClock} />
          <StatCard title="Coding Profiles" value={linkedProfiles} helper="GitHub, LeetCode, HackerRank" icon={Code2} />
          <StatCard title="Projects" value={profile?.projects?.length ?? 0} helper="Proof of work" icon={BriefcaseBusiness} />
          <StatCard title="Resume Status" value={profile?.resumeUrl ? "Uploaded" : "Missing"} helper="Resume proof" icon={FileText} />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="soft-shadow">
          <CardHeader><CardTitle>Readiness breakdown</CardTitle></CardHeader>
          <CardContent>
            <SimpleBarChart
              data={Object.entries(readiness?.breakdown ?? {}).map(([area, score]) => ({ area: toTitle(area), score }))}
              xKey="area"
              yKey="score"
            />
          </CardContent>
        </Card>
        <Card className="soft-shadow">
          <CardHeader><CardTitle>Applications by status</CardTitle></CardHeader>
          <CardContent>
            <SimplePieChart data={applicationsByStatus} nameKey="status" valueKey="count" />
          </CardContent>
        </Card>
        <Card className="soft-shadow">
          <CardHeader><CardTitle>Skill distribution</CardTitle></CardHeader>
          <CardContent>
            <SimplePieChart data={skillDistribution} nameKey="category" valueKey="count" />
          </CardContent>
        </Card>
      </div>
      <Card className="soft-shadow">
        <CardHeader>
          <CardTitle>Suggested improvements</CardTitle>
          <CardDescription>Highest-impact changes based on Stage 1 scoring.</CardDescription>
        </CardHeader>
        <CardContent>
          <SuggestionList suggestions={readiness?.suggestions ?? []} />
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
      toast({ title: "Profile updated", description: "Your readiness score will refresh automatically." });
    }
  });
  const addSkill = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiFetch("/students/me/skills", { method: "POST", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-profile"] });
      toast({ title: "Skill added" });
    }
  });
  const addProject = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiFetch("/students/me/projects", { method: "POST", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-profile"] });
      toast({ title: "Project added" });
    }
  });
  const addEducation = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiFetch("/students/me/education", { method: "POST", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-profile"] });
      toast({ title: "Education added" });
    }
  });

  if (profileQuery.isLoading) return <LoadingSkeleton rows={6} />;

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
      <PageHeader
        eyebrow="SkillProof profile"
        title="My placement profile"
        description="Keep your academic, career, skill, project, and education proof current."
        badge={`${profileCompletion(profile)}% complete`}
      />
      <Tabs defaultValue="profile" className="grid gap-4">
        <TabsList className="h-auto flex-wrap justify-start rounded-xl bg-muted/60 p-1">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card className="soft-shadow">
            <CardHeader>
              <CardTitle>Personal and career details</CardTitle>
              <CardDescription>These details drive profile completion and company eligibility.</CardDescription>
            </CardHeader>
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
                <Field label="Preferred companies" name="preferredCompanies" defaultValue={profile?.preferredCompanies?.join(", ")} placeholder="TCS, Amazon, Infosys" />
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
                  <Button disabled={updateProfile.isPending}>{updateProfile.isPending ? "Saving..." : "Save profile"}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="skills">
          <Card className="soft-shadow">
            <CardHeader>
              <CardTitle>Skills</CardTitle>
              <CardDescription>Add technologies, categories, and confidence levels.</CardDescription>
            </CardHeader>
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
                <Button disabled={addSkill.isPending}><Plus className="mr-2 h-4 w-4" /> Add skill</Button>
              </form>
              {profile?.skills?.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {profile.skills.map((skill) => (
                    <div key={skill.id} className="rounded-xl border bg-background/60 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium">{skill.name}</span>
                        <Badge variant="secondary">{skill.category}</Badge>
                      </div>
                      <Progress className="mt-3" value={skill.level * 20} />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Code2} title="No skills added yet" message="Add your strongest technical skills so companies can match you faster." />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="projects">
          <Card className="soft-shadow">
            <CardHeader>
              <CardTitle>Projects</CardTitle>
              <CardDescription>Show real proof of work with technologies and links.</CardDescription>
            </CardHeader>
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
                <Button className="md:col-span-2" disabled={addProject.isPending}><Plus className="mr-2 h-4 w-4" /> Add project</Button>
              </form>
              {profile?.projects?.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {profile.projects.map((project) => (
                    <div key={project.id} className="rounded-xl border bg-background/60 p-4">
                      <div className="font-medium">{project.title}</div>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{project.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {project.techStack.map((tech) => <Badge key={tech} variant="outline">{tech}</Badge>)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={BriefcaseBusiness} title="No projects added yet" message="Add projects to strengthen your SkillProof profile and readiness score." />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="education">
          <Card className="soft-shadow">
            <CardHeader>
              <CardTitle>Education</CardTitle>
              <CardDescription>Record degrees, institutes, years, and scores.</CardDescription>
            </CardHeader>
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
                <Button className="md:col-span-5" disabled={addEducation.isPending}><Plus className="mr-2 h-4 w-4" /> Add education</Button>
              </form>
              {profile?.education?.length ? (
                <div className="grid gap-3">
                  {profile.education.map((item) => (
                    <div key={item.id} className="rounded-xl border bg-background/60 p-4">
                      <div className="font-medium">{item.degree}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.institute} - {item.startYear}-{item.endYear ?? "Present"} - {item.score}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={GraduationCap} title="No education history yet" message="Add your academic records so eligibility checks can work accurately." />
              )}
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
      toast({ title: "Resume saved", description: "Stage 1 stores the resume URL or path placeholder." });
    }
  });

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Resume proof"
        title="Resume upload"
        description="Store a resume URL or local path for Stage 1. Cloud upload can replace the storage layer later."
      />
      <Card className="soft-shadow">
        <CardHeader>
          <CardTitle>Resume source</CardTitle>
          <CardDescription>Use a local path or URL now. The API contract remains unchanged.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {profileQuery.data?.resumeUrl ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/25 p-4 text-sm">
              <div>
                <p className="font-medium">Current resume</p>
                <p className="break-all text-muted-foreground">{profileQuery.data.resumeUrl}</p>
              </div>
              <StatusBadge status="COMPLETED" label="Uploaded" />
            </div>
          ) : (
            <EmptyState icon={UploadCloud} title="No resume uploaded" message="Add a resume path or URL to improve your readiness score." className="min-h-44" />
          )}
          <form
            className="grid gap-3 md:grid-cols-[1fr_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              mutation.mutate(String(form.get("resumeUrl")));
            }}
          >
            <Input name="resumeUrl" placeholder="/uploads/my-resume.pdf or https://..." required />
            <Button disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Save resume"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
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
    <div className="grid gap-6">
      <PageHeader
        eyebrow="SkillProof links"
        title="Coding profile connections"
        description="Stage 1 stores usernames only. Never share platform passwords."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["GitHub", profile?.githubUsername],
          ["LeetCode", profile?.leetcodeUsername],
          ["HackerRank", profile?.hackerrankUsername]
        ].map(([platform, username]) => (
          <Card key={platform} className="soft-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">{platform}</CardTitle>
              {platform === "GitHub" ? <Github className="h-4 w-4 text-primary" /> : <Code2 className="h-4 w-4 text-primary" />}
            </CardHeader>
            <CardContent>
              {username ? (
                <div>
                  <p className="font-mono text-sm">{username}</p>
                  <StatusBadge status="COMPLETED" label="Connected" className="mt-2" />
                </div>
              ) : (
                <StatusBadge status="NOT_STARTED" label="Not connected" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="soft-shadow">
        <CardHeader>
          <CardTitle>Update usernames</CardTitle>
          <CardDescription>These usernames contribute to your coding proof profile.</CardDescription>
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
              <Button disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Save usernames"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function DriveCard({ drive, eligibility, match }: { drive: Drive; eligibility?: Eligibility; match?: JobMatchResult }) {
  const queryClient = useQueryClient();
  const applyMutation = useMutation({
    mutationFn: () => apiFetch<Application>("/applications", { method: "POST", body: { driveId: drive.id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-applications"] });
      toast({ title: "Application submitted", description: `${drive.company.name} ${drive.role}` });
    },
    onError: (error) => toast({ title: "Could not apply", description: error instanceof Error ? error.message : "Try another drive.", variant: "destructive" })
  });
  const eligibilityStatus = eligibility?.status ?? "CHECKING";

  return (
    <Card className="soft-shadow overflow-hidden transition-all hover:-translate-y-1">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border bg-muted/40 text-base font-semibold text-primary">
              {drive.company.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate">{drive.company.name}</CardTitle>
              <CardDescription className="mt-1">{drive.role}</CardDescription>
            </div>
          </div>
          <StatusBadge status={drive.status} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{drive.description}</p>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2"><BriefcaseBusiness className="h-4 w-4 text-primary" /> {formatCurrency(drive.ctc)}</div>
          <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> {drive.location}</div>
          <div className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-primary" /> {formatDate(drive.applicationDeadline)}</div>
          <div className="flex items-center gap-2"><Gauge className="h-4 w-4 text-primary" /> CGPA {drive.minimumCgpa}+ / Max {drive.maxBacklogs} backlogs</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{toTitle(drive.jobType)}</Badge>
          {drive.requiredSkills.map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>)}
        </div>
        <div className="rounded-xl border bg-muted/25 p-3 text-sm">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="font-medium">Eligibility</span>
            <StatusBadge status={eligibilityStatus} label={eligibility ? toTitle(eligibility.status) : "Checking"} />
          </div>
          <p className="leading-6 text-muted-foreground">{eligibility?.reason ?? "Checking your profile against this drive."}</p>
        </div>
        <div className="rounded-xl border bg-muted/25 p-3 text-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 font-medium"><Target className="h-4 w-4 text-primary" /> Company fit</span>
            <span className="font-semibold">{match?.matchScore ?? 0}%</span>
          </div>
          <Progress value={match?.matchScore ?? 0} />
          <div className="mt-3 flex flex-wrap gap-2">
            {(match?.missingSkillsJson ?? []).slice(0, 3).map((skill) => <Badge key={skill} variant="warning">Missing {skill}</Badge>)}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" asChild>
            <Link href="/student/company-fit">View fit</Link>
          </Button>
          <Button variant="outline" className="flex-1" asChild>
            <Link href={`/student/roadmap?driveId=${drive.id}`}>Roadmap</Link>
          </Button>
        </div>
        <Button
          disabled={applyMutation.isPending || eligibility?.status === "NOT_ELIGIBLE"}
          onClick={() => applyMutation.mutate()}
        >
          {applyMutation.isPending ? "Applying..." : "Apply to drive"}
        </Button>
      </CardContent>
    </Card>
  );
}

export function StudentDrivesPage() {
  const [search, setSearch] = React.useState("");
  const [jobType, setJobType] = React.useState("all");
  const [eligibility, setEligibility] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("deadline-asc");
  const drivesQuery = useQuery({
    queryKey: ["drives"],
    queryFn: () => apiFetch<Paginated<Drive>>("/drives?limit=30")
  });
  const drives = drivesQuery.data?.items ?? [];
  const baseFilteredDrives = drives
    .filter((drive) => {
      const query = search.trim().toLowerCase();
      const matchesSearch = !query || [drive.company.name, drive.role, drive.location].some((value) => value.toLowerCase().includes(query));
      const matchesJobType = jobType === "all" || drive.jobType === jobType;
      const matchesStatus = status === "all" || drive.status === status;
      return matchesSearch && matchesJobType && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "deadline-desc") return new Date(b.applicationDeadline).getTime() - new Date(a.applicationDeadline).getTime();
      if (sortBy === "ctc-desc") return (b.ctc ?? 0) - (a.ctc ?? 0);
      return new Date(a.applicationDeadline).getTime() - new Date(b.applicationDeadline).getTime();
    });
  const backgroundDrives = baseFilteredDrives.slice(0, 12);
  const eligibilityQueries = useQueries({
    queries: backgroundDrives.map((drive) => ({
      queryKey: ["drive-eligibility", drive.id],
      queryFn: () => apiFetch<Eligibility>(`/drives/${drive.id}/eligibility`)
    }))
  });
  const eligibilityByDrive = backgroundDrives.reduce<Record<string, Eligibility | undefined>>((acc, drive, index) => {
    acc[drive.id] = eligibilityQueries[index]?.data;
    return acc;
  }, {});
  const matchQueries = useQueries({
    queries: backgroundDrives.map((drive) => ({
      queryKey: ["drive-match", drive.id],
      queryFn: () => apiFetch<JobMatchResult>(`/matches/drive/${drive.id}/me`)
    }))
  });
  const matchByDrive = backgroundDrives.reduce<Record<string, JobMatchResult | undefined>>((acc, drive, index) => {
    acc[drive.id] = matchQueries[index]?.data;
    return acc;
  }, {});
  const filteredDrives = baseFilteredDrives.filter((drive) => eligibility === "all" || eligibilityByDrive[drive.id]?.status === eligibility);
  const visibleDrives = filteredDrives.slice(0, 12);

  if (drivesQuery.isLoading) return <LoadingSkeleton rows={5} />;

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Company drives"
        title="Explore open placement drives"
        description="Review eligibility, deadlines, required skills, and application fit before applying."
      />
      <Card className="soft-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><SlidersHorizontal className="h-4 w-4" /> Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by company, role, or location" className="pl-9" />
          </div>
          <Select value={jobType} onValueChange={setJobType}>
            <SelectTrigger><SelectValue placeholder="Job type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All job types</SelectItem>
              <SelectItem value="INTERNSHIP">Internship</SelectItem>
              <SelectItem value="FULL_TIME">Full-time</SelectItem>
              <SelectItem value="INTERNSHIP_PPO">Internship + PPO</SelectItem>
            </SelectContent>
          </Select>
          <Select value={eligibility} onValueChange={setEligibility}>
            <SelectTrigger><SelectValue placeholder="Eligibility" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All eligibility</SelectItem>
              <SelectItem value="ELIGIBLE">Eligible</SelectItem>
              <SelectItem value="PARTIALLY_READY">Partially Ready</SelectItem>
              <SelectItem value="NOT_ELIGIBLE">Not Eligible</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger><SelectValue placeholder="Sort" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="deadline-asc">Deadline soonest</SelectItem>
              <SelectItem value="deadline-desc">Deadline latest</SelectItem>
              <SelectItem value="ctc-desc">Highest CTC</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      {filteredDrives.length > visibleDrives.length ? (
        <p className="text-sm text-muted-foreground">
          Showing the first {visibleDrives.length} matching drives. Use filters to narrow a larger result set.
        </p>
      ) : null}
      {visibleDrives.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {visibleDrives.map((drive) => <DriveCard key={drive.id} drive={drive} eligibility={eligibilityByDrive[drive.id]} match={matchByDrive[drive.id]} />)}
        </div>
      ) : (
        <EmptyState
          icon={BriefcaseBusiness}
          title="No drives available right now"
          message="Try adjusting filters, or check back when your TPO publishes new company drives."
        />
      )}
    </div>
  );
}

export function StudentApplicationsPage() {
  const applicationsQuery = useQuery({
    queryKey: ["student-applications"],
    queryFn: () => apiFetch<Application[]>("/applications/me")
  });
  const applications = applicationsQuery.data ?? [];

  if (applicationsQuery.isLoading) return <LoadingSkeleton rows={4} />;

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Application tracker"
        title="My applications"
        description="Track every drive from saved and applied through interview, selection, or rejection."
        actions={
          <Button asChild>
            <Link href="/student/drives">Explore drives <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        }
      />
      {applications.length ? (
        <ApplicationKanban applications={applications} />
      ) : (
        <EmptyState
          icon={ListChecks}
          title="No applications yet"
          message="Start applying to open drives and track your placement journey here."
          action={<Button asChild><Link href="/student/drives">Explore Drives</Link></Button>}
        />
      )}
    </div>
  );
}

export function StudentReadinessPage() {
  const readinessQuery = useReadiness();
  const profileQuery = useStudentProfile();
  const readiness = readinessQuery.data;
  const profile = profileQuery.data;
  const checklist = [
    { label: "Core profile details", done: profileCompletion(profile) >= 80 },
    { label: "Resume uploaded", done: Boolean(profile?.resumeUrl) },
    { label: "At least three skills", done: (profile?.skills?.length ?? 0) >= 3 },
    { label: "Project proof added", done: (profile?.projects?.length ?? 0) > 0 },
    { label: "Coding profiles linked", done: [profile?.githubUsername, profile?.leetcodeUsername, profile?.hackerrankUsername].filter(Boolean).length > 0 }
  ];

  if (readinessQuery.isLoading) return <LoadingSkeleton rows={5} />;

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Readiness report"
        title="Placement Readiness Score"
        description="A clear view of your current placement readiness level, score breakdown, and next actions."
      />
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Card className="soft-shadow">
          <CardHeader>
            <CardTitle>Overall score</CardTitle>
            <CardDescription>Updated from your latest profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <ReadinessRing score={readiness?.score ?? 0} level={readiness?.level ?? "Not Ready"} />
          </CardContent>
        </Card>
        <div className="grid gap-6">
          <Card className="soft-shadow">
            <CardHeader>
              <CardTitle>Score breakdown</CardTitle>
              <CardDescription>Color-coded progress by readiness area.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {Object.entries(readiness?.breakdown ?? {}).map(([key, value]) => (
                <div key={key} className="rounded-xl border bg-background/60 p-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium">{toTitle(key)}</span>
                    <span className="font-semibold">{value}/100</span>
                  </div>
                  <Progress value={value} />
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="soft-shadow">
              <CardHeader>
                <CardTitle>Profile completion checklist</CardTitle>
                <CardDescription>Complete these items to strengthen your readiness profile.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {checklist.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl border bg-muted/25 p-3 text-sm">
                    <div className="flex items-center gap-3">
                      {item.done ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <BadgeCheck className="h-4 w-4 text-muted-foreground" />}
                      <span>{item.label}</span>
                    </div>
                    <StatusBadge status={item.done ? "COMPLETED" : "NOT_STARTED"} label={item.done ? "Done" : "Pending"} />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="soft-shadow">
              <CardHeader>
                <CardTitle>Improvement suggestions</CardTitle>
                <CardDescription>Personalized next steps from the Stage 1 scoring model.</CardDescription>
              </CardHeader>
              <CardContent>
                <SuggestionList suggestions={readiness?.suggestions ?? []} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
