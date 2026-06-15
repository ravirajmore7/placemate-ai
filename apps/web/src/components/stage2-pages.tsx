"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  Code2,
  FileSearch,
  Github,
  GraduationCap,
  Lightbulb,
  ListChecks,
  Medal,
  RefreshCw,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
  UploadCloud,
  Users
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import type {
  Drive,
  GitHubProfile,
  HackerRankProfile,
  JobStatus,
  JobMatchResult,
  LeetCodeProfile,
  Paginated,
  ResumeAnalysis,
  SkillProofScore,
  SkillVerification,
  StudentRoadmap
} from "@/lib/types";
import { formatDate, toTitle } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { PageHeader } from "@/components/page-header";
import { ReadinessRing } from "@/components/readiness-ring";
import { SimpleBarChart } from "@/components/charts";
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

function list(value?: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function ScoreCard({
  title,
  score,
  helper,
  icon: Icon
}: {
  title: string;
  score: number;
  helper?: string;
  icon: React.ElementType;
}) {
  return (
    <Card className="soft-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {helper ? <CardDescription>{helper}</CardDescription> : null}
        </div>
        <Icon className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="mb-2 flex items-end justify-between">
          <span className="text-3xl font-semibold tracking-tight">{score}</span>
          <span className="text-sm text-muted-foreground">/100</span>
        </div>
        <Progress value={score} />
      </CardContent>
    </Card>
  );
}

function Suggestions({ items }: { items?: unknown }) {
  const suggestions = list(items);
  if (!suggestions.length) {
    return <EmptyState icon={Lightbulb} title="No suggestions yet" message="Sync or analyze more proof to unlock recommendations." className="min-h-40" />;
  }
  return (
    <div className="grid gap-3">
      {suggestions.map((item) => (
        <div key={item} className="flex items-start gap-3 rounded-xl border bg-muted/25 p-3 text-sm">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span className="leading-6">{item}</span>
        </div>
      ))}
    </div>
  );
}

function ConsentNotice() {
  return (
    <div className="rounded-xl border bg-muted/25 p-3 text-sm leading-6 text-muted-foreground">
      By syncing this profile, you allow PlaceMate AI to analyze publicly available coding activity for placement readiness insights. Never enter external platform passwords.
    </div>
  );
}

export function StudentSkillProofPage() {
  const queryClient = useQueryClient();
  const score = useQuery({ queryKey: ["skillproof"], queryFn: () => apiFetch<SkillProofScore>("/skillproof/me") });
  const verification = useQuery({ queryKey: ["skill-verification"], queryFn: () => apiFetch<SkillVerification[]>("/skillproof/verification") });
  const calculate = useMutation({
    mutationFn: () => apiFetch<SkillProofScore>("/skillproof/calculate", { method: "POST", body: {} }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skillproof"] });
      toast({ title: "SkillProof score recalculated" });
    }
  });
  const current = score.data;
  const strong = (verification.data ?? []).filter((item) => item.confidenceScore >= 75);
  const weak = (verification.data ?? []).filter((item) => item.confidenceScore < 55);
  const breakdown = [
    ["Readiness", current?.placementReadinessScore ?? 0],
    ["Resume", current?.resumeScore ?? 0],
    ["GitHub", current?.githubScore ?? 0],
    ["LeetCode", current?.leetcodeScore ?? 0],
    ["HackerRank", current?.hackerRankScore ?? 0],
    ["Projects", current?.projectScore ?? 0],
    ["Verification", current?.skillVerificationScore ?? 0]
  ].map(([area, value]) => ({ area, score: Number(value) }));

  if (score.isLoading) return <LoadingSkeleton rows={5} />;

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Stage 2 intelligence"
        title="SkillProof AI dashboard"
        description="Verified skill intelligence from readiness, resume, coding platforms, projects, and company fit."
        actions={<Button onClick={() => calculate.mutate()} disabled={calculate.isPending}><RefreshCw className="mr-2 h-4 w-4" /> Recalculate</Button>}
      />
      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <Card className="soft-shadow">
          <CardHeader>
            <CardTitle>Overall SkillProof Score</CardTitle>
            <CardDescription>{current?.level ?? "Not calculated"}</CardDescription>
          </CardHeader>
          <CardContent>
            <ReadinessRing score={current?.overallScore ?? 0} level={current?.level ?? "Beginner"} />
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ScoreCard title="Resume" score={current?.resumeScore ?? 0} icon={FileSearch} />
          <ScoreCard title="GitHub" score={current?.githubScore ?? 0} icon={Github} />
          <ScoreCard title="LeetCode" score={current?.leetcodeScore ?? 0} icon={Code2} />
          <ScoreCard title="HackerRank" score={current?.hackerRankScore ?? 0} icon={Medal} />
          <ScoreCard title="Projects" score={current?.projectScore ?? 0} icon={BriefcaseBusiness} />
          <ScoreCard title="Verification" score={current?.skillVerificationScore ?? 0} icon={ShieldCheck} />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="soft-shadow lg:col-span-2">
          <CardHeader><CardTitle>Score breakdown</CardTitle></CardHeader>
          <CardContent><SimpleBarChart data={breakdown} xKey="area" yKey="score" /></CardContent>
        </Card>
        <Card className="soft-shadow">
          <CardHeader><CardTitle>Recommended next actions</CardTitle></CardHeader>
          <CardContent><Suggestions items={current?.suggestionsJson} /></CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="soft-shadow">
          <CardHeader><CardTitle>Strong skills</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {strong.length ? strong.slice(0, 12).map((item) => <Badge key={item.id} variant="success">{item.skillName}</Badge>) : <span className="text-sm text-muted-foreground">No strong proof yet.</span>}
          </CardContent>
        </Card>
        <Card className="soft-shadow">
          <CardHeader><CardTitle>Weak skills</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {weak.length ? weak.slice(0, 12).map((item) => <Badge key={item.id} variant="warning">{item.skillName}</Badge>) : <span className="text-sm text-muted-foreground">No weak proof found.</span>}
          </CardContent>
        </Card>
        <Card className="soft-shadow">
          <CardHeader><CardTitle>Roadmap CTA</CardTitle><CardDescription>Close gaps with a time-boxed plan.</CardDescription></CardHeader>
          <CardContent><Button asChild className="w-full"><Link href="/student/roadmap">Generate roadmap <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></CardContent>
        </Card>
      </div>
    </div>
  );
}

export function GitHubAnalysisPage() {
  const queryClient = useQueryClient();
  const profile = useQuery({ queryKey: ["github-analysis"], queryFn: () => apiFetch<GitHubProfile | null>("/integrations/github/me") });
  const sync = useMutation({
    mutationFn: (username: string) => apiFetch<GitHubProfile>("/integrations/github/sync", { method: "POST", body: { username, consentAccepted: true } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["github-analysis"] });
      toast({ title: "GitHub profile synced" });
    }
  });
  const data = profile.data;

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="GitHub intelligence" title="GitHub profile analysis" description="Repository quality, recent activity, language diversity, README quality, and deployment proof." />
      <Card className="soft-shadow">
        <CardHeader><CardTitle>Sync public GitHub profile</CardTitle><CardDescription>No password required. Public username analysis only.</CardDescription></CardHeader>
        <CardContent className="grid gap-4">
          <ConsentNotice />
          <form className="grid gap-3 md:grid-cols-[1fr_auto]" onSubmit={(event) => {
            event.preventDefault();
            sync.mutate(String(new FormData(event.currentTarget).get("username") ?? ""));
          }}>
            <Input name="username" placeholder="github username" defaultValue={data?.username ?? ""} required />
            <Button disabled={sync.isPending}><RefreshCw className="mr-2 h-4 w-4" /> {sync.isPending ? "Syncing..." : "Sync GitHub Profile"}</Button>
          </form>
        </CardContent>
      </Card>
      {profile.isLoading ? <LoadingSkeleton rows={5} /> : data ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <ScoreCard title="GitHub Score" score={data.githubScore} icon={Github} />
            <StatCard title="Repositories" value={data.publicRepos} icon={BriefcaseBusiness} />
            <StatCard title="Followers" value={data.followers} icon={Users} />
            <StatCard title="Last Sync" value={data.lastSyncedAt ? formatDate(data.lastSyncedAt) : "Never"} icon={RefreshCw} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="soft-shadow"><CardHeader><CardTitle>Strengths</CardTitle></CardHeader><CardContent><Suggestions items={data.strengthsJson} /></CardContent></Card>
            <Card className="soft-shadow"><CardHeader><CardTitle>Suggestions</CardTitle></CardHeader><CardContent><Suggestions items={data.suggestionsJson} /></CardContent></Card>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {(data.repositories ?? []).map((repo) => (
              <Card key={repo.id} className="soft-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>{repo.name}</CardTitle>
                      <CardDescription>{repo.description ?? "No description"}</CardDescription>
                    </div>
                    <Badge variant={repo.qualityScore >= 75 ? "success" : "secondary"}>{repo.qualityScore}/100</Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm">
                  <div className="flex flex-wrap gap-2">
                    {repo.primaryLanguage ? <Badge variant="outline">{repo.primaryLanguage}</Badge> : null}
                    <Badge variant={repo.hasReadme ? "success" : "warning"}>{repo.hasReadme ? "README" : "No README"}</Badge>
                    <Badge variant={repo.hasLiveDemo ? "success" : "secondary"}>{repo.hasLiveDemo ? "Live demo" : "No demo"}</Badge>
                  </div>
                  <div className="text-muted-foreground">Stars {repo.stars} - Forks {repo.forks} - Issues {repo.openIssues}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : <EmptyState icon={Github} title="No GitHub profile synced" message="Sync a public GitHub username to analyze repository proof." />}
    </div>
  );
}

export function LeetCodeAnalysisPage() {
  const queryClient = useQueryClient();
  const profile = useQuery({ queryKey: ["leetcode-analysis"], queryFn: () => apiFetch<LeetCodeProfile | null>("/integrations/leetcode/me") });
  const sync = useMutation({
    mutationFn: (username: string) => apiFetch<LeetCodeProfile>("/integrations/leetcode/sync", { method: "POST", body: { username, consentAccepted: true } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leetcode-analysis"] });
      toast({ title: "LeetCode profile synced" });
    }
  });
  const manual = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiFetch<LeetCodeProfile>("/integrations/leetcode/manual", { method: "POST", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leetcode-analysis"] });
      toast({ title: "Manual LeetCode stats saved" });
    }
  });
  const data = profile.data;

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="DSA intelligence" title="LeetCode analysis" description="Problem mix, topic coverage, contest signal, and DSA readiness." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="soft-shadow">
          <CardHeader><CardTitle>Sync public profile</CardTitle><CardDescription>Uses public profile where available, with safe fallback data.</CardDescription></CardHeader>
          <CardContent className="grid gap-4">
            <ConsentNotice />
            <form className="grid gap-3 md:grid-cols-[1fr_auto]" onSubmit={(event) => {
              event.preventDefault();
              sync.mutate(String(new FormData(event.currentTarget).get("username") ?? ""));
            }}>
              <Input name="username" placeholder="leetcode username" defaultValue={data?.username ?? ""} required />
              <Button disabled={sync.isPending}>Sync</Button>
            </form>
          </CardContent>
        </Card>
        <Card className="soft-shadow">
          <CardHeader><CardTitle>Manual fallback</CardTitle><CardDescription>Use this when public data is unavailable.</CardDescription></CardHeader>
          <CardContent>
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              manual.mutate({
                username: form.get("username"),
                totalSolved: Number(form.get("totalSolved") || 0),
                easySolved: Number(form.get("easySolved") || 0),
                mediumSolved: Number(form.get("mediumSolved") || 0),
                hardSolved: Number(form.get("hardSolved") || 0),
                contestRating: Number(form.get("contestRating") || 0)
              });
            }}>
              <Input name="username" placeholder="username" defaultValue={data?.username ?? ""} required />
              <Input name="totalSolved" type="number" placeholder="Total solved" />
              <Input name="easySolved" type="number" placeholder="Easy" />
              <Input name="mediumSolved" type="number" placeholder="Medium" />
              <Input name="hardSolved" type="number" placeholder="Hard" />
              <Input name="contestRating" type="number" placeholder="Contest rating" />
              <Button className="sm:col-span-2" disabled={manual.isPending}>Save manual stats</Button>
            </form>
          </CardContent>
        </Card>
      </div>
      {profile.isLoading ? <LoadingSkeleton rows={4} /> : data ? (
        <>
          <div className="grid gap-4 md:grid-cols-5">
            <ScoreCard title="DSA Score" score={data.leetcodeScore} icon={Code2} />
            <StatCard title="Total Solved" value={data.totalSolved} icon={ListChecks} />
            <StatCard title="Easy" value={data.easySolved} icon={CheckCircle2} />
            <StatCard title="Medium" value={data.mediumSolved} icon={Target} />
            <StatCard title="Hard" value={data.hardSolved} icon={BrainCircuit} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="soft-shadow"><CardHeader><CardTitle>Topic strengths</CardTitle></CardHeader><CardContent><SimpleBarChart data={Object.entries(data.topicStatsJson ?? {}).map(([topic, score]) => ({ topic, score }))} xKey="topic" yKey="score" /></CardContent></Card>
            <Card className="soft-shadow"><CardHeader><CardTitle>Suggestions</CardTitle></CardHeader><CardContent><Suggestions items={data.suggestionsJson} /></CardContent></Card>
          </div>
        </>
      ) : <EmptyState icon={Code2} title="No LeetCode stats yet" message="Sync a username or enter manual stats to calculate DSA readiness." />}
    </div>
  );
}

export function HackerRankAnalysisPage() {
  const queryClient = useQueryClient();
  const profile = useQuery({ queryKey: ["hackerrank-analysis"], queryFn: () => apiFetch<HackerRankProfile | null>("/integrations/hackerrank/me") });
  const manual = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiFetch<HackerRankProfile>("/integrations/hackerrank/manual", { method: "POST", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hackerrank-analysis"] });
      toast({ title: "HackerRank stats saved" });
    }
  });
  const data = profile.data;

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Assessment proof" title="HackerRank analysis" description="Manual and sync-ready HackerRank proof for SQL, language, certifications, and test scores." />
      <Card className="soft-shadow">
        <CardHeader><CardTitle>Manual stats entry</CardTitle><CardDescription>HackerRank public data is limited, so Stage 2 supports manual/TPO proof.</CardDescription></CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-3" onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            manual.mutate({
              username: form.get("username"),
              profileUrl: form.get("profileUrl"),
              problemSolvingScore: Number(form.get("problemSolvingScore") || 0),
              pythonScore: Number(form.get("pythonScore") || 0),
              javaScore: Number(form.get("javaScore") || 0),
              sqlScore: Number(form.get("sqlScore") || 0),
              certifications: String(form.get("certifications") ?? "").split(",").map((item) => item.trim()).filter(Boolean)
            });
          }}>
            <Input name="username" placeholder="username" defaultValue={data?.username ?? ""} required />
            <Input name="profileUrl" placeholder="profile URL" defaultValue={data?.profileUrl ?? ""} />
            <Input name="problemSolvingScore" type="number" placeholder="Problem solving" />
            <Input name="pythonScore" type="number" placeholder="Python" />
            <Input name="javaScore" type="number" placeholder="Java" />
            <Input name="sqlScore" type="number" placeholder="SQL" />
            <Input name="certifications" placeholder="SQL Basic, Python Basic" className="md:col-span-2" />
            <Button disabled={manual.isPending}>Save HackerRank data</Button>
          </form>
        </CardContent>
      </Card>
      {profile.isLoading ? <LoadingSkeleton rows={4} /> : data ? (
        <>
          <div className="grid gap-4 md:grid-cols-5">
            <ScoreCard title="HackerRank Score" score={data.hackerRankScore} icon={Medal} />
            <StatCard title="Problem Solving" value={data.problemSolvingScore} icon={BrainCircuit} />
            <StatCard title="Python" value={data.pythonScore} icon={Code2} />
            <StatCard title="Java" value={data.javaScore} icon={Code2} />
            <StatCard title="SQL" value={data.sqlScore} icon={BarChart3} />
          </div>
          <Card className="soft-shadow"><CardHeader><CardTitle>Suggestions</CardTitle></CardHeader><CardContent><Suggestions items={data.suggestionsJson} /></CardContent></Card>
        </>
      ) : <EmptyState icon={Medal} title="No HackerRank proof yet" message="Add manual stats or upload TPO proof to strengthen assessment signals." />}
    </div>
  );
}

export function ResumeAnalysisPage() {
  const queryClient = useQueryClient();
  const [jobId, setJobId] = React.useState("");
  const resume = useQuery({ queryKey: ["resume-analysis"], queryFn: () => apiFetch<ResumeAnalysis | null>("/ai/resume/latest") });
  const job = useQuery({
    queryKey: ["job", jobId],
    enabled: Boolean(jobId),
    queryFn: () => apiFetch<JobStatus>(`/jobs/${jobId}`),
    refetchInterval: jobId ? 1000 : false
  });
  const analyze = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiFetch<JobStatus>("/ai/resume/analyze", { method: "POST", body }),
    onSuccess: (queuedJob) => {
      setJobId(queuedJob.id);
      toast({ title: "Resume analysis queued", description: "You can keep using the dashboard while analysis runs." });
    }
  });

  React.useEffect(() => {
    if (job.data?.status === "completed") {
      queryClient.invalidateQueries({ queryKey: ["resume-analysis"] });
      queryClient.invalidateQueries({ queryKey: ["skillproof"] });
      toast({ title: "Resume analyzed", description: "Latest scores are ready." });
      setJobId("");
    }
    if (job.data?.status === "failed") {
      toast({ title: "Resume analysis failed", description: job.data.errorMessage ?? "Please try again.", variant: "destructive" });
      setJobId("");
    }
  }, [job.data?.errorMessage, job.data?.status, queryClient]);

  const data = resume.data;
  const jobStatus = job.data;
  const isAnalyzing = analyze.isPending || Boolean(jobId);

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="AI resume analyzer" title="Resume analysis" description="Extract skills, detect missing sections, score ATS readability, and generate resume improvements." />
      <Card className="soft-shadow">
        <CardHeader><CardTitle>Analyze resume text</CardTitle><CardDescription>Paste resume text or provide a resume URL/path for stored proof.</CardDescription></CardHeader>
        <CardContent>
          <form className="grid gap-3" onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            analyze.mutate({ resumeUrl: form.get("resumeUrl"), resumeText: form.get("resumeText") });
          }}>
            <Input name="resumeUrl" placeholder="/uploads/resume.pdf or https://..." defaultValue={data?.resumeUrl ?? ""} />
            <Textarea name="resumeText" placeholder="Paste resume text here for analysis" rows={8} />
            <Button className="w-fit" disabled={isAnalyzing}><UploadCloud className="mr-2 h-4 w-4" /> {isAnalyzing ? "Analyzing..." : "Analyze Resume"}</Button>
          </form>
          {jobStatus ? (
            <div className="mt-4 rounded-xl border bg-muted/25 p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">Resume analysis {toTitle(jobStatus.status)}</span>
                <span className="font-semibold">{jobStatus.progress}%</span>
              </div>
              <Progress value={jobStatus.progress} />
            </div>
          ) : null}
        </CardContent>
      </Card>
      {resume.isLoading ? <LoadingSkeleton rows={5} /> : data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ScoreCard title="Resume Score" score={data.resumeScore} icon={FileSearch} />
            <ScoreCard title="ATS Score" score={data.atsScore} icon={BookOpenCheck} />
            <ScoreCard title="Project Quality" score={data.projectsScore} icon={BriefcaseBusiness} />
            <ScoreCard title="Impact" score={data.impactScore * 10} icon={Sparkles} />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="soft-shadow"><CardHeader><CardTitle>Detected skills</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{list(data.detectedSkillsJson).map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>)}</CardContent></Card>
            <Card className="soft-shadow"><CardHeader><CardTitle>Missing sections</CardTitle></CardHeader><CardContent><Suggestions items={data.missingSectionsJson} /></CardContent></Card>
            <Card className="soft-shadow"><CardHeader><CardTitle>Improvement checklist</CardTitle></CardHeader><CardContent><Suggestions items={data.suggestionsJson} /></CardContent></Card>
          </div>
        </>
      ) : <EmptyState icon={UploadCloud} title="Upload your resume to get AI-powered analysis." message="Paste resume text or save a resume path to detect skills and missing proof." />}
    </div>
  );
}

export function CompanyFitPage() {
  const drives = useQuery({ queryKey: ["drives"], queryFn: () => apiFetch<Paginated<Drive>>("/drives?limit=50") });
  const [driveId, setDriveId] = React.useState("");
  const match = useQuery({
    queryKey: ["company-fit", driveId],
    enabled: Boolean(driveId),
    queryFn: () => apiFetch<JobMatchResult>(`/matches/drive/${driveId}/me`)
  });
  const drive = (drives.data?.items ?? []).find((item) => item.id === driveId);

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Company-wise fit" title="Company fit score" description="Compare resume, skills, projects, coding profile strength, eligibility, and proof quality against a drive." />
      <Card className="soft-shadow">
        <CardHeader><CardTitle>Select target drive</CardTitle></CardHeader>
        <CardContent>
          <Select value={driveId} onValueChange={setDriveId}>
            <SelectTrigger><SelectValue placeholder="Select a company drive" /></SelectTrigger>
            <SelectContent>
              {(drives.data?.items ?? []).map((item) => <SelectItem key={item.id} value={item.id}>{item.company.name} - {item.role}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      {!driveId ? <EmptyState icon={Target} title="Choose a drive to calculate fit" message="Matched skills, missing skills, and reasons will appear here." /> : match.isLoading ? <LoadingSkeleton rows={4} /> : match.data ? (
        <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
          <Card className="soft-shadow">
            <CardHeader><CardTitle>{drive?.company.name} {drive?.role}</CardTitle><CardDescription>Company Fit Score</CardDescription></CardHeader>
            <CardContent><ReadinessRing score={match.data.matchScore} level={match.data.matchScore >= 80 ? "Strong Fit" : match.data.matchScore >= 60 ? "Good Fit" : "Needs Work"} /></CardContent>
          </Card>
          <div className="grid gap-4">
            <Card className="soft-shadow"><CardHeader><CardTitle>Matched skills</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{list(match.data.matchedSkillsJson).map((skill) => <Badge key={skill} variant="success">{skill}</Badge>)}</CardContent></Card>
            <Card className="soft-shadow"><CardHeader><CardTitle>Missing and weak skills</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{[...list(match.data.missingSkillsJson), ...list(match.data.weakSkillsJson)].map((skill) => <Badge key={skill} variant="warning">{skill}</Badge>)}</CardContent></Card>
            <Card className="soft-shadow"><CardHeader><CardTitle>Recommended improvements</CardTitle></CardHeader><CardContent><Suggestions items={match.data.suggestionsJson} /></CardContent></Card>
            <Button asChild className="w-fit"><Link href={`/student/roadmap?driveId=${driveId}`}>Generate roadmap <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function RoadmapPage() {
  const queryClient = useQueryClient();
  const drives = useQuery({ queryKey: ["drives"], queryFn: () => apiFetch<Paginated<Drive>>("/drives?limit=50") });
  const roadmaps = useQuery({ queryKey: ["roadmaps"], queryFn: () => apiFetch<StudentRoadmap[]>("/roadmaps/me") });
  const [selectedDriveId, setSelectedDriveId] = React.useState("");
  const [durationDays, setDurationDays] = React.useState(30);
  const generate = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiFetch<StudentRoadmap>("/roadmaps/generate", { method: "POST", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roadmaps"] });
      toast({ title: "Roadmap generated" });
    }
  });
  const complete = useMutation({
    mutationFn: (id: string) => apiFetch(`/roadmaps/tasks/${id}/complete`, { method: "PUT", body: { completed: true } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roadmaps"] })
  });

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Personalized roadmap" title="Improvement roadmap" description="Generate 7, 15, 30, or 60 day plans for company-specific preparation." />
      <Card className="soft-shadow">
        <CardHeader><CardTitle>Generate roadmap</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-[1.5fr_1fr_1.5fr_auto]" onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            generate.mutate({ driveId: selectedDriveId || undefined, durationDays, goal: form.get("goal") });
          }}>
            <Select value={selectedDriveId} onValueChange={setSelectedDriveId}>
              <SelectTrigger><SelectValue placeholder="Optional target drive" /></SelectTrigger>
              <SelectContent>{(drives.data?.items ?? []).map((drive) => <SelectItem key={drive.id} value={drive.id}>{drive.company.name} - {drive.role}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={String(durationDays)} onValueChange={(value) => setDurationDays(Number(value))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{[7, 15, 30, 60].map((days) => <SelectItem key={days} value={String(days)}>{days} days</SelectItem>)}</SelectContent>
            </Select>
            <Input name="goal" placeholder="Goal, e.g. Amazon SDE Intern" />
            <Button disabled={generate.isPending}>Generate</Button>
          </form>
        </CardContent>
      </Card>
      {roadmaps.isLoading ? <LoadingSkeleton rows={5} /> : (roadmaps.data ?? []).length ? (
        <div className="grid gap-4">
          {(roadmaps.data ?? []).map((roadmap) => {
            const done = roadmap.tasks.filter((task) => task.completed).length;
            const progress = Math.round((done / Math.max(roadmap.tasks.length, 1)) * 100);
            return (
              <Card key={roadmap.id} className="soft-shadow">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><CardTitle>{roadmap.title}</CardTitle><CardDescription>{roadmap.goal}</CardDescription></div>
                    <Badge variant="secondary">{progress}% complete</Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <Progress value={progress} />
                  <div className="grid gap-3 md:grid-cols-2">
                    {roadmap.tasks.slice(0, 10).map((task) => (
                      <div key={task.id} className="flex items-start justify-between gap-3 rounded-xl border bg-muted/25 p-3">
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <p className="text-sm text-muted-foreground">{task.category} - {task.priority} - {task.dueDate ? formatDate(task.dueDate) : "No due date"}</p>
                        </div>
                        <Button variant={task.completed ? "outline" : "default"} size="sm" disabled={task.completed || complete.isPending} onClick={() => complete.mutate(task.id)}>
                          {task.completed ? "Done" : "Complete"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : <EmptyState icon={Route} title="No roadmap yet" message="Generate a company-wise roadmap to start closing skill gaps." />}
    </div>
  );
}

export function SkillVerificationPage() {
  const verification = useQuery({ queryKey: ["skill-verification"], queryFn: () => apiFetch<SkillVerification[]>("/skillproof/verification") });
  if (verification.isLoading) return <LoadingSkeleton rows={5} />;
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Fake skill detection" title="Skill verification" description="Compare claimed skills against resume, projects, GitHub, and coding platform proof." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(verification.data ?? []).map((item) => (
          <Card key={item.id} className="soft-shadow">
            <CardHeader><CardTitle className="flex items-center justify-between gap-3 text-base"><span>{item.skillName}</span><StatusBadge status={item.proofLevel} label={item.proofLevel} /></CardTitle></CardHeader>
            <CardContent className="grid gap-3">
              <Progress value={item.confidenceScore} />
              <p className="text-sm text-muted-foreground">{item.suggestion}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function TpoTopStudentsPage() {
  const query = useQuery({ queryKey: ["tpo-top-students"], queryFn: () => apiFetch<Paginated<Record<string, unknown>>>("/tpo/reports/top-students?limit=25") });
  if (query.isLoading) return <LoadingSkeleton rows={5} />;
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Stage 2 reports" title="Top students by SkillProof" description="Rank students using SkillProof score, readiness, platform proof, and resume quality." />
      <div className="grid gap-4">
        {(query.data?.items ?? []).map((student) => (
          <Card key={String(student.id)} className="soft-shadow">
            <CardContent className="grid gap-3 p-5 md:grid-cols-[1.5fr_repeat(5,1fr)] md:items-center">
              <div><p className="font-semibold">{String(student.name)}</p><p className="text-sm text-muted-foreground">{String(student.branch ?? "Branch NA")} - CGPA {String(student.cgpa ?? "NA")}</p></div>
              <ScoreMini label="SkillProof" value={Number(student.skillProofScore ?? 0)} />
              <ScoreMini label="Readiness" value={Number(student.readinessScore ?? 0)} />
              <ScoreMini label="GitHub" value={Number(student.githubScore ?? 0)} />
              <ScoreMini label="LeetCode" value={Number(student.leetcodeScore ?? 0)} />
              <ScoreMini label="Resume" value={Number(student.resumeScore ?? 0)} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ScoreMini({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>{label}</span><span>{value}</span></div>
      <Progress value={value} />
    </div>
  );
}

export function TpoSkillGapReportPage() {
  const query = useQuery({ queryKey: ["tpo-skill-gap"], queryFn: () => apiFetch<{ mostMissingSkills: Array<{ name: string; count: number }>; suggestedTrainingSessions: string[]; companyWiseGaps: Array<Record<string, unknown>> }>("/tpo/reports/skill-gap?limit=25") });
  if (query.isLoading) return <LoadingSkeleton rows={5} />;
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Training intelligence" title="Skill gap report" description="Most missing skills, company-wise gaps, and suggested training sessions." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="soft-shadow"><CardHeader><CardTitle>Most missing skills</CardTitle></CardHeader><CardContent><SimpleBarChart data={query.data?.mostMissingSkills ?? []} xKey="name" yKey="count" /></CardContent></Card>
        <Card className="soft-shadow"><CardHeader><CardTitle>Suggested training</CardTitle></CardHeader><CardContent><Suggestions items={query.data?.suggestedTrainingSessions} /></CardContent></Card>
      </div>
      <div className="grid gap-3">
        {(query.data?.companyWiseGaps ?? []).slice(0, 12).map((gap, index) => (
          <div key={`${gap.student}-${gap.skill}-${index}`} className="rounded-xl border bg-card p-4 text-sm">
            <span className="font-medium">{String(gap.student)}</span> needs <Badge variant="warning">{String(gap.skill)}</Badge> for {String(gap.company)} {String(gap.role)}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TpoCompanyFitReportPage() {
  const drives = useQuery({ queryKey: ["drives"], queryFn: () => apiFetch<Paginated<Drive>>("/drives?limit=50") });
  const [driveId, setDriveId] = React.useState("");
  const report = useQuery({ queryKey: ["company-fit-report", driveId], enabled: Boolean(driveId), queryFn: () => apiFetch<{ students: Array<Record<string, unknown>> }>(`/tpo/reports/company-fit/${driveId}?limit=25`) });
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Company fit" title="Company fit report" description="Recommended candidates and match scores for each drive." />
      <Card className="soft-shadow"><CardContent className="pt-5"><Select value={driveId} onValueChange={setDriveId}><SelectTrigger><SelectValue placeholder="Select drive" /></SelectTrigger><SelectContent>{(drives.data?.items ?? []).map((drive) => <SelectItem key={drive.id} value={drive.id}>{drive.company.name} - {drive.role}</SelectItem>)}</SelectContent></Select></CardContent></Card>
      {!driveId ? <EmptyState icon={BriefcaseBusiness} title="Select a drive" message="Company-fit recommendations will appear after selecting a drive." /> : report.isLoading ? <LoadingSkeleton rows={5} /> : (
        <div className="grid gap-4">
          {(report.data?.students ?? []).slice(0, 20).map((student) => {
            const user = student.user as { name?: string; email?: string } | undefined;
            const match = student.match as { matchScore?: number; missingSkillsJson?: string[] } | undefined;
            const eligibility = student.eligibility as { status?: string } | undefined;
            return (
              <Card key={String(student.id)} className="soft-shadow">
                <CardContent className="grid gap-3 p-5 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:items-center">
                  <div><p className="font-semibold">{user?.name}</p><p className="text-sm text-muted-foreground">{user?.email}</p></div>
                  <ScoreMini label="Match" value={match?.matchScore ?? 0} />
                  <StatusBadge status={eligibility?.status ?? "UNKNOWN"} label={toTitle(eligibility?.status ?? "UNKNOWN")} />
                  <div className="flex flex-wrap gap-1">{list(match?.missingSkillsJson).slice(0, 3).map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>)}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TpoDriveRecommendationsPage() {
  return <TpoCompanyFitReportPage />;
}

export function TpoWeakSkillsReportPage() {
  const query = useQuery({ queryKey: ["tpo-weak-skills"], queryFn: () => apiFetch<{ weakSkills: Array<{ name: string; count: number }>; students: Array<Record<string, unknown>> }>("/tpo/reports/weak-skills?limit=25") });
  if (query.isLoading) return <LoadingSkeleton rows={5} />;
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Proof gaps" title="Weak skills report" description="Skills claimed by students that need stronger project, GitHub, or assessment proof." />
      <Card className="soft-shadow"><CardHeader><CardTitle>Weak skill distribution</CardTitle></CardHeader><CardContent><SimpleBarChart data={query.data?.weakSkills ?? []} xKey="name" yKey="count" /></CardContent></Card>
      <div className="grid gap-3 md:grid-cols-2">
        {(query.data?.students ?? []).slice(0, 20).map((item, index) => (
          <div key={`${item.student}-${item.skill}-${index}`} className="rounded-xl border bg-card p-4 text-sm">
            <span className="font-medium">{String(item.student)}</span> - <Badge variant="warning">{String(item.skill)}</Badge>
            <p className="mt-2 text-muted-foreground">{String(item.suggestion ?? "")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
